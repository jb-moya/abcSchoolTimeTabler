import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddEntryContainer from "./AddEntryContainer";
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
        setEditProgramValue(program.name);
        setEditProgramCurr(program.subjects);
    };

    const handleSaveProgramEditClick = (programId) => {
        dispatch(
            editProgram({
                programId,
                updatedProgram: {
                    program: editProgramValue,
                    subjects: editProgramCurr,
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

                                        <td className="flex gap-1 flex-wrap">
                                            {editProgramId === program.id ? (
                                                <SearchableDropdownToggler
                                                    selectedList={
                                                        editProgramCurr
                                                    }
                                                    setSelectedList={
                                                        setEditProgramCurr
                                                    }
                                                    isEditMode={true}
                                                />
                                            ) : (
                                                subjectStatus === "succeeded" &&
                                                program.subjects.map(
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
                                            {editProgramId === program.id ? (
                                                <>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-green-500"
                                                        onClick={() =>
                                                            handleSaveProgramEditClick(
                                                                program.id
                                                            )
                                                        }
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-red-500"
                                                        onClick={() =>
                                                            handleCancelProgramEditClick()
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
                                                            handleEditProgramClick(
                                                                program
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
                                                                removeProgram(
                                                                    program.id
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
                {openAddProgramContainer ? (
                    <AddEntryContainer
                        close={() => setOpenAddProgramContainer(false)}
                        reduxField={["program", "subjects"]}
                        reduxFunction={addProgram}
                    />
                ) : (
                    <button
                        className="btn btn-secondary my-5"
                        onClick={() => {
                            setOpenAddProgramContainer(true);
                        }}
                    >
                        Add Program
                        <IoAdd size={26} />
                    </button>
                )}
            </div>
        </React.Fragment>
    );
};

export default ProgramListContainer;
