import React, { useState, useEffect } from "react";
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
import { IoSearch } from "react-icons/io5";

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
    const [editSectionCurr, setEditSectionCurr] = useState([]);

    const handleEditSectionClick = (section) => {
        setEditSectionId(section.id);
        setEditSectionValue(section.section);
        setEditSectionCurr(section.subjects);
    };

    const handleSaveSectionEditClick = (sectionId) => {
        dispatch(
            editSection({
                sectionId,
                updatedSection: {
                    section: editSectionValue,
                    subjects: editSectionCurr,
                },
            })
        );
        setEditSectionId(null);
    };

    const handleCancelSectionEditClick = () => {
        setEditSectionId(null);
        setEditSectionValue("");
        setEditSectionCurr([]);
    };

    useEffect(() => {
        if (sectionStatus === "idle") {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

    return (
        <React.Fragment>
            
            <div className="overflow-x-auto">
                <table className="table table-sm table-zebra">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Section ID</th>
                            <th>Section</th>
                            <th>Subjects</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(sections).map(([, section], index) => (
                            <tr key={section.id} className="group hover">
                                <th>{index + 1}</th>
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
                                <td className="flex gap-2">
                                    {editSectionId === section.id ? (
                                        <SearchableDropdownToggler
                                            selectedList={editSectionCurr}
                                            setSelectedList={setEditSectionCurr}
                                            isEditMode={true}
                                        />
                                    ) : (
                                        subjectStatus === "succeeded" &&
                                        section.subjects.map((subject) => (
                                            <div key={subject}>
                                                {subjects[subject].subject}
                                            </div>
                                        ))
                                    )}
                                </td>
                                <td>
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
                                                <RiEdit2Fill size={20} />
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
                                                <RiDeleteBin7Line size={20} />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div>
                <button
                    className="btn btn-secondary"
                    onClick={() => {
                        setOpenAddSectionContainer(true);
                    }}
                >
                    Add Section
                </button>

                {openAddSectionContainer && (
                    <AddEntryContainer
                        close={() => setOpenAddSectionContainer(false)}
                        reduxField={["section", "subjects"]}
                        reduxFunction={addSection}
                    />
                )}
            </div>
        </React.Fragment>
    );
};

export default SectionListContainer;
