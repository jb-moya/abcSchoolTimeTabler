import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import clsx from 'clsx';

import { subscribeToSubjects } from '@features/slice/subject_slice';

const AdditionalScheduleForSection = ({
    viewingMode = 0,
    sectionID = 0,
    grade = 0,
    arrayIndex = 0,
    sectionSubjects = [],
    numOfSchoolDays = 1,
    additionalSchedsOfSection = [],
    setAdditionalScheds = () => {},
}) => {

    const dispatch = useDispatch();

// ===================================================================================================

    // const { documents: subjects, loading1, error1 } = fetchDocuments('subjects');
    const { data: subjects, loading1, error1 } = useSelector((state) => state.subjects);

    useEffect(() => {
        dispatch(subscribeToSubjects());
    }, [dispatch]);

// ===================================================================================================

    const [schedName, setSchedName] = useState(
        additionalSchedsOfSection.name || ''
    );
    const [schedSubject, setSchedSubject] = useState(
        additionalSchedsOfSection.subject || 0
    );
    const [schedDuration, setSchedDuration] = useState(
        additionalSchedsOfSection.duration || 0
    );
    const [schedFrequency, setSchedFrequency] = useState(
        additionalSchedsOfSection.frequency || 0
    );
    const [schedShown, setSchedShown] = useState(
        additionalSchedsOfSection.shown || false
    );

// ===================================================================================================

    const handleSave = () => {
        const newSched = {
            name: schedName,
            subject: schedSubject,
            duration: schedDuration,
            frequency: schedFrequency,
            shown: schedShown,
        };

        // console.log('Old Sched: ', additionalSchedsOfSection);

        setAdditionalScheds((prev) => {
            const updatedScheds = [...prev];
            updatedScheds[arrayIndex] = newSched;

            // console.log('Updated Scheds:', updatedScheds);

            return updatedScheds;
        });

        resetStates();

        document
            .getElementById(
                `add_additional_sched_modal_${viewingMode}_grade-${grade}_sec-${sectionID}_idx-${arrayIndex}`
            )
            .close();
    };

// ===================================================================================================

    const handleClose = () => {
        const modal = document.getElementById(
            `add_additional_sched_modal_${viewingMode}_grade-${grade}_sec-${sectionID}_idx-${arrayIndex}`
        );

        resetStates();

        if (modal) {
            modal.close();
        }
    };

    const resetStates = () => {
        setSchedName(additionalSchedsOfSection.name);
        setSchedSubject(additionalSchedsOfSection.subject);
        setSchedDuration(additionalSchedsOfSection.duration);
        setSchedFrequency(additionalSchedsOfSection.frequency);
        setSchedShown(additionalSchedsOfSection.frequency);
    };

// ===================================================================================================

    useEffect(() => {
        setSchedName(additionalSchedsOfSection.name || '');
        setSchedSubject(additionalSchedsOfSection.subject || 0);
        setSchedDuration(additionalSchedsOfSection.duration || 0);
        setSchedFrequency(additionalSchedsOfSection.frequency || '');
        setSchedShown(additionalSchedsOfSection.shown || false);
    }, [additionalSchedsOfSection]);

// ===================================================================================================

    return (
        <dialog
            id={`add_additional_sched_modal_${viewingMode}_grade-${grade}_sec-${sectionID}_idx-${arrayIndex}`}
            className="modal modal-bottom sm:modal-middle"
        >
            <div className="modal-box">
                <div>
                    <div className="mb-3 text-center text-lg font-bold">
                        {viewingMode === 1 ? (
                            <div>View Mode</div>
                        ) : (
                            <div>Edit Mode</div>
                        )}
                    </div>

                    {/* Schedule Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Schedule Name:
                        </label>
                        <input
                            type="text"
                            // ref={inputNameRef}
                            className="input input-bordered w-full"
                            value={schedName}
                            onChange={(e) => setSchedName(e.target.value)}
                            placeholder="Enter schedule name"
                            // disabled={viewingMode !== 0}
                            readOnly={viewingMode !== 0}
                        />
                    </div>

                    {/* Subject */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Subject:
                        </label>
                        {viewingMode === 0 ? (
                            <select
                                className="input input-bordered w-full"
                                value={schedSubject === 0 ? 0 : schedSubject}
                                onChange={(e) =>
                                    setSchedSubject(Number(e.target.value))
                                }
                            >
                                <option value={0} className="text-gray-400">
                                    N/A
                                </option>
                                {sectionSubjects.map((id) => (
                                    <option key={id} value={id}>
                                        {subjects[id]?.subject}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={subjects[schedSubject]?.subject || 'N/A'}
                                // disabled
                                readOnly
                            />
                        )}
                    </div>

                    {/* Duration */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Duration (in minutes):
                        </label>
                        <input
                            type="number"
                            className="input input-bordered w-full"
                            value={schedDuration}
                            onChange={(e) =>
                                setSchedDuration(Number(e.target.value))
                            }
                            placeholder="Enter duration"
                            // disabled={viewingMode !== 0}
                            readOnly={viewingMode !== 0}
                        />
                    </div>

                    {/* Frequency */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Frequency:
                        </label>
                        <input
                            type="number"
                            className="input input-bordered w-full"
                            value={schedFrequency}
                            onChange={(e) =>
                                setSchedFrequency(Number(e.target.value))
                            }
                            placeholder="Enter frequency"
                            min={1}
                            max={numOfSchoolDays}
                            // disabled={viewingMode !== 0}
                            readOnly={viewingMode !== 0}
                        />
                    </div>

                    {/* Must Appear on Schedule */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Must Appear on Schedule:
                        </label>
                        <select
                            className={clsx('input input-bordered w-full', {
                                'pointer-events-none': viewingMode !== 0,
                                select: viewingMode === 0,
                            })}
                            value={schedShown ? 'Yes' : 'No'}
                            onChange={(e) =>
                                setSchedShown(e.target.value === 'Yes')
                            }
                            // disabled={viewingMode !== 0}
                            readOnly={viewingMode !== 0}
                        >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div className="mt-4 text-center text-lg font-bold">
                        {viewingMode !== 1 && (
                            <div className="flex flex-wrap gap-2 justify-center">
                                <button
                                    className="btn btn-sm rounded-lg bg-green-600 text-white hover:bg-green-500"
                                    onClick={handleSave}
                                >
                                    Save
                                </button>
                                <button
                                    className="btn btn-sm rounded-lg bg-red-600 text-white hover:bg-red-500"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-action w-full mt-0">
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        onClick={handleClose}
                    >
                        ✕
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default AdditionalScheduleForSection;