import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addSection } from "../features/sectionSlice";
import escapeRegExp from "../utils/escapeRegExp";
import { toast } from "sonner";
import { IoAdd, IoChevronDown, IoRemove, IoRemoveCircleOutline } from "react-icons/io5";

const AddSectionContainer = ({ close }) => {
    const subjects = useSelector((state) => state.subject.subjects);
    const sections = useSelector((state) => state.section.sections);
    const dispatch = useDispatch();

    const [sectionInputValue, setSectionInputValue] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [searchSubjectValue, setSearchSubjectValue] = useState("");

    const handleInputChange = (e, setValue) => {
        setValue(e.target.value);
    };

    Object.filter = (obj, predicate) =>
        Object.fromEntries(Object.entries(obj).filter(predicate));

    const searchResults = Object.filter(subjects, ([key, subject]) => {
        const escapedSearchValue = escapeRegExp(searchSubjectValue)
            .split("\\*")
            .join(".*");

        const pattern = new RegExp(escapedSearchValue, "i");

        return pattern.test(subject.subject);
    });

    const toggleSubject = (subjectID) => {
        toast("Enter to submit");

        if (selectedSubjects.includes(subjectID)) {
            setSelectedSubjects(
                selectedSubjects.filter((s) => s !== subjectID)
            );
        } else {
            setSelectedSubjects([...selectedSubjects, subjectID]);
        }
    };

    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleBlur = () => {
            setTimeout(() => {
                searchInputRef.current.focus();
            }, 0);
        };

        if (searchInputRef.current) {
            searchInputRef.current.addEventListener("blur", handleBlur);
        }

        return () => {
            if (searchInputRef.current) {
                searchInputRef.current.removeEventListener("blur", handleBlur);
            }
        };
    }, [searchSubjectValue]);

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchSubjectValue]);

    return (
        <div className="card bg-base-200 p-4">
            AddSectionContainer
            <button
                className="btn btn-xs btn-circle btn-outline"
                onClick={close}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="inline-block w-4 h-4 stroke-current"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                    ></path>
                </svg>
            </button>
            {selectedSubjects.map((subjectID) => (
                <div
                    key={subjectID}
                    className="badge badge-secondary m-1 cursor-pointer"
                    onClick={() => toggleSubject(subjectID)}
                >
                    {subjects[subjectID].subject}
                </div>
            ))}
            <input
                type="text"
                placeholder="Section Name"
                required
                className="input input-bordered input-sm w-full max-w-xs"
                value={sectionInputValue}
                onChange={(e) => {
                    handleInputChange(e, setSectionInputValue);
                }}
                // onKeyDown={(e) => {
                //     if (e.key === "Enter") {
                //         e.preventDefault();
                //         dispatch(addSection(sectionInputValue));
                //         setSectionInputValue("");
                //     }
                // }}
            />
            <div className="dropdown">
                <div tabIndex={0} role="button" className="btn m-1">
                    <div>Add subject</div>
                    <IoChevronDown size={16} />
                </div>
                <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                >
                    <li>
                        <input
                            // role="buton"
                            type="text"
                            placeholder="Search subject"
                            ref={searchInputRef}
                            className="input input-bordered input-sm w-full max-w-xs"
                            value={searchSubjectValue}
                            onChange={(e) => {
                                handleInputChange(e, setSearchSubjectValue);
                            }}
                        />
                    </li>
                    {Object.keys(searchResults).length === 0 ? (
                        <div className="px-4 py-2 opacity-50">Not found</div>
                    ) : (
                        Object.entries(searchResults).map(
                            ([_, subject], index) => (
                                <li
                                    role="button"
                                    key={subject.id}
                                    onClick={() => toggleSubject(subject.id)}
                                >
                                    <div className="flex justify-between">
                                        <a>{subject.subject}</a>
                                        {selectedSubjects.includes(
                                            subject.id
                                        ) ? (
                                            <IoRemove
                                                size={20}
                                                className="text-secondary"
                                            />
                                        ) : (
                                            <IoAdd
                                                size={20}
                                                className="text-primary"
                                            />
                                        )}
                                    </div>
                                </li>
                            )
                        )
                    )}
                </ul>
            </div>
            <button
                className="btn btn-primary"
                onClick={() =>
                    dispatch(
                        addSection({
                            section: sectionInputValue,
                            subjects: selectedSubjects,
                        })
                    )
                }
            >
                <div>Add Section</div>
                <IoAdd size={20} />
            </button>
        </div>
    );
};

export default AddSectionContainer;
