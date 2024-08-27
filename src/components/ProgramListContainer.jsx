import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchPrograms,
    addProgram,
    editProgram,
    removeProgram,
} from "../features/programSlice";
import debounce from "debounce";
import { RiEdit2Fill, RiDeleteBin7Line } from "react-icons/ri";
import SearchableDropdownToggler from "./searchableDropdown";
import { filterObject } from "../utils/filterObject";
import escapeRegExp from "../utils/escapeRegExp";
import { IoAdd, IoSearch } from "react-icons/io5";

const AddProgramContainer = ({ close, reduxField, reduxFunction }) => {
    const inputNameRef = useRef();
    const subjects = useSelector((state) => state.subject.subjects);
    const dispatch = useDispatch();

    const [inputValue, setInputValue] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState({
        7: [],
        8: [],
        9: [],
        10: [],
    });

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSubjectSelection = (grade, selectedList) => {
        setSelectedSubjects((prevState) => {
            const updatedState = {
                ...prevState,
                [grade]: selectedList,
            };
            return updatedState;
        });
    };

    const handleAddEntry = () => {
        dispatch(
            reduxFunction({
                [reduxField[0]]: inputValue,
                7: selectedSubjects[7],
                8: selectedSubjects[8],
                9: selectedSubjects[9],
                10: selectedSubjects[10],
            })
        );

        close();
    };

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    return (
        <div className="card bg-base-200 p-4 my-5">
            <div className="flex justify-between">
                <h1>Add {reduxField[0].toUpperCase()}</h1>
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
            </div>
            <input
                type="text"
                ref={inputNameRef}
                placeholder={`${reduxField[0]} Name`}
                required
                className="input input-bordered input-sm w-full max-w-xs"
                value={inputValue}
                onChange={handleInputChange}
            />

            <div className="flex flex-col">
                {[7, 8, 9, 10].map((grade) => (
                    <div key={grade} className="my-3">
                        <h2>{`Grade ${grade}`}</h2>
                        <div className="flex items-center">
                            <div className="m-1">Selected Subjects: </div>
                            {selectedSubjects[grade] && Array.isArray(selectedSubjects[grade]) ? (
                                selectedSubjects[grade].map((subjectID) => (
                                    <div key={subjectID} className="badge badge-secondary m-1">
                                        {subjects[subjectID]?.subject || subjectID}
                                    </div>
                                ))
                            ) : (
                                <div>No subjects selected</div>
                            )}
                        </div>

                        <SearchableDropdownToggler
                            selectedList={selectedSubjects[grade]}
                            setSelectedList={(list) => handleSubjectSelection(grade, list)}
                        />
                    </div>
                ))}
            </div>

            <button
                className="btn btn-primary"
                onClick={handleAddEntry}
            >
                <div>Add {reduxField[0]}</div>
                <IoAdd size={20} />
            </button>
        </div>
    );
};

