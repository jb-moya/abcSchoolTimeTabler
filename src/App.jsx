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
    editSubject,
    removeSubject,
} from "./features/subjectSlice";

import {
    removeTeacher,
    addTeacher,
    editTeacher,
    fetchTeachers,
} from "./features/teacherSlice";

import {
    removeSection,
    addSection,
    editSection,
    fetchSections,
} from "./features/sectionSlice";

import { toast } from "sonner";
import { IoAdd, IoRemove } from "react-icons/io5";
import { RiDeleteBin7Line } from "react-icons/ri";

import { wrap } from "comlink";
import WasmWorker from "./wasm.worker?worker";
const wasmWorker = wrap(new WasmWorker());

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

    const [result, setResult] = useState(0);

    const getResult = async () => {
        const result = await wasmWorker(1, 4);
        setResult(result);
    };
    useEffect(() => {
        getResult();
    }, []);

    const dispatch = useDispatch();
    const { instance } = useWasm();

    const [openAddSectionContainer, setOpenAddSectionContainer] =
        useState(false);

    const [subjectInputValue, setSubjectInputValue] = useState("");

    const [teacherInputValue, setTeacherInputValue] = useState("");

    const [editSubjectId, setEditSubjectId] = useState(null);
    const [editSubjectValue, setEditSubjectValue] = useState('');

    const [editTeacherId, setEditTeacherId] = useState(null);
    const [editTeacherValue, setEditTeacherValue] = useState('');

    const [editSectionId, setEditSectionId] = useState(null);
    const [editSectionValue, setEditSectionValue] = useState('');
    const [editSectionCurr, setEditSectionCurr] = useState([]);
    const [searchSubjectValue, setSearchSubjectValue] = useState("");

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
                dispatch(set({ [fieldName]: inputValue }));
                setInputValue(""); // Clear the input field
            }
        }
    };

    function handleEditSubjectClick(subject) {
        setEditSubjectId(subject.id);
        setEditSubjectValue(subject.subject);
    }

    function handleSaveSubjectEditClick(subjectId) {
        dispatch(editSubject({ subjectId, updatedSubject: { subject: editSubjectValue } }));
        setEditSubjectId(null);
    }

    function handleCancelSubjectEditClick() {
        setEditSubjectId(null);
        setEditSubjectValue("");
    }

    function handleEditTeacherClick(teacher) {
        setEditTeacherId(teacher.id);
        setEditTeacherValue(teacher.teacher);
    }

    function handleSaveTeacherEditClick(teacherId) {
        dispatch(editTeacher({ teacherId, updatedTeacher: { teacher: editTeacherValue } }));
        setEditTeacherId(null);
    }

    function handleCancelTeacherEditClick() {
        setEditTeacherId(null);
        setEditTeacherValue("");
    }

    function handleEditSectionClick(section) {
        setEditSectionId(section.id);
        setEditSectionValue(section.section);
        setEditSectionCurr(section.subjects);
    }

    function handleSaveSectionEditClick(sectionId) {
        dispatch(editSection({
            sectionId,
            updatedSection: {
                section: editSectionValue,
                subjects: editSectionCurr
            }
        }));
        setEditSectionId(null);
    }

    function handleCancelSectionEditClick() {
        setEditSectionId(null);
        setEditSectionValue("");
        setEditSectionCurr([]);
        // console.log("editSectionCurr: ",editSectionCurr);
    }

    const toggleSubject = (subjectId) => {
        setEditSectionCurr((prev) =>
            prev.includes(subjectId)
                ? prev.filter((id) => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    Object.filter = (obj, predicate) =>
        Object.fromEntries(Object.entries(obj).filter(predicate));

    const searchResults = Object.filter(subjects, ([, subject]) => {
        const escapedSearchValue = searchSubjectValue
            .split("\\*")
            .join(".*");

        const pattern = new RegExp(escapedSearchValue, "i");

        return pattern.test(subject.subject);
    });

    const handleButtonClick = () => {
        if (!instance) return;

        const subjectMap = Object.entries(subjects).reduce(
            (acc, [key, value], index) => {
                acc[index] = value.id;
                return acc;
            },
            {}
        );

        const subjectMapReverse = Object.entries(subjects).reduce(
            (acc, [key, value], index) => {
                acc[value.id] = index;
                return acc;
            },
            {}
        );

        const teacherMap = Object.entries(teachers).reduce(
            (acc, [key, value], index) => {
                acc[index] = value.id;
                return acc;
            },
            {}
        );

        const sectionMap = Object.entries(sections).reduce(
            (acc, [key, value], index) => {
                acc[index] = value.subjects.map(
                    (subjectID) => subjectMapReverse[subjectID]
                );
                return acc;
            },
            {}
        );

        console.log("subjectMap", subjectMap);
        console.log("teacherMap", teacherMap);
        console.log("subjectMapReverse", subjectMapReverse);
        console.log("sectionMap", sectionMap);

        const sectionSubjectArray = [];
        console.log("sectionMap", sectionMap);
        for (const [sectionKey, subjects] of Object.entries(sectionMap)) {
            for (const subject of subjects) {
                sectionSubjectArray.push(packInt16ToInt32(sectionKey, subject));
                // console.log(sectionKey, subject);
            }
        }

        const sectionSubjects = new Int32Array([...sectionSubjectArray]);

        const max_iterations = 10000;
        const beesPopulations = 5;
        const beesEmployedOptions = 5;
        const beesOnlookerOptions = 2;
        const beesScoutOptions = 2;
        const limits = 800;

        console.log(
            "Object.keys(sectionMap).length",
            Object.keys(sectionMap).length
        );
        console.log(
            "Object.keys(teacherMap).length",
            Object.keys(teacherMap).length
        );
        console.log("sectionSubjectArray.length", sectionSubjectArray.length);
        const num_teachers = Object.keys(teacherMap).length;
        const num_rooms = 7;
        const num_timeslots = 8;
        const total_school_class = sectionSubjectArray.length;
        const total_section = Object.keys(sectionMap).length;

        const sectionSubjectsBuff = instance._malloc(
            sectionSubjects.length * sectionSubjects.BYTES_PER_ELEMENT
        );

        instance.HEAP32.set(
            sectionSubjects,
            sectionSubjectsBuff / sectionSubjects.BYTES_PER_ELEMENT
        );

        const teacherSubjectsLength = 0;

        const teacherSubjects = new Int32Array([
            // packInt16ToInt32(0, 0),
            // packInt16ToInt32(0, 1),
            // packInt16ToInt32(0, 3),
            // packInt16ToInt32(1, 2),
            // packInt16ToInt32(2, 3),
            // packInt16ToInt32(3, 4),
            // packInt16ToInt32(4, 5),
            // packInt16ToInt32(5, 6),
            // packInt16ToInt32(6, 7),
        ]);

        // const teacherSubjectsBuff = await malloc(
        //     teacherSubjects.length * teacherSubjects.BYTES_PER_ELEMENT
        // );

        // // Use HEAP32 to write the Int32Array data into the allocated memory
        // await setHEAP32(
        //     teacherSubjects,
        //     teacherSubjectsBuff / teacherSubjects.BYTES_PER_ELEMENT
        // );

        const resultBuff = instance._malloc(total_school_class * 8);

        await new Promise((resolve, reject) => {
            try {
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
                        teacherSubjectsLength,
                        beesPopulations,
                        beesEmployedOptions,
                        beesOnlookerOptions,
                        beesScoutOptions,
                        limits,
                        resultBuff,
                    ]
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        // await instance.ccall(
        //     "runExperiment",
        //     null,
        //     [
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //         "number",
        //     ],
        //     [
        //         max_iterations,
        //         num_teachers,
        //         num_rooms,
        //         num_timeslots,
        //         total_school_class,
        //         total_section,
        //         sectionSubjectsBuff,
        //         teacherSubjectsBuff,
        //         teacherSubjectsLength,
        //         beesPopulations,
        //         beesEmployedOptions,
        //         beesOnlookerOptions,
        //         beesScoutOptions,
        //         limits,
        //         resultBuff,
        //     ]
        // );

        for (let i = 0; i < total_school_class; i++) {
            let result = instance.getValue(resultBuff + i * 8, "i64");

            console.log(`Class ${i + 1}: ${result}`);
        }

        // await free(sectionSubjectsBuff);
        // await free(teacherSubjectsBuff);
        // await free(resultBuff);
    };

    useEffect(() => {}, [teachers]);

    return (
        <div className="App container mx-auto px-4">
            <header className="App-header">
                <Navbar />
                <div className="p-10 bg-pink-600">{result}</div>
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
                                        ([, subject], index) => (
                                            <tr
                                                key={subject.id}
                                                className="group hover:text-accent"
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
                                        ([, teacher], index) => (
                                            <tr
                                                key={teacher.id}
                                                className="group hover:text-accent"
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
                                        <td>
                                            {editSectionId === section.id ? (
                                                <input
                                                    type="text"
                                                    value={editSectionValue}
                                                    onChange={(e) => setEditSectionValue(e.target.value)}
                                                    className="input input-bordered input-sm w-full"
                                                />
                                            ) : (
                                                section.section
                                            )}
                                        </td>
                                        <td className="flex gap-2">
                                            {editSectionId === section.id ? (
                                                <div className="dropdown dropdown-open">
                                                    <input
                                                        role="button"
                                                        type="text"
                                                        placeholder="Search subject"
                                                        className="input input-bordered input-sm w-full max-w-xs"
                                                        value={searchSubjectValue}
                                                        onChange={(e) => handleInputChange(e, setSearchSubjectValue)}
                                                    />
                                                    <ul
                                                        tabIndex={0}
                                                        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                                                    >
                                                        {Object.keys(searchResults).length === 0 ? (
                                                            <div className="px-4 py-2 opacity-50">Not found</div>
                                                        ) : (
                                                            Object.entries(searchResults).map(
                                                                ([, subject]) => (
                                                                    <li
                                                                        role="button"
                                                                        key={subject.id}
                                                                        onClick={() => toggleSubject(subject.id)}
                                                                    >
                                                                        <div className="flex justify-between">
                                                                            <a>{subject.subject}</a>
                                                                            {editSectionCurr.includes(subject.id) ? (
                                                                                <IoRemove size={20} className="text-secondary" />
                                                                            ) : (
                                                                                <IoAdd size={20} className="text-primary" />
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                )
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            ) : (
                                                subjectStatus === "succeeded" &&
                                                section.subjects.map((subject) => (
                                                    <div key={subject}>
                                                        {subjects[subject].subject}
                                                    </div>
                                                ))
                                            )}
                                        </td>
                                        <td>
                                            {editSectionId === section.id ? (
                                                <>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-green-500"
                                                        onClick={() => handleSaveSectionEditClick(section.id)}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-red-500"
                                                        onClick={handleCancelSectionEditClick}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-red-500"
                                                        onClick={() => handleEditSectionClick(section)}
                                                    >
                                                        <RiEdit2Fill size={20} />
                                                    </button>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-red-500"
                                                        onClick={() => dispatch(removeSection(section.id))}
                                                    >
                                                        <RiDeleteBin7Line size={20} />
                                                    </button>
                                                </>
                                            )}
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
