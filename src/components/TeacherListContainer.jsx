import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddEntryContainer from "./AddEntryContainer";
import {
    fetchTeachers,
    addTeacher,
    editTeacher,
    removeTeacher,
} from "../features/teacherSlice";
import debounce from "debounce";
import { RiEdit2Fill, RiDeleteBin7Line } from "react-icons/ri";
import SearchableDropdownToggler from "./searchableDropdown";
import { filterObject } from "../utils/filterObject";
import escapeRegExp from "../utils/escapeRegExp";
import { IoAdd, IoSearch } from "react-icons/io5";

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
    const [searchTeacherResult, setSearchTeacherResult] = useState(teachers);
    const [searchTeacherValue, setSearcTeacherValue] = useState("");
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

    const debouncedSearch = useCallback(
        debounce((searchValue, teachers) => {
            setSearchTeacherResult(
                filterObject(teachers, ([, teacher]) => {
                    const escapedSearchValue = escapeRegExp(searchValue)
                        .split("\\*")
                        .join(".*");

                    const pattern = new RegExp(escapedSearchValue, "i");

                    return pattern.test(teacher.teacher);
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        debouncedSearch(searchTeacherValue, teachers);
    }, [searchTeacherValue, teachers, debouncedSearch]);

    useEffect(() => {
        if (teacherStatus === "idle") {
            dispatch(fetchTeachers());
        }
    }, [teacherStatus, dispatch]);

    return (
        <React.Fragment>
            <div className="">
                <label className="input input-sm input-bordered flex items-center gap-2">
                    <input
                        type="text"
                        className="grow"
                        placeholder="Search Teacher"
                        value={searchTeacherValue}
                        onChange={(e) => setSearcTeacherValue(e.target.value)}
                    />
                    <IoSearch />
                </label>

                <table className="table table-sm table-zebra">
                    <thead>
                        <tr>
                            <th className="w-8">#</th>
                            <th>Teacher ID</th>
                            <th>Teacher</th>
                            <th>Subject Specialization</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(searchTeacherResult).length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center">
                                    No teachers found
                                </td>
                            </tr>
                        ) : (
                            Object.entries(searchTeacherResult).map(
                                ([, teacher], index) => (
                                    <tr
                                        key={teacher.id}
                                        className="group hover"
                                    >
                                        <td>{index + 1}</td>
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

                                        <td className="flex gap-1 flex-wrap">
                                            {editTeacherId === teacher.id ? (
                                                <SearchableDropdownToggler
                                                    selectedList={
                                                        editTeacherCurr
                                                    }
                                                    setSelectedList={
                                                        setEditTeacherCurr
                                                    }
                                                    isEditMode={true}
                                                />
                                            ) : (
                                                subjectStatus === "succeeded" &&
                                                teacher.subjects.map(
                                                    (subject) => (
                                                        <div
                                                            key={subject}
                                                            className="px-2 border border-gray-500 border-opacity-30"
                                                        >
                                                            {
                                                                subjects[
                                                                    subject
                                                                ].subject
                                                            }
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </td>

                                        <td className="w-28 text-right">
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
                                                        <RiEdit2Fill
                                                            size={20}
                                                        />
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
                                                        <RiDeleteBin7Line
                                                            size={20}
                                                        />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )
                            )
                        )}
                    </tbody>
                </table>
            </div>

            <div>
                {openAddTeacherContainer ? (
                    <AddEntryContainer
                        close={() => setOpenAddTeacherContainer(false)}
                        reduxField={["teacher", "subjects"]}
                        reduxFunction={addTeacher}
                    />
                ) : (
                    <button
                        className="btn btn-secondary my-5"
                        onClick={() => {
                            setOpenAddTeacherContainer(true);
                        }}
                    >
                        Add Teacher
                        <IoAdd size={26} />
                    </button>
                )}
            </div>
        </React.Fragment>
    );
};

export default TeacherListContainer;