const ProgramListContainer = () => {
    const dispatch = useDispatch();

    const { programs, status: programStatus } = useSelector(
        (state) => state.program
    );

    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );

    const [editProgramId, setEditProgramId] = useState(null);
    const [editProgramValue, setEditProgramValue] = useState("");
    const [editProgramCurr, setEditProgramCurr] = useState([]);
    const [searchProgramResult, setSearchProgramResult] = useState(programs);
    const [searchProgramValue, setSearchProgramValue] = useState("");
    const [openAddProgramContainer, setOpenAddProgramContainer] =
        useState(false);

    const handleEditProgramClick = (program) => {
        setEditProgramId(program.id);
        setEditProgramValue(program.program);
        setEditProgramCurr({
            7: program[7] || [],
            8: program[8] || [],
            9: program[9] || [],
            10: program[10] || [],
        });
    };

    const handleSaveProgramEditClick = (programId) => {
        dispatch(
            editProgram({
                programId,
                updatedProgram: {
                    program: editProgramValue,
                    7: editProgramCurr[7],
                    8: editProgramCurr[8],
                    9: editProgramCurr[9],
                    10: editProgramCurr[10],
                },
            })
        );
        setEditProgramId(null);
    };

    const handleCancelProgramEditClick = () => {
        setEditProgramId(null);
        setEditProgramValue("");
        setEditProgramCurr([]);
    };

    const debouncedSearch = useCallback(
        debounce((searchValue, programs, subjects) => {
            setSearchProgramResult(
                filterObject(programs, ([, program]) => {
                    if (!searchValue) return true;

                    const programsSubjectsName = program.subjects
                        .map((subjectID) => subjects[subjectID].subject)
                        .join(" ");

                    const escapedSearchValue = escapeRegExp(searchValue)
                        .split("\\*")
                        .join(".*");

                    const pattern = new RegExp(escapedSearchValue, "i");

                    return (
                        pattern.test(program.program) ||
                        pattern.test(programsSubjectsName)
                    );
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        debouncedSearch(searchProgramValue, programs, subjects);
    }, [searchProgramValue, programs, debouncedSearch, subjects]);

    useEffect(() => {
        if (programStatus === "idle") {
            dispatch(fetchPrograms());
        }
    }, [programStatus, dispatch]);

    return (
        <React.Fragment>
            <div className="">
                <label className="input input-sm input-bordered flex items-center gap-2">
                    <input
                        type="text"
                        className="grow"
                        placeholder="Search Program by Name or Subjects"
                        value={searchProgramValue}
                        onChange={(e) => setSearchProgramValue(e.target.value)}
                    />
                    <IoSearch />
                </label>

                <table className="table table-sm table-zebra">
                    <thead>
                        <tr>
                            <th className="w-8">#</th>
                            <th>Program ID</th>
                            <th>Program</th>
                            <th>Subjects</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(searchProgramResult).length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    No programs found
                                </td>
                            </tr>
                        ) : (
                            Object.entries(searchProgramResult).map(
                                ([, program], index) => (
                                    <tr
                                        key={program.id}
                                        className="group hover"
                                    >
                                        <td>{index + 1}</td>
                                        <th>{program.id}</th>
                                        <td>
                                            {editProgramId === program.id ? (
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm w-full"
                                                    value={editProgramValue}
                                                    onChange={(e) =>
                                                        setEditProgramValue(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            ) : (
                                                program.program
                                            )}
                                        </td>

                                        <td>
                                            {editProgramId === program.id ? (
                                                <>
                                                    {[7, 8, 9, 10].map((grade) => (
                                                        <div key={grade}>
                                                            <h3>{`Grade ${grade}`}</h3>
                                                            <div className="m-1">Selected Subjects: </div>
                                                            {editProgramCurr[grade] && Array.isArray(editProgramCurr[grade]) && subjects ? (
                                                                editProgramCurr[grade].map((subjectID) => (
                                                                    <div
                                                                        key={subjectID}
                                                                        className="badge badge-secondary m-1"
                                                                    >
                                                                        {subjects[subjectID]?.subject || subjectID}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div>No subjects selected</div>
                                                            )}

                                                            <SearchableDropdownToggler
                                                                selectedList={editProgramCurr[grade]}
                                                                setSelectedList={(list) =>
                                                                    setEditProgramCurr((prevState) => ({
                                                                        ...prevState,
                                                                        [grade]: list,
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <ul>
                                                    {[7, 8, 9, 10].map((grade) => (
                                                        <li key={grade}>
                                                            <details>
                                                                <summary>{`Grade ${grade}`}</summary>
                                                                <div>
                                                                    {program[`${grade}`].map(
                                                                        (subjectID) => (
                                                                            <div
                                                                                key={subjectID}
                                                                                className="badge badge-secondary m-1"
                                                                            >
                                                                                {subjects[subjectID]?.subject || subjectID}
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </details>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </td>

                                        <td className="flex justify-end gap-2">
                                            {editProgramId === program.id ? (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() =>
                                                            handleSaveProgramEditClick(
                                                                program.id
                                                            )
                                                        }
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={
                                                            handleCancelProgramEditClick
                                                        }
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() =>
                                                            handleEditProgramClick(
                                                                program
                                                            )
                                                        }
                                                    >
                                                        <RiEdit2Fill />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() =>
                                                            dispatch(
                                                                removeProgram(
                                                                    program.id
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <RiDeleteBin7Line />
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
                {openAddProgramContainer ? (
                    <AddProgramContainer
                        close={() => setOpenAddProgramContainer(false)}
                        reduxField={["program", "subjects"]}
                        reduxFunction={addProgram}
                    />
                ) : (
                    <div className="flex justify-end mt-3">
                        <button
                            className="btn btn-primary"
                            onClick={() => setOpenAddProgramContainer(true)}
                        >
                            Add Program
                        </button>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
};

export default ProgramListContainer;
