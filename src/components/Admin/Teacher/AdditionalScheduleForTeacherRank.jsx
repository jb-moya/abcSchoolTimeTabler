
import { useState, useEffect, useRef } from 'react';
import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';
import TimeSelector from '@utils/timeSelector';
import clsx from 'clsx';

const AdditionalScheduleForTeacherRank = ({
    viewingMode = 0,
    rankID = 0,
    arrayIndex = 0,
    numOfSchoolDays = 1,
    additionalSchedsOfRank = [],
    setAdditionalScheds = () => {},
}) => {

    const lastSchedTimeRef = useRef();

// =============================================================================

    const [schedName, setSchedName] = useState(additionalSchedsOfRank.name);

    const [schedSubject, setSchedSubject] = useState(additionalSchedsOfRank.subject || -1);

    const [schedDuration, setSchedDuration] = useState(additionalSchedsOfRank.duration || 0);

    const [schedFrequency, setSchedFrequency] = useState(additionalSchedsOfRank.frequency || 0);

    const [schedShown, setSchedShown] = useState(additionalSchedsOfRank.shown || false);

    const [schedTime, setSchedtime] = useState(additionalSchedsOfRank.time || 0);

// =============================================================================

    const [time, setTime] = useState();

// =============================================================================

    const handleSave = () => {
        const newSched = {
            name: schedName,
            subject: schedSubject,
            duration: schedDuration,
            frequency: schedFrequency,
            shown: schedShown,
            time: getTimeSlotIndex(time),
        };

        // console.log('Old Sched: ', additionalSchedsOfRank);

        setAdditionalScheds((prev) => {
            const updatedScheds = [...prev];
            updatedScheds[arrayIndex] = newSched;

            // console.log('Updated Scheds:', updatedScheds);

            return updatedScheds;
        });

        resetStates();

        document
            .getElementById(
                `add_additional_sched_modal_${viewingMode}_tr-${rankID}_idx-${arrayIndex}`
            )
            .close();
    };

    const handleClose = () => {
        const modal = document.getElementById(
            `add_additional_sched_modal_${viewingMode}_tr-${rankID}_idx-${arrayIndex}`
        );

        resetStates();

        if (modal) {
            modal.close();
        }
    };

    const resetStates = () => {
        setSchedName(additionalSchedsOfRank.name);
        setSchedSubject(additionalSchedsOfRank.subject);
        setSchedDuration(additionalSchedsOfRank.duration);
        setSchedFrequency(additionalSchedsOfRank.frequency);
        setSchedShown(additionalSchedsOfRank.frequency);
        setSchedtime(additionalSchedsOfRank.time);
    };

// =============================================================================

    useEffect(() => {
        setSchedName(additionalSchedsOfRank.name || '');
        setSchedSubject(additionalSchedsOfRank.subject || -1);
        setSchedDuration(additionalSchedsOfRank.duration || 0);
        setSchedFrequency(additionalSchedsOfRank.frequency || '');
        setSchedShown(additionalSchedsOfRank.shown || false);
        setSchedtime(additionalSchedsOfRank.time || 0);
    }, [additionalSchedsOfRank]);

    useEffect(() => {
        if (schedTime !== lastSchedTimeRef.current) {
            lastSchedTimeRef.current = schedTime;

            const timeString = getTimeSlotString(schedTime);
            // console.log('schedTime', schedTime);

            // console.log('timeString', timeString);

            if (timeString) {
                setTime(timeString);
            }

        }
    }, [schedTime]);

// =============================================================================

    // useEffect(() => {
    //     console.log('schedName', schedName);
    //     console.log('schedSubject', schedSubject);
    //     console.log('typeof schedSubject', typeof schedSubject);
    //     console.log('schedDuration', schedDuration);
    //     console.log('schedFrequency', schedFrequency);
    //     console.log('schedShown', schedShown);
    // }, [schedName, schedSubject, schedDuration, schedFrequency, schedShown]);

    return (
        <dialog
            id={`add_additional_sched_modal_${viewingMode}_tr-${rankID}_idx-${arrayIndex}`}
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

                    {/* Schedule Subject */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Subject:
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value='N/A'
                            placeholder="Enter schedule name"
                            readOnly
                        />
                    </div>

                    {/* Schedule Duration */}
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

                    {/* Schedule Frequency */}
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

                    {/* Schedule time */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Time:
                        </label>
                        {viewingMode === 0 ? (
                            <TimeSelector 
                                className='z-10'
                                key={`newRankTimePicker-rank{${rankID}}-arrayIndex${arrayIndex}`}
                                interval={5}
                                time={time}
                                setTime={setTime}
                            />
                        ) : (
                            <div className="flex items-center justify-start input border rounded h-12 bg-white border border-gray-300 text-base">
                                {time ? time : '--:--- --'}
                            </div>
                        )}
                        
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

export default AdditionalScheduleForTeacherRank;