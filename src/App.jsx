import { useState, useEffect } from "react";
import { useWasm } from "./hooks/useWasm";
import packInt16ToInt32 from "./utils/packInt16ToInt32";
import { unpackInt64ToInt16 } from "./utils/packInt16ToInt64";
import Navbar from "./components/Navbar";
import AddSectionContainer from "./components/AddSectionContainer";
import { useSelector, useDispatch } from "react-redux";
import {
    fetchSubjects,
    addSubject,
    removeSubject,
} from "./features/subjectSlice";
import {
    removeTeacher,
    addTeacher,
    fetchTeachers,
} from "./features/teacherSlice";
import {
    removeSection,
    addSection,
    fetchSections,
} from "./features/sectionSlice";

import { toast } from "sonner";
import { RiDeleteBin7Line } from "react-icons/ri";

function App() {
    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );
    const { teachers, status: teacherStatus } = useSelector(
        (state) => state.teacher
    );
    const { sections, status: sectionStatus } = useSelector(
        (state) => state.section
    );

    const dispatch = useDispatch();
    const { instance } = useWasm();
    const max_iterations = 70000;
    const beesPopulations = 5;
    const beesEmployedOptions = 5;
    const beesOnlookerOptions = 2;
    const beesScoutOptions = 2;
    const limits = 800;

    const num_teachers = 7;
    const num_rooms = 7;
    const num_timeslots = 7;
    const total_school_class = 5;
    const total_section = 1;

    const [openAddSectionContainer, setOpenAddSectionContainer] =
        useState(false);

    const [subjectInputValue, setSubjectInputValue] = useState("");

    const [teacherInputValue, setTeacherInputValue] = useState("");

    const handleInputChange = (e, setInputValue) => {
        setInputValue(e.target.value);
    };

    useEffect(() => {
        if (subjectStatus === "idle") {
            dispatch(fetchSubjects());
        }
    }, [subjectStatus, dispatch]);

    useEffect(() => {
        if (teacherStatus === "idle") {
            dispatch(fetchTeachers());
        }
    }, [teacherStatus, dispatch]);

    useEffect(() => {
        if (sectionStatus === "idle") {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

    const handleKeyDown = (e, fieldName, inputValue, setInputValue, set) => {
        toast("Enter to submit");
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent default form submission
            if (inputValue.trim()) {
                console.log("inputvalue", inputValue);
                dispatch(set({ [fieldName]: inputValue }));
                setInputValue(""); // Clear the input field
            }
        }
    };

    const handleButtonClick = () => {
        if (!instance) return;
        console.log("clicked", instance);

        const sectionSubjects = new Int32Array([
            packInt16ToInt32(0, 1),
            packInt16ToInt32(0, 2),
            packInt16ToInt32(0, 3),
            packInt16ToInt32(0, 4),
            packInt16ToInt32(0, 5),
        ]);
        const sectionSubjectsBuff = instance._malloc(
            sectionSubjects.length * sectionSubjects.BYTES_PER_ELEMENT
        );
        instance.HEAP32.set(
            sectionSubjects,
            sectionSubjectsBuff / sectionSubjects.BYTES_PER_ELEMENT
        );

        const teacherSubjects = new Int32Array([
            packInt16ToInt32(0, 1),
            packInt16ToInt32(1, 2),
            packInt16ToInt32(2, 3),
            packInt16ToInt32(3, 4),
            packInt16ToInt32(4, 5),
            packInt16ToInt32(5, 6),
            packInt16ToInt32(6, 7),
        ]);

        const teacherSubjectsBuff = instance._malloc(
            teacherSubjects.length * teacherSubjects.BYTES_PER_ELEMENT
        );

        // Use HEAP32 to write the Int32Array data into the allocated memory
        instance.HEAP32.set(
            teacherSubjects,
            teacherSubjectsBuff / teacherSubjects.BYTES_PER_ELEMENT
        );

        const resultBuff = instance._malloc(total_school_class * 8);

        instance.ccall(
            "runExperiment",
            null,
            [
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
            ],
            [
                max_iterations,
                num_teachers,
                num_rooms,
                num_timeslots,
                total_school_class,
                total_section,
                sectionSubjectsBuff,
                teacherSubjectsBuff,
                beesPopulations,
                beesEmployedOptions,
                beesOnlookerOptions,
                beesScoutOptions,
                limits,
                resultBuff,
            ]
        );

        for (let i = 0; i < total_school_class; i++) {
            let result = instance.getValue(resultBuff + i * 8, "i64");

            console.log(unpackInt64ToInt16(result));
        }

        instance._free(sectionSubjectsBuff);
        instance._free(teacherSubjectsBuff);
        instance._free(resultBuff);
    };

    useEffect(() => {
        console.log("faflasjdfsdjsdljdf");
    }, [teachers]);

    return (
        <div className="App container mx-auto px-4">
            <header className="App-header">
                <Navbar />
                <div className="flex gap-4">
                    <div className="w-4/12">
                        <div className="overflow-x-auto">
                            <table className="table table-sm table-zebra">
                                {/* head */}
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Subject ID</th>
                                        <th>Subject</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(subjects).map(
                                        ([_, subject], index) => (
                                            <tr
                                                key={subject.id}
                                                className="group hover"
                                            >
                                                <th>{index + 1}</th>
                                                <th>{subject.id}</th>
                                                <td>{subject.subject}</td>
                                                <td>
                                                    <button
                                                        className="group-hover:block hidden btn btn-xs btn-ghost text-red-500"
                                                        onClick={() =>
                                                            dispatch(
                                                                removeSubject(
                                                                    subject.id
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <RiDeleteBin7Line
                                                            size={20}
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="subject"
                                className="input input-bordered input-sm w-full max-w-xs"
                                value={subjectInputValue}
                                onChange={(e) => {
                                    handleInputChange(e, setSubjectInputValue);
                                }}
                                onKeyDown={(e) => {
                                    handleKeyDown(
                                        e,
                                        "subject",
                                        subjectInputValue,
                                        setSubjectInputValue,
                                        addSubject
                                    );
                                }}
                            />
                        </div>
                    </div>
                    <div className="w-8/12">
                        <div className="overflow-x-auto">
                            <table className="table table-sm table-zebra">
                                {/* head */}
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Teacher ID</th>
                                        <th>Teacher</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(teachers).map(
                                        ([_, teacher], index) => (
                                            <tr
                                                key={teacher.id}
                                                className="group hover"
                                            >
                                                <th>{index + 1}</th>
                                                <th>{teacher.id}</th>
                                                <td>{teacher.teacher}</td>
                                                <td>
                                                    <button
                                                        className="group-hover:block hidden btn btn-xs btn-ghost text-red-500"
                                                        onClick={() =>
                                                            dispatch(
                                                                removeTeacher(
                                                                    teacher.id
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <RiDeleteBin7Line
                                                            size={20}
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="teachers"
                                className="input input-bordered input-sm w-full max-w-xs"
                                value={teacherInputValue}
                                onChange={(e) => {
                                    handleInputChange(e, setTeacherInputValue);
                                }}
                                onKeyDown={(e) => {
                                    handleKeyDown(
                                        e,
                                        "teacher",
                                        teacherInputValue,
                                        setTeacherInputValue,
                                        addTeacher
                                    );
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="w-8/12">
                    <div className="overflow-x-auto">
                        <table className="table table-sm table-zebra">
                            {/* head */}
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Section ID</th>
                                    <th>Section</th>
                                    <th>Subjects</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(sections).map(
                                    ([_, section], index) => (
                                        <tr
                                            key={section.id}
                                            className="group hover"
                                        >
                                            <th>{index + 1}</th>
                                            <th>{section.id}</th>
                                            <td>{section.section}</td>
                                            <td className="flex gap-2">
                                                {subjectStatus == "succeeded" &&
                                                    section.subjects.map(
                                                        (subject) => (
                                                            console.log(
                                                                "qgv",
                                                                subjects[
                                                                    subject
                                                                ].subject
                                                            ),
                                                            (
                                                                <div
                                                                    key={
                                                                        subject
                                                                    }
                                                                >
                                                                    {
                                                                        subjects[
                                                                            subject
                                                                        ]
                                                                            .subject
                                                                    }
                                                                </div>
                                                            )
                                                        )
                                                    )}
                                            </td>
                                            <td>
                                                <button
                                                    className="group-hover:block hidden btn btn-xs btn-ghost text-red-500"
                                                    onClick={() =>
                                                        dispatch(
                                                            removeSection(
                                                                section.id
                                                            )
                                                        )
                                                    }
                                                >
                                                    <RiDeleteBin7Line
                                                        size={20}
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <button
                            className="btn btn-primary"
                            onClick={() => handleButtonClick()}
                        >
                            Run
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setOpenAddSectionContainer(true);
                            }}
                        >
                            Add Section
                        </button>

                        {openAddSectionContainer && (
                            <AddSectionContainer
                                close={() => setOpenAddSectionContainer(false)}
                            />
                        )}
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;

// /* eslint-disable no-undef */
// /* eslint-disable  no-restricted-globals */
// /* eslint-disable  no-unused-expressions */
// /* eslint-disable import/no-amd */
