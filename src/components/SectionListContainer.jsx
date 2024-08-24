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
import AddEntryContainer from "./AddEntryContainer";
import { IoAdd, IoSearch } from "react-icons/io5";
import debounce from "debounce";
import { filterObject } from "../utils/filterObject";
import escapeRegExp from "../utils/escapeRegExp";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

const AddSectionContainer = ({ close, reduxField, reduxFunction }) => {
    const inputNameRef = useRef();
    const subjects = useSelector((state) => state.subject.subjects);
    const dispatch = useDispatch();

    const [inputValue, setInputValue] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectUnits, setSubjectUnits] = useState({});

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleAddEntry = () => {
        dispatch(
            reduxFunction({
                [reduxField[0]]: inputValue,
                [reduxField[1]]: selectedSubjects,
                [reduxField[2]]: subjectUnits,
            })
        );

        if (inputNameRef.current) {
            inputNameRef.current.focus();
            inputNameRef.current.select();
        }
    };

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    useEffect(() => {
        // Create a new object with keys from selectedSubjects and initial values (e.g., 0)
        const newSubjectUnits = {};
        selectedSubjects.forEach((subject) => {
            newSubjectUnits[subject] = subjectUnits[subject] || 5;
        });

        // Update the state with the new subjectUnits object
        setSubjectUnits(newSubjectUnits);
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
                onChange={(e) => {
                    handleInputChange(e);
                }}
            />

            <div className="">
                <div className="m-1">Selected Subjects: </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {selectedSubjects.map((subjectID) => (
                        <div key={subjectID} className="join">
                            <div className="join-item w-72 bg-primary text-primary-content px-2 text-center content-center text-xs md:text-base leading-3">
                                {subjects[subjectID].subject}
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
                                        // if (subjectUnits[subjectID] >= 5) {
                                        //     return;
                                        // }

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
                                        // if (subjectUnits[subjectID] <= 0) {
                                        //     return;
                                        // }

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

            <SearchableDropdownToggler
                selectedList={selectedSubjects}
                setSelectedList={setSelectedSubjects}
            />

            <button
                className="btn btn-primary"
                onClick={() => handleAddEntry()}
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

    const [openAddSectionContainer, setOpenAddSectionContainer] =
        useState(false);
    const [editSectionId, setEditSectionId] = useState(null);
    const [editSectionValue, setEditSectionValue] = useState("");
    const [editSectionSubjects, setEditSectionSubjects] = useState([]);
    const [editSectionUnits, setEditSectionUnits] = useState({});
    const [searchSectionResult, setSearchSectionResult] = useState(sections);
    const [searchSectionValue, setSearchSectionValue] = useState("");

    const handleEditSectionClick = (section) => {
        setEditSectionId(section.id);
        setEditSectionValue(section.section);

        const subjectsWithUnits = section.subjects.map((subjectId) => ({
            id: subjectId,
            name: subjects[subjectId].subject,
            units: sections[section.id]?.units?.[subjectId] || 0,
        }));

        setEditSectionSubjects(subjectsWithUnits.map(({ id }) => id));
        
        setEditSectionUnits(subjectsWithUnits.reduce((acc, { id, units }) => {
            acc[id] = units;
            return acc;
        }, {}));
    };

    const handleSaveSectionEditClick = (sectionId) => {
        const updatedUnits = editSectionSubjects.reduce((acc, subjectId) => {
            acc[subjectId] = editSectionUnits[subjectId];
            return acc;
    }, {});

    dispatch(
        editSection({
            sectionId,
            updatedSection: {
                section: editSectionValue,
                subjects: editSectionSubjects,
                units: updatedUnits,
            },
        })
    );

    setEditSectionId(null);
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

                const sectionSubjectsName = section.subjects
                    .map((subjectID) => subjects[subjectID].subject)
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
                            <th>Subjects</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(searchSectionResult).length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    No sections found
                                </td>
                            </tr>
                        ) : (
                            Object.entries(searchSectionResult).map(
                                ([, section], index) => (
                                    <tr
                                        key={section.id}
                                        className="group hover"
                                    >
                                        <td>{index + 1}</td>
                                        <th>{section.id}</th>
                                        <td>
                                            {editSectionId === section.id ? (
                                                <input
                                                    type="text"
                                                    value={editSectionValue}
                                                    onChange={(e) =>
                                                        setEditSectionValue(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="input input-bordered input-sm w-full"
                                                />
                                            ) : (
                                                section.section
                                            )}
                                        </td>
                                        <td className="flex gap-1 flex-wrap">
                                            {editSectionId === section.id ? (
                                                <div>
                                                    {editSectionSubjects.map(
                                                        (subjectId) => (
                                                            <div
                                                                key={subjectId}
                                                                className="px-2 flex items-center border border-gray-500 border-opacity-30"
                                                            >
                                                                <div className="mr-2">
                                                                    {subjects[
                                                                        subjectId
                                                                    ].subject}
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        editSectionUnits[
                                                                            subjectId
                                                                        ]
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setEditSectionUnits(
                                                                            {
                                                                                ...editSectionUnits,
                                                                                [subjectId]:
                                                                                    parseInt(
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    ),
                                                                            }
                                                                        )
                                                                    }
                                                                    className="input input-xs w-16"
                                                                />
                                                                <span className="text-xs ml-1">
                                                                    unit(s)
                                                                </span>
                                                                <button
                                                                    className="btn btn-xs btn-outline ml-2"
                                                                    onClick={() => {
                                                                        setEditSectionSubjects(
                                                                            editSectionSubjects.filter(
                                                                                id =>
                                                                                    id !==
                                                                                    subjectId
                                                                            )
                                                                        );
                                                                        const updatedUnits =
                                                                            {
                                                                                ...editSectionUnits,
                                                                            };
                                                                        delete updatedUnits[
                                                                            subjectId
                                                                        ];
                                                                        setEditSectionUnits(
                                                                            updatedUnits
                                                                        );
                                                                    }}
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                    <SearchableDropdownToggler
                                                        selectedList={
                                                            editSectionSubjects
                                                        }
                                                        setSelectedList={
                                                            setEditSectionSubjects
                                                        }
                                                        isEditMode={true}
                                                    />
                                                </div>
                                            ) : (
                                                subjectStatus ===
                                                    "succeeded" &&
                                                section.subjects.map(
                                                    (subject) => (
                                                        <div
                                                            key={subject}
                                                            className="px-2 flex items-center border border-gray-500 border-opacity-30"
                                                        >
                                                            <div className="mr-2">
                                                                {
                                                                    subjects[
                                                                        subject
                                                                    ].subject
                                                                }
                                                            </div>
                                                            <div className="text-xs opacity-75">
                                                                <span className="mr-1">
                                                                    {
                                                                        sections[
                                                                            section
                                                                                .id
                                                                        ]?.units?.[
                                                                            subject
                                                                        ] || 0
                                                                    }
                                                                </span>
                                                                <span>
                                                                    unit(s)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </td>
                                        <td className="w-28 text-right">
                                            {editSectionId === section.id ? (
                                                <>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-green-500"
                                                        onClick={() =>
                                                            handleSaveSectionEditClick(
                                                                section.id
                                                            )
                                                        }
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-red-500"
                                                        onClick={
                                                            handleCancelSectionEditClick
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
                                                            handleEditSectionClick(
                                                                section
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
                                                                removeSection(
                                                                    section.id
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
