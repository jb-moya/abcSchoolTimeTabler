import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoAdd } from "react-icons/io5";
import SearchableDropdownToggler from "./searchableDropdown";

const AddEntryContainer = ({ close, reduxField, reduxFunction }) => {
    const subjects = useSelector((state) => state.subject.subjects);
    const dispatch = useDispatch();

    const [inputValue, setInputValue] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    return (
        <div className="card bg-base-200 p-4">
            Add {reduxField[0].toUpperCase()}
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
                <div key={subjectID} className="badge badge-secondary m-1">
                    {subjects[subjectID].subject}
                </div>
            ))}
            <input
                type="text"
                placeholder={`${reduxField[0]} Name`}
                required
                className="input input-bordered input-sm w-full max-w-xs"
                value={inputValue}
                onChange={(e) => {
                    handleInputChange(e);
                }}
            />
            <SearchableDropdownToggler
                selectedList={selectedSubjects}
                setSelectedList={setSelectedSubjects}
            />
            <button
                className="btn btn-primary"
                onClick={() =>
                    dispatch(
                        reduxFunction({
                            [reduxField[0]]: inputValue,
                            [reduxField[1]]: selectedSubjects,
                        })
                    )
                }
            >
                <div>Add {reduxField[0]}</div>
                <IoAdd size={20} />
            </button>
        </div>
    );
};

export default AddEntryContainer;
