import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addSection } from "../features/sectionSlice";
import escapeRegExp from "../utils/escapeRegExp";
import { toast } from "sonner";
import { IoAdd, IoRemove, IoRemoveCircleOutline } from "react-icons/io5";

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

    return (
        <div className="border p-2">
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
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        dispatch(addSection(sectionInputValue));
                        setSectionInputValue("");
                    }
                }}
            />
            <div className="dropdown dropdown-open">
                <input
                    role="buton"
                    type="text"
                    placeholder="Search subject"
                    className="input input-bordered input-sm w-full max-w-xs"
                    value={searchSubjectValue}
                    onChange={(e) => {
                        handleInputChange(e, setSearchSubjectValue);
                    }}
                />
                <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                >
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
