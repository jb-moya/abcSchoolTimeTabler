import { clsx } from 'clsx';
import { useState, useEffect, useRef} from 'react';
import { useSelector } from 'react-redux';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';

import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';

const AdditionalScheduleForProgram = ({
    viewingMode = 0,
    programID = 0,
    grade = 0,
    arrayIndex = 0,
    progYearSubjects = [],
    numOfSchoolDays = 1,
    additionalSchedsOfProgYear = [],
    setAdditionalScheds = () => {},
}) => {

    // const subjects = useSelector((state) => state.subject.subjects);

    const { documents: subjects, loading1, error1 } = fetchDocuments('subjects');

// ==============================================================================

    const [schedName, setSchedName] = useState(
        additionalSchedsOfProgYear.name || ''
    );
    const [schedSubject, setSchedSubject] = useState(
        additionalSchedsOfProgYear.subject || -1
    );
    const [schedDuration, setSchedDuration] = useState(
        additionalSchedsOfProgYear.duration || 0
    );
    const [schedFrequency, setSchedFrequency] = useState(
        additionalSchedsOfProgYear.frequency || 0
    );
    const [schedShown, setSchedShown] = useState(
        additionalSchedsOfProgYear.shown || false
    );

// ==============================================================================

    const handleSave = () => {
        const newSched = {
            name: schedName,
            subject: schedSubject,
            duration: schedDuration,
            frequency: schedFrequency,
            shown: schedShown,
        };

        setAdditionalScheds((prev) => {
            const updatedScheds = { ...prev };

            const updatedGradeScheds = [...(updatedScheds[grade] || [])];

            updatedGradeScheds[arrayIndex] = newSched;

            updatedScheds[grade] = updatedGradeScheds;

            return updatedScheds;
        });

        document
            .getElementById(
                `add_additional_sched_modal_${viewingMode}_grade-${grade}_prog-${programID}_idx-${arrayIndex}`
            )
            .close();
    };

    const handleClose = () => {
        const modal = document.getElementById(
            `add_additional_sched_modal_${viewingMode}_grade-${grade}_prog-${programID}_idx-${arrayIndex}`
        );

        resetStates();

        if (modal) {
            modal.close();
        }
    };

    const resetStates = () => {
        setSchedName(additionalSchedsOfProgYear.name);
        setSchedSubject(additionalSchedsOfProgYear.subject);
        setSchedDuration(additionalSchedsOfProgYear.duration);
        setSchedFrequency(additionalSchedsOfProgYear.frequency);
        setSchedShown(additionalSchedsOfProgYear.frequency);
    };

// ==============================================================================

    useEffect(() => {
        setSchedName(additionalSchedsOfProgYear.name || '');
        setSchedSubject(additionalSchedsOfProgYear.subject || -1);
        setSchedDuration(additionalSchedsOfProgYear.duration || 0);
        setSchedFrequency(additionalSchedsOfProgYear.frequency || 0);
        setSchedShown(additionalSchedsOfProgYear.shown || false);
    }, [additionalSchedsOfProgYear]);

    // useEffect(() => {
    //     console.log('schedName', schedName);
    //     console.log('schedSubject', schedSubject);
    //     console.log('typeof schedSubject', typeof schedSubject);
    //     console.log('schedDuration', schedDuration);
    //     console.log('schedFrequency', schedFrequency);
    //     console.log('schedShown', schedShown);
    //     console.log('schedTime', schedTime);
    // }, [schedName, schedSubject, schedDuration, schedFrequency, schedShown, schedTime]);

// ==============================================================================

    return (
        <dialog
            id={`add_additional_sched_modal_${viewingMode}_grade-${grade}_prog-${programID}_idx-${arrayIndex}`}
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
                                value={schedSubject === -1 ? -1 : schedSubject}
                                onChange={(e) =>
                                    setSchedSubject(Number(e.target.value))
                                }
                            >
                                <option value={-1} className="text-gray-400">
                                    N/A
                                </option>
                                {progYearSubjects.map((id) => (
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

export default AdditionalScheduleForProgram;