import { useState, useRef, useEffect } from "react";
import { IoChevronDown } from "react-icons/io5";
import { useSelector } from "react-redux";
import { filterObject } from "../utils/filterObject";
import escapeRegExp from "../utils/escapeRegExp";
import { IoRemove, IoAdd } from "react-icons/io5";
import clsx from "clsx";

const SearchableDropdownToggler = ({
    selectedList,
    setSelectedList,
    isEditMode = false,
}) => {
    const subjects = useSelector((state) => state.subject.subjects);
    const [searchSubjectValue, setSearchSubjectValue] = useState("");
    const searchInputRef = useRef(null);

    const searchResults = filterObject(subjects, ([, subject]) => {
        const escapedSearchValue = escapeRegExp(searchSubjectValue)
            .split("\\*")
            .join(".*");

        const pattern = new RegExp(escapedSearchValue, "i");

        return pattern.test(subject.subject);
    });

    useEffect(() => {
        console.log(searchResults);
    }, [searchResults]);

    useEffect(() => {
        let observerRefValue = null;

        const handleBlur = () => {
            setTimeout(() => {
                searchInputRef.current.focus();
            }, 0);
        };

        if (searchInputRef.current) {
            searchInputRef.current.addEventListener("blur", handleBlur);
            observerRefValue = searchInputRef.current;
        }

        return () => {
            if (observerRefValue) {
                observerRefValue.removeEventListener("blur", handleBlur);
            }
        };
    }, [searchSubjectValue]);

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchSubjectValue]);

    const handleInputChange = (e) => {
        setSearchSubjectValue(e.target.value);
    };

    const toggleSubject = (subjectID) => {
        setSelectedList((prev) =>
            prev.includes(subjectID)
                ? prev.filter((id) => id !== subjectID)
                : [...prev, subjectID]
        );
    };

    return (
        <div className="dropdown">
            <div tabIndex={0} role="button" className="btn m-1">
                {isEditMode ? (
                    <div>
                        Edit Subject<span>(s)</span>
                    </div>
                ) : (
                    <div>Add subject</div>
                )}
                <IoChevronDown size={16} />
            </div>
            <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
                <li>
                    <input
                        type="text"
                        placeholder="Search subject"
                        ref={searchInputRef}
                        className="input input-bordered input-sm w-full max-w-xs"
                        value={searchSubjectValue}
                        onChange={(e) => {
                            handleInputChange(e);
                        }}
                    />
                </li>
                {Object.keys(searchResults).length === 0 ? (
                    <div className="px-4 py-2 opacity-50">Not found</div>
                ) : (
                    Object.entries(searchResults).map(([, subject]) => (
                        <li
                            role="button"
                            key={subject.id}
                            onClick={() => toggleSubject(subject.id)}
                        >
                            <div className="flex justify-between">
                                <a className={clsx("w-full")}>
                                    {subject.subject}
                                </a>
                                {selectedList.includes(subject.id) ? (
                                    <IoRemove
                                        size={20}
                                        className="text-red-500"
                                    />
                                ) : (
                                    <IoAdd
                                        size={20}
                                        className="text-green-400"
                                    />
                                )}
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default SearchableDropdownToggler;
