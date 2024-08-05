import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addSection } from "../features/sectionSlice";

const AddSectionContainer = () => {
    const subjects = useSelector((state) => state.subject.subjects);
    const sections = useSelector((state) => state.section.sections);
    const dispatch = useDispatch();

    const [sectionInputValue, setSectionInputValue] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [searchSubjectValue, setSearchSubjectValue] = useState("");

    const handleInputChange = (e, setValue) => {
        setValue(e.target.value);
    };

    const searchSubjects = (subjects, searchValue) => {
        // Convert the search value to a regex pattern with wildcard support
        const pattern = new RegExp(searchValue.split("*").join(".*"), "i"); // 'i' for case-insensitive

        console.log("subjects", subjects);
        // Filter the subjects based on the pattern
        console.log("searchValue", searchValue);
        console.log(
            Array(subjects).filter((subjectName) => pattern.test(subjectName))
        );
        return subjects.filter((subjectName) =>
            pattern.test(subjectName)
        );
    };

    const searchResults = searchSubjects(subjects, searchSubjectValue);

    return (
        <div className="border p-2">
            AddSectionContainer
            <button className="btn btn-xs btn-circle btn-outline">
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
            <input
                type="text"
                placeholder="Section Name"
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
                {/* <div tabIndex={0} role="button" className="btn m-1">
                    Button
                </div> */}
                <input
                    role="buton"
                    type="text"
                    placeholder="Search subject"
                    className="input input-bordered input-sm w-full max-w-xs"
                    value={searchSubjectValue}
                    onChange={(e) => {
                        handleInputChange(e, setSearchSubjectValue);
                    }}
                    // onKeyDown={(e) => {
                    //     if (e.key === "Enter") {
                    //         e.preventDefault();
                    //         dispatch(addSection(sectionInputValue));
                    //         setSectionInputValue("");
                    //     }
                    // }}
                />
                <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                >
                    {searchResults.map((subjectName) => (
                        <li key={subjectName}>
                            <a>{subjectName}</a>
                        </li>
                    ))}
                </ul>
            </div>
            <select className="select select-bordered select-xs w-full max-w-xs">
                {subjects.map((subject) => (
                    <option key={subject}>{subject}</option>
                ))}
            </select>
        </div>
    );
};

export default AddSectionContainer;
