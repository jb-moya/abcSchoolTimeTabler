import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RiEdit2Fill, RiDeleteBin7Line } from "react-icons/ri";
import { useDispatch } from "react-redux";
import {
    fetchSubjects,
    addSubject,
    editSubject,
    removeSubject,
} from "../features/subjectSlice";
import { IoAdd, IoSearch } from "react-icons/io5";
import debounce from "debounce";
import { filterObject } from "../utils/filterObject";
import escapeRegExp from "../utils/escapeRegExp";

const SubjectListContainer = () => {
    const dispatch = useDispatch();
    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );

    const [editSubjectId, setEditSubjectId] = useState(null);
    const [searchSubjectResult, setSearchSubjectResult] = useState(subjects);
    const [editSubjectValue, setEditSubjectValue] = useState("");
    const [subjectInputValue, setSubjectInputValue] = useState("");
    const [searchSubjectValue, setSearchSubjectValue] = useState("");

    const handleInputChange = (e) => {
        setSubjectInputValue(e.target.value);
    };

    const handleEditSubjectClick = (subject) => {
        setEditSubjectId(subject.id);
        setEditSubjectValue(subject.subject);
    };

    const handleSaveSubjectEditClick = (subjectId) => {
        dispatch(
            editSubject({
                subjectId,
                updatedSubject: { subject: editSubjectValue },
            })
        );
        setEditSubjectId(null);
    };

    const handleCancelSubjectEditClick = () => {
        setEditSubjectId(null);
        setEditSubjectValue("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (subjectInputValue.trim()) {
                dispatch(addSubject({ subject: subjectInputValue }));
                setSubjectInputValue("");
            }
        }
    };

    useEffect(() => {
        if (subjectStatus === "idle") {
            dispatch(fetchSubjects());
        }
    }, [subjectStatus, dispatch]);

    const debouncedSearch = useCallback(
        debounce((searchValue, subjects) => {
            setSearchSubjectResult(
                filterObject(subjects, ([, subject]) => {
                    const escapedSearchValue = escapeRegExp(searchValue)
                        .split("\\*")
                        .join(".*");

                    const pattern = new RegExp(escapedSearchValue, "i");

                    return pattern.test(subject.subject);
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        debouncedSearch(searchSubjectValue, subjects);
    }, [searchSubjectValue, subjects, debouncedSearch]);

    useEffect(() => {
        // console.log("searchSubjectResult", searchSubjectResult);
    }, [searchSubjectResult]);

    return (
        <div className="">
            <label className="input input-sm input-bordered flex items-center gap-2">
                <input
                    type="text"
                    className="grow"
                    placeholder="Search Subject"
                    value={searchSubjectValue}
                    onChange={(e) => setSearchSubjectValue(e.target.value)}
                />
                <IoSearch />
            </label>

            <table className="table table-sm table-zebra">
                <thead>
                    <tr>
                        <th className="w-8">#</th>
                        <th>Subject ID</th>
                        <th>Subject</th>
                        <th className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.values(searchSubjectResult).length === 0 ? (
                        <tr>
                            <td colSpan="4" className="text-center">
                                No subjects found
                            </td>
                        </tr>
                    ) : (
                        Object.entries(searchSubjectResult).map(
                            ([, subject], index) => (
                                <tr key={subject.id} className="group hover">
                                    <td>{index + 1}</td>
                                    <th>{subject.id}</th>
                                    <td>
                                        {editSubjectId === subject.id ? (
                                            <input
                                                type="text"
                                                value={editSubjectValue}
                                                onChange={(e) =>
                                                    setEditSubjectValue(
                                                        e.target.value
                                                    )
                                                }
                                                className="input input-bordered input-sm w-full"
                                            />
                                        ) : (
                                            subject.subject
                                        )}
                                    </td>
                                    <td className="w-28 text-right">
                                        {editSubjectId === subject.id ? (
                                            <>
                                                <button
                                                    className="btn btn-xs btn-ghost text-green-500"
                                                    onClick={() =>
                                                        handleSaveSubjectEditClick(
                                                            subject.id
                                                        )
                                                    }
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-ghost text-red-500"
                                                    onClick={() =>
                                                        handleCancelSubjectEditClick()
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
                                                        handleEditSubjectClick(
                                                            subject
                                                        )
                                                    }
                                                >
                                                    <RiEdit2Fill size={20} />
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-ghost text-red-500"
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
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )
                        )
                    )}
                </tbody>
            </table>

            <div>
                <label className="my-2 input input-sm input-bordered flex w-full max-w-xs items-center gap-2  border-secondary">
                    <input
                        type="text"
                        placeholder="add subject"
                        className="grow"
                        value={subjectInputValue}
                        onChange={(e) => {
                            handleInputChange(e);
                        }}
                        onKeyDown={(e) => {
                            handleKeyDown(e);
                        }}
                    />

                    <IoAdd size={26} />
                </label>
            </div>
        </div>
    );
};

export default SubjectListContainer;
