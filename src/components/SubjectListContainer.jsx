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
import { IoSearch } from "react-icons/io5";
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

            console.log(searchValue, searchSubjectResult);
        }, 200),
        []
    );

    useEffect(() => {
        debouncedSearch(searchSubjectValue, subjects);
    }, [searchSubjectValue, subjects, debouncedSearch]);

    useEffect(() => {
        console.log("searchSubjectResult", searchSubjectResult);
    }, [searchSubjectResult]);

    function resize() {
        console.log("height", window.innerHeight);
        console.log("width", window.innerWidth);
    }

    window.onresize = debounce(resize, 1000);

    return (
        <div className="overflow-x-auto">
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
                        <th>#</th>
                        <th>Subject ID</th>
                        <th>Subject</th>
                        <th>Actions</th>
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
                                    <th>{index + 1}</th>
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
                                    <td>
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
                <input
                    type="text"
                    placeholder="subject"
                    className="input input-bordered input-sm w-full max-w-xs"
                    value={subjectInputValue}
                    onChange={(e) => {
                        handleInputChange(e);
                    }}
                    onKeyDown={(e) => {
                        handleKeyDown(e);
                    }}
                />
            </div>
        </div>
    );
};

export default SubjectListContainer;
