import React, { useState, useEffect } from 'react';

import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import AdditionalScheduleForTeacherRank from './AdditionalScheduleForTeacherRank';

import { editDocument } from '../../../hooks/firebaseCRUD/editDocument';

import { toast } from 'sonner';
import { COLLECTION_ABBREVIATION } from '../../../constants';
import { useSelector } from 'react-redux';

const TeacherRankEdit = ({
    // STORES
    ranks,
    teachers,
    // STORES
    rank,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays = 5,
}) => {
    const { user: currentUser } = useSelector((state) => state.user);

    const [editRankId, setEditRankId] = useState(rank.id || null);

    const [editRankValue, setEditRankValue] = useState(rank.rank || '');

    const [editAdditionalRankScheds, setEditAdditionalRankScheds] = useState(rank.additionalRankScheds || []);

    useEffect(() => {
        if (rank) {
            setEditRankId(rank.id || null);
            setEditRankValue(rank.rank || '');
            setEditAdditionalRankScheds(rank.additionalRankScheds || []);
        }
    }, [rank]);

    // ==============================================================================

    const updateAllTeacherAdditionalSchedules = async () => {
        for (const [teacherID, teacher] of Object.entries(teachers)) {
            const newTeacher = JSON.parse(JSON.stringify(teacher));

            if (newTeacher.rank !== editRankId) return;

            const updatedSchedNames = new Set(editAdditionalRankScheds.map((sched) => sched.name));

            const advisoryLoadSched = newTeacher.additionalTeacherScheds.find((sched) => sched.name === 'Advisory Load');

            let updatedAdditionalScheds = structuredClone(editAdditionalRankScheds);

            if (advisoryLoadSched && !updatedSchedNames.has('Advisory Load')) {
                updatedAdditionalScheds.push(advisoryLoadSched);
                updatedSchedNames.add('Advisory Load');
            }

            const existingSchedsMap = new Map(newTeacher.additionalTeacherScheds.map((sched) => [sched.name, sched]));

            newTeacher.additionalTeacherScheds = updatedAdditionalScheds.map((updatedSched) => {
                const existingSched = existingSchedsMap.get(updatedSched.name);

                if (existingSched) {
                    return {
                        ...existingSched,
                        duration: updatedSched.duration || existingSched.duration,
                        frequency: updatedSched.frequency || existingSched.frequency,
                        shown: updatedSched.shown ?? existingSched.shown,
                        time: updatedSched.time || existingSched.time,
                    };
                }

                // If the schedule doesn't exist, add it as is
                return updatedSched;
            });

            const schedules = newTeacher.additionalTeacherScheds.map((sched) => ({
                n: sched.name,
                su: sched.subject,
                d: sched.duration,
                f: sched.frequency,
                sh: sched.shown,
                t: sched.time,
            }));

            await editDocument({
                collectionName: 'teachers',
                collectionAbbreviation: COLLECTION_ABBREVIATION.TEACHERS,
                userName: currentUser?.username || 'unknown user',
                itemName: 'a teacher' || 'an item',
                docId: newTeacher.id,
                entryData: {
                    t: newTeacher.teacher,
                    r: newTeacher.rank,
                    s: newTeacher.subjects,
                    y: newTeacher.yearLevels,
                    at: schedules,
                },
            });
        }
    };

    const handleSaveRankEditClick = async (value) => {
        handleConfirmationModalClose();

        if (!editRankValue.trim()) {
            toast.error('All fields are required.', {
                style: { backgroundColor: 'red', color: 'white' },
            });
            return;
        }

        const currentRank = ranks[editRankId]?.rank || '';

        if (editRankValue.trim().toLowerCase() === currentRank.trim().toLowerCase()) {
            try {

                const schedules = editAdditionalRankScheds.map((sched) => ({
                    n: sched.name,
                    su: sched.subject,
                    d: sched.duration,
                    f: sched.frequency,
                    sh: sched.shown,
                    t: sched.time,
                }));

                await editDocument({
                    collectionName: 'ranks',
                    collectionAbbreviation: COLLECTION_ABBREVIATION.RANKS,
                    userName: currentUser?.username || 'unknown user',
                    itemName: currentRank || 'an item',
                    docId: editRankId,
                    entryData: {
                        r: editRankValue,
                        ar: schedules,
                    },
                });

                if (value) {
                    updateAllTeacherAdditionalSchedules();
                }
            } catch (error) {
                toast.error('Something went wrong. Please try again.');
                console.error('Error: ', error);
            } finally {
                toast.success('Data and dependencies updated successfully!', {
                    style: {
                        backgroundColor: '#28a745',
                        color: '#fff',
                        borderColor: '#28a745',
                    },
                });

                resetStates();
                closeModal();
            }
        } else {
            const duplicateRank = Object.values(ranks).find(
                (rank) => rank.rank.trim().toLowerCase() === editRankValue.trim().toLowerCase()
            );

            if (duplicateRank) {
                toast.error('Rank already exists.', {
                    style: { backgroundColor: 'red', color: 'white' },
                });
                return;
            } else {
                try {
                    const schedules = editAdditionalRankScheds.map((sched) => ({
                        n: sched.name,
                        su: sched.subject,
                        d: sched.duration,
                        f: sched.frequency,
                        sh: sched.shown,
                        t: sched.time,
                    }));
    
                    await editDocument({
                        collectionName: 'ranks',
                        collectionAbbreviation: COLLECTION_ABBREVIATION.RANKS,
                        userName: currentUser?.username || 'unknown user',
                        itemName: currentRank || 'an item',
                        docId: editRankId,
                        entryData: {
                            r: editRankValue,
                            ar: schedules,
                        },
                    });

                    if (value) {
                        updateAllTeacherAdditionalSchedules();
                    }
                } catch {
                    toast.error('Something went wrong. Please try again.');
                    console.error('Something went wrong. Please try again.');
                } finally {
                    toast.success('Data and dependencies updated successfully!', {
                        style: {
                            backgroundColor: '#28a745',
                            color: '#fff',
                            borderColor: '#28a745',
                        },
                    });

                    resetStates();
                    closeModal();
                }
            }
        }
    };

    // ==============================================================================

    const handleDeleteAdditionalSchedule = (index) => {
        setEditAdditionalRankScheds((prevScheds) => prevScheds.filter((_, i) => i !== index));
    };

    const handleAddAdditionalSchedule = () => {
        setEditAdditionalRankScheds((prevScheds) => [
            ...prevScheds,
            {
                name: '',
                subject: -1,
                duration: 60,
                frequency: 1,
                shown: true,
                time: 72,
            },
        ]);
    };

    // ==============================================================================

    const resetStates = () => {
        setEditRankId(rank.id || null);
        setEditRankValue(rank.rank || '');
        setEditAdditionalRankScheds(rank.additionalRankScheds || []);
    };

    const handleConfirmationModalClose = () => {
        document.getElementById(`confirm_rank_edit_modal_${rank.id}`).close();
    };

    const closeModal = () => {
        const modalCheckbox = document.getElementById(`rankEdit_modal_${rank.id}`);
        if (modalCheckbox) {
            modalCheckbox.checked = false; // Uncheck the modal toggle
        }
        resetStates();
    };

    return (
        <div className=''>
            {/* Trigger Button */}
            <label htmlFor={`rankEdit_modal_${rank.id}`} className='btn btn-xs btn-ghost text-blue-500'>
                <RiEdit2Fill size={20} />
            </label>

            {/* Modal */}
            <input type='checkbox' id={`rankEdit_modal_${rank.id}`} className='modal-toggle' />

            <div className='modal'>
                <div className='modal-box relative'>
                    <label onClick={closeModal} className='btn btn-sm btn-circle absolute right-2 top-2'>
                        ✕
                    </label>

                    <h3 className='flex justify-center text-lg font-bold mb-4'>Edit Rank</h3>

                    <hr className='mb-4' />

                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-2'>Rank Name:</label>
                        <input
                            type='text'
                            className='input input-bordered w-full'
                            value={editRankValue}
                            onChange={(e) => setEditRankValue(e.target.value)}
                            placeholder='Enter rank name'
                        />
                    </div>

                    <div
                        key={`edit-add-sched-edit-tr(${editRankId})`}
                        className='mt-2 overflow-y-auto h-36 max-h-36 border border-base-content border-opacity-20 rounded-lg'
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#a0aec0 #edf2f7',
                        }} // Optional for styled scrollbars
                    >
                        <div
                            className='flex flex-wrap bg-base-200'
                            style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                            }}
                        >
                            <div className='w-3/12 flex justify-center items-center'>
                                <button
                                    className='w-3/4 bg-green-700 m-2 font-bold rounded-lg hover:bg-green-500'
                                    onClick={handleAddAdditionalSchedule}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        {editAdditionalRankScheds.map((sched, index) => (
                            <div key={index} className='flex flex-wrap border border-base-content border-opacity-20 rounded-lg'>
                                <button
                                    className='w-1/12 flex items-center justify-center hover:text-error hover:bg-base-200 rounded-lg'
                                    onClick={() => handleDeleteAdditionalSchedule(index)}
                                >
                                    <RiDeleteBin7Line size={15} />
                                </button>
                                <div className='w-10/12'>
                                    <button
                                        className='w-full text-xs p-2 shadow-sm '
                                        onClick={() =>
                                            document
                                                .getElementById(`add_additional_sched_modal_1_tr-${editRankId}_idx-${index}`)
                                                .showModal()
                                        }
                                    >
                                        {sched.name || sched.subject ? (
                                            // Content to show when both are not empty
                                            <>
                                                <p>Name: {sched.name}</p>
                                                <p>Subject: {sched.subject === -1 ? 'N/A' : subjects[sched.subject].subject}</p>
                                            </>
                                        ) : (
                                            // Content to show when either is empty
                                            <p>Untitled Schedule {index + 1}</p>
                                        )}
                                    </button>
                                    <AdditionalScheduleForTeacherRank
                                        viewingMode={1}
                                        rankID={editRankId}
                                        arrayIndex={index}
                                        additionalSchedsOfRank={sched}
                                    />
                                </div>
                                <div className='w-1/12 text-xs font-bold flex text-center hover:text-primary hover:bg-base-200 rounded-lg justify-center items-center p-2 cursor-pointer'>
                                    <button
                                        onClick={() =>
                                            document
                                                .getElementById(`add_additional_sched_modal_0_tr-${editRankId}_idx-${index}`)
                                                .showModal()
                                        }
                                    >
                                        <RiEdit2Fill size={15} />
                                    </button>
                                    <AdditionalScheduleForTeacherRank
                                        viewingMode={0}
                                        rankID={editRankId}
                                        arrayIndex={index}
                                        numOfSchoolDays={numOfSchoolDays}
                                        additionalSchedsOfRank={sched}
                                        setAdditionalScheds={setEditAdditionalRankScheds}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {errorMessage && <p className='flex justify-center text-red-500 text-sm my-4 font-medium'>{errorMessage}</p>}

                    <div className='flex justify-center gap-2 mt-4'>
                        <button
                            className='btn btn-primary '
                            onClick={() => document.getElementById(`confirm_rank_edit_modal_${rank.id}`).showModal()}
                        >
                            Update Rank
                        </button>
                        <button className='btn btn-error ' onClick={() => resetStates()}>
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for confirming program modifications */}
            <dialog id={`confirm_rank_edit_modal_${rank.id}`} className='modal modal-bottom sm:modal-middle'>
                <div className='modal-box' style={{ width: '30%', maxWidth: 'none' }}>
                    <div>
                        <div className='mb-3 text-center text-lg font-bold'>Confirmation for Modifications on Rank</div>
                    </div>

                    <div>
                        <div className='m-2 p-2'>
                            Your modifications in this rank will be now saved. Would you also like to for the ADDITIONAL SCHEDULE
                            changes to reflect on all associated teachers?
                        </div>
                        <div className='mt-4 flex justify-center items-center gap-3'>
                            <button
                                className='btn btn-sm bg-green-400 hover:bg-green-200'
                                onClick={async () => {
                                    await handleSaveRankEditClick(true);
                                }}
                            >
                                Yes
                            </button>
                            <button
                                className='btn btn-sm'
                                onClick={async () => {
                                    await handleSaveRankEditClick(false);
                                }}
                            >
                                No
                            </button>
                        </div>
                    </div>

                    <div className='modal-action w-full mt-0'>
                        <button
                            className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
                            onClick={handleConfirmationModalClose}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default TeacherRankEdit;
