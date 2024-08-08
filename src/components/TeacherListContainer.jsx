import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddEntryContainer from "./AddEntryContainer";
import {
    fetchTeachers,
    addTeacher,
    editTeacher,
    removeTeacher,
} from "../features/teacherSlice";
import { RiEdit2Fill, RiDeleteBin7Line } from "react-icons/ri";
import SearchableDropdownToggler from "./searchableDropdown";

const TeacherListContainer = () => {
    const dispatch = useDispatch();

    const { teachers, status: teacherStatus } = useSelector(
        (state) => state.teacher
    );

    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );

    const [editTeacherId, setEditTeacherId] = useState(null);
    const [editTeacherValue, setEditTeacherValue] = useState("");
    const [editTeacherCurr, setEditTeacherCurr] = useState([]);
    const [openAddTeacherContainer, setOpenAddTeacherContainer] =
        useState(false);

    const handleEditTeacherClick = (teacher) => {
        setEditTeacherId(teacher.id);
        setEditTeacherValue(teacher.teacher);
        setEditTeacherCurr(teacher.subjects);
    };

    const handleSaveTeacherEditClick = (teacherId) => {
        dispatch(
            editTeacher({
                teacherId,
                updatedTeacher: {
                    teacher: editTeacherValue,
                    subjects: editTeacherCurr,
                },
            })
        );
        setEditTeacherId(null);
    };

    const handleCancelTeacherEditClick = () => {
        setEditTeacherId(null);
        setEditTeacherValue("");
        setEditTeacherCurr([]);
    };

    useEffect(() => {
        if (teacherStatus === "idle") {
            dispatch(fetchTeachers());
        }
    }, [teacherStatus, dispatch]);

    return (
        <React.Fragment>
            <div className="overflow-x-auto">
                <table className="table table-sm table-zebra">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Teacher ID</th>
                            <th>Teacher</th>
                            <th>subjects</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(teachers).map(([, teacher], index) => (
                            <tr key={teacher.id} className="group hover">
                                <th>{index + 1}</th>
                                <th>{teacher.id}</th>
                                <td>
                                    {editTeacherId === teacher.id ? (
                                        <input
                                            type="text"
                                            className="input input-bordered input-sm w-full"
                                            value={editTeacherValue}
                                            onChange={(e) =>
                                                setEditTeacherValue(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : (
                                        teacher.teacher
                                    )}
                                </td>

                                <td className="flex gap-2">
                                    {editTeacherId === teacher.id ? (
                                        <SearchableDropdownToggler
                                            selectedList={editTeacherCurr}
                                            setSelectedList={setEditTeacherCurr}
                                            isEditMode={true}
                                        />
                                    ) : (
                                        subjectStatus === "succeeded" &&
                                        teacher.subjects.map((subject) => (
                                            <div key={subject}>
                                                {subjects[subject].subject}
                                            </div>
                                        ))
                                    )}
                                </td>

                                <td>
                                    {editTeacherId === teacher.id ? (
                                        <>
                                            <button
                                                className="btn btn-xs btn-ghost text-green-500"
                                                onClick={() =>
                                                    handleSaveTeacherEditClick(
                                                        teacher.id
                                                    )
                                                }
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="btn btn-xs btn-ghost text-red-500"
                                                onClick={() =>
                                                    handleCancelTeacherEditClick()
                                                }
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="btn btn-xs btn-ghost text-red-500"
                                                onClick={() =>
                                                    handleEditTeacherClick(
                                                        teacher
                                                    )
                                                }
                                            >
                                                <RiEdit2Fill size={20} />
                                            </button>
                                            <button
                                                className="btn btn-xs btn-ghost text-red-500"
                                                onClick={() =>
                                                    dispatch(
                                                        removeTeacher(
                                                            teacher.id
                                                        )
                                                    )
                                                }
                                            >
                                                <RiDeleteBin7Line size={20} />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <button
                    className="btn btn-secondary"
                    onClick={() => {
                        setOpenAddTeacherContainer(true);
                    }}
                >
                    Add Teacher
                </button>

                {openAddTeacherContainer && (
                    <AddEntryContainer
                        close={() => setOpenAddTeacherContainer(false)}
                        reduxField={["teacher", "subjects"]}
                        reduxFunction={addTeacher}
                    />
                )}
            </div>
        </React.Fragment>
    );
};

export default TeacherListContainer;
