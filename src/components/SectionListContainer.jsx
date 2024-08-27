import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { RiEdit2Fill, RiDeleteBin7Line } from "react-icons/ri";
import { useDispatch } from "react-redux";
import {
    fetchSections,
    addSection,
    editSection,
    removeSection,
} from "../features/sectionSlice";
import SearchableDropdownToggler from "./searchableDropdown";
import { IoAdd, IoSearch } from "react-icons/io5";
import debounce from "debounce";
import { filterObject } from "../utils/filterObject";
import escapeRegExp from "../utils/escapeRegExp";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

const AddSectionContainer = ({ close, reduxField, reduxFunction }) => {
    const inputNameRef = useRef();
    const subjects = useSelector((state) => state.subject.subjects);
    const programs = useSelector((state) => state.program.programs);
    const dispatch = useDispatch();

    const [inputValue, setInputValue] = useState("");
    const [selectedProgram, setSelectedProgram] = useState("");
    const [selectedYearLevel, setSelectedYearLevel] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectUnits, setSubjectUnits] = useState({});

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleAddEntry = () => {
        const formattedSubjectUnits = {};
    
        selectedSubjects.forEach((subjectID) => {
            formattedSubjectUnits[subjectID] = subjectUnits[subjectID] || 0;
        });
    
        dispatch(
            reduxFunction({
                [reduxField[0]]: inputValue,
                program: selectedProgram,
                year: parseInt(selectedYearLevel, 10),
                subjects: formattedSubjectUnits,
            })
        );
    
        close();
    };    

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    useEffect(() => {
        console.log('Selected Program:', selectedProgram);
        console.log('Selected Year Level:', selectedYearLevel);
        
        if (selectedProgram && selectedYearLevel) {
            const program = Object.values(programs).find((p) => p.id === selectedProgram);
    
            if (program) {
                setSelectedSubjects(program[selectedYearLevel] || []); // Ensure it accesses the subjects correctly
            } else {
                setSelectedSubjects([]);
            }
        }
    }, [selectedProgram, selectedYearLevel, programs]);

    useEffect(() => {
        const newSubjectUnits = {};
        selectedSubjects.forEach((subject) => {
            if (!subjectUnits.hasOwnProperty(subject)) {
                newSubjectUnits[subject] = 5;
            } else {
                newSubjectUnits[subject] = subjectUnits[subject];
            }
        });
        if (JSON.stringify(newSubjectUnits) !== JSON.stringify(subjectUnits)) {
            setSubjectUnits(newSubjectUnits);
        }
    }, [selectedSubjects]);

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

            <div className="mt-3">
                <label className="label">
                    <span className="label-text">Select Program</span>
                </label>
                <select
                    className="select select-bordered w-full"
                    
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(parseInt(e.target.value, 10))}
                >
                    <option value="" disabled>
                        Select a Program
                    </option>
                    {Object.keys(programs).map((key) => (
                        <option key={programs[key].id} value={programs[key].id}>
                            {programs[key].program}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-3">
                <label className="label">
                    <span className="label-text">Select Year Level</span>
                </label>
                <select
                    className="select select-bordered w-full"
                    value={selectedYearLevel}
                    onChange={(e) => setSelectedYearLevel(e.target.value)}
                >
                    <option value="" disabled>
                        Select a Year Level
                    </option>
                    {[7, 8, 9, 10].map((level) => (
                        <option key={level} value={level}>
                            Grade {level}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-4">
                <div className="m-1">Selected Subjects: </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {selectedSubjects.map((subjectID) => (
                        <div key={subjectID} className="join">
                            <div className="join-item w-72 bg-primary text-primary-content px-2 text-center content-center text-xs md:text-base leading-3">
                                {subjects[subjectID]?.subject || "Unknown Subject"}
                            </div>
                            <input
                                type="text"
                                placeholder="Units"
                                className="input w-full join-item"
                                value={subjectUnits[subjectID] ?? 0}
                                onChange={(e) => {
                                    setSubjectUnits({
                                        ...subjectUnits,
                                        [subjectID]: parseInt(e.target.value, 10),
                                    });
                                }}
                            />

                            <div className="join join-item join-vertical flex w-20 items-center border-y border-r border-primary">
                                <button
                                    className="join-item h-1/2 w-full bg-secondary hover:brightness-110 flex justify-center"
                                    onClick={() => {
                                        setSubjectUnits({
                                            ...subjectUnits,
                                            [subjectID]:
                                                subjectUnits[subjectID] + 1,
                                        });
                                    }}
                                >
                                    <BiChevronUp size={24} />
                                </button>
                                <button
                                    className="join-item h-1/2 w-full bg-secondary hover:brightness-110 flex justify-center"
                                    onClick={() => {
                                        setSubjectUnits({
                                            ...subjectUnits,
                                            [subjectID]:
                                                subjectUnits[subjectID] - 1,
                                        });
                                    }}
                                >
                                    <BiChevronDown size={24} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                className="btn btn-primary mt-4"
                onClick={handleAddEntry}
            >
                <div>Add {reduxField[0]}</div>
                <IoAdd size={20} />
            </button>
        </div>
    );
};

const SectionListContainer = () => {
    const dispatch = useDispatch();
    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );
    const { sections, status: sectionStatus } = useSelector(
        (state) => state.section
    );
    const { programs, status: programStatus } = useSelector(
        (state) => state.program
    );

    const [openAddSectionContainer, setOpenAddSectionContainer] =
        useState(false);

    const [editSectionProg, setEditSectionProg] = useState("");
    const [editSectionYear, setEditSectionYear] = useState("");

    const [editSectionId, setEditSectionId] = useState("");
    const [editSectionValue, setEditSectionValue] = useState("");
    const [editSectionSubjects, setEditSectionSubjects] = useState([]);
    const [editSectionUnits, setEditSectionUnits] = useState({});
    const [searchSectionResult, setSearchSectionResult] = useState(sections);
    const [searchSectionValue, setSearchSectionValue] = useState("");

    const handleEditSectionClick = (section) => {
        setEditSectionId(section.id);
        setEditSectionValue(section.section);
    
        setEditSectionProg(section.program);
        setEditSectionYear(section.year);

        // console.log("Section ID:", section.id);
    
        // Convert section.subjects object keys to an array
        const subjectsArray = Object.keys(section.subjects); // Get the subject IDs from the object
    
        const subjectsWithUnits = subjectsArray.map((subjectId) => ({
            id: subjectId,
            name: subjects[subjectId]?.subject || "Unknown Subject",
            units: section.subjects[subjectId] || 0,
        }));
    
        setEditSectionSubjects(subjectsWithUnits.map(({ id }) => id));
        console.log("Subjects with units for section:", subjectsWithUnits);
    
        setEditSectionUnits(subjectsWithUnits.reduce((acc, { id, units }) => {
            acc[id] = units;
            return acc;
        }, {}));
    };
    
    const handleSaveSectionEditClick = (sectionId) => {
        const updatedUnits = {};
        editSectionSubjects.forEach((subjectId) => {
            updatedUnits[subjectId] = editSectionUnits[subjectId] || 0;
        });

        dispatch(
            editSection({
                sectionId,
                updatedSection: {
                    id: sectionId,
                    program: editSectionProg,
                    section: editSectionValue,
                    subjects: updatedUnits,
                    year: editSectionYear,
                },
            })
        );
    
        // Reset the editing state
        setEditSectionId("");
        setEditSectionValue("");
        setEditSectionProg("");
        setEditSectionYear("");
        setEditSectionSubjects([]);
        setEditSectionUnits({});
    };
    
    const handleCancelSectionEditClick = () => {
        setEditSectionId(null);
        setEditSectionValue("");
        setEditSectionSubjects([]);
        setEditSectionUnits({});
    };

    const debouncedSearch = useCallback(
        debounce((searchValue, sections, subjects) => {
            setSearchSectionResult(
                filterObject(sections, ([, section]) => {
                    const escapedSearchValue = escapeRegExp(searchValue)
                        .split("\\*")
                        .join(".*");
    
                    // Iterate over the keys of section.subjects to get the subject names
                    const sectionSubjectsName = Object.keys(section.subjects)
                        .map((subjectID) => subjects[subjectID]?.subject || "")
                        .join(" ");
    
                    const pattern = new RegExp(escapedSearchValue, "i");
                    return (
                        pattern.test(section.section) ||
                        pattern.test(sectionSubjectsName)
                    );
                })
            );
        }, 200),
        []
    );    

    useEffect(() => {
        debouncedSearch(searchSectionValue, sections, subjects);
    }, [searchSectionValue, sections, debouncedSearch, subjects]);

    useEffect(() => {
        if (sectionStatus === "idle") {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

    useEffect(() => {
        if (sectionStatus === "succeeded") {
            console.log("Fetched sections:", sections);
        }
    }, [sectionStatus, sections]);

    return (
        <React.Fragment>
            <div>
                <label className="input input-sm input-bordered flex items-center mt-5">
                    <input
                        type="text"
                        className="grow"
                        placeholder="Search Section by Name or Subject List"
                        value={searchSectionValue}
                        onChange={(e) => setSearchSectionValue(e.target.value)}
                    />
                    <IoSearch />
                </label>
    
                <table className="table table-sm table-zebra">
                    <thead>
                        <tr>
                            <th className="w-8">#</th>
                            <th>Section ID</th>
                            <th>Section</th>
                            <th>Program</th>
                            <th>Year</th>
                            <th>Subjects</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(searchSectionResult).length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center">
                                    No sections found
                                </td>
                            </tr>
                        ) : (
                            Object.entries(searchSectionResult).map(([_, section], index) => (
                                <tr key={section.id} className="group hover">
                                    <td>{index + 1}</td>
                                    <th>{section.id}</th>
                                    <td>
                                        {editSectionId === section.id ? (
                                            <input
                                                type="text"
                                                value={editSectionValue}
                                                onChange={(e) =>
                                                    setEditSectionValue(e.target.value)
                                                }
                                                className="input input-bordered input-sm w-full"
                                            />
                                        ) : (
                                            section.section
                                        )}
                                    </td>
                                    <td>
                                        {editSectionId === section.id ? (
                                            <select
                                                value={editSectionProg}
                                                onChange={(e) => {
                                                    const newProgram = parseInt(e.target.value, 10);
                                                    setEditSectionProg(newProgram);

                                                    const subjectsForProgramAndYear = programs[newProgram][section.year] || [];
                                                    setEditSectionSubjects(subjectsForProgramAndYear);

                                                    const updatedUnits = {};
                                                    subjectsForProgramAndYear.forEach((subjectId) => {
                                                        updatedUnits[subjectId] = 0;
                                                    });
                                                    setEditSectionUnits(updatedUnits);
                                                }}
                                                className="select select-bordered"
                                            >
                                                {Object.entries(programs).map(([key, program]) => (
                                                    <option key={key} value={key}>
                                                        {program.program}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            programs[section.program]?.program || "Unknown Program"
                                        )}
                                    </td>
                                    <td>
                                        {editSectionId === section.id ? (
                                            <select
                                                value={editSectionYear}
                                                onChange={(e) => {
                                                    const newYear = parseInt(e.target.value, 10);
                                                    setEditSectionYear(newYear);
                                                    
                                                    const subjectsForProgramAndYear = programs[editSectionProg][newYear] || [];
                                                    setEditSectionSubjects(subjectsForProgramAndYear);

                                                    const updatedUnits = {};
                                                    subjectsForProgramAndYear.forEach((subjectId) => {
                                                        updatedUnits[subjectId] = 0;
                                                    });
                                                    setEditSectionUnits(updatedUnits);
                                                }}
                                                className="select select-bordered"
                                            >
                                                {[7, 8, 9, 10].map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            section.year
                                        )}
                                    </td>
                                    <td className="flex gap-1 flex-wrap">
                                        {editSectionId === section.id ? (
                                            <div>
                                                {editSectionSubjects.map((subjectId) => (
                                                    <div
                                                        key={subjectId}
                                                        className="px-2 flex items-center border border-gray-500 border-opacity-30"
                                                    >
                                                        <div className="mr-2">
                                                            {subjects[subjectId]?.subject || "Unknown Subject"}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={editSectionUnits[subjectId] || 0}
                                                            onChange={(e) =>
                                                                setEditSectionUnits({
                                                                    ...editSectionUnits,
                                                                    [subjectId]: parseInt(e.target.value, 10),
                                                                })
                                                            }
                                                            className="input input-xs w-16"
                                                        />
                                                        <span className="text-xs ml-1">unit(s)</span>
                                                        <button
                                                            className="btn btn-xs btn-outline ml-2"
                                                            onClick={() => {
                                                                setEditSectionSubjects(
                                                                    editSectionSubjects.filter(
                                                                        (id) => id !== subjectId
                                                                    )
                                                                );
                                                                const updatedUnits = {
                                                                    ...editSectionUnits,
                                                                };
                                                                delete updatedUnits[subjectId];
                                                                setEditSectionUnits(updatedUnits);
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            subjectStatus === "succeeded" &&
                                            Object.keys(section.subjects).map((subjectID) => (
                                                <div
                                                    key={subjectID}
                                                    className="px-2 flex items-center border border-gray-500 border-opacity-30"
                                                >
                                                    <div className="mr-2">
                                                        {subjects[subjectID]?.subject || "Unknown Subject"}
                                                    </div>
                                                    <div className="text-xs opacity-75">
                                                        <span className="mr-1">{section.subjects[subjectID]}</span>
                                                        <span>unit(s)</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </td>

                                    <td className="w-28 text-right">
                                        {editSectionId === section.id ? (
                                            <>
                                                <button
                                                    className="btn btn-xs btn-ghost text-green-500"
                                                    onClick={() =>
                                                        handleSaveSectionEditClick(section.id)
                                                    }
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-ghost text-red-500"
                                                    onClick={handleCancelSectionEditClick}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-xs btn-ghost text-red-500"
                                                    onClick={() => handleEditSectionClick(section)}
                                                >
                                                    <RiEdit2Fill size={20} />
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-ghost text-red-500"
                                                    onClick={() => dispatch(removeSection(section.id))}
                                                >
                                                    <RiDeleteBin7Line size={20} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
    
            <div>
                {openAddSectionContainer ? (
                    <AddSectionContainer
                        close={() => setOpenAddSectionContainer(false)}
                        reduxField={["section", "subjects", "units"]}
                        reduxFunction={addSection}
                    />
                ) : (
                    <button
                        className="btn btn-secondary my-5"
                        onClick={() => {
                            setOpenAddSectionContainer(true);
                        }}
                    >
                        Add Section
                        <IoAdd size={26} />
                    </button>
                )}
            </div>
        </React.Fragment>
    );    
};

export default SectionListContainer;
