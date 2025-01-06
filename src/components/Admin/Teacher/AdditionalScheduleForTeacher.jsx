
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';
import TimeSelector from '@utils/timeSelector';
import clsx from 'clsx';


const AdditionalScheduleForTeacher = ({
	viewingMode = 0,
	teacherID = 0,
	arrayIndex = 0,
	teacherSubjects = [],
	numOfSchoolDays = 1,
	additionalSchedsOfTeacher = [],
	setAdditionalScheds = () => {},
}) => {

	const lastSchedTimeRef = useRef();

// =============================================================================

	const subjects = useSelector((state) => state.subject.subjects);

// ============================================================================

	const [schedName, setSchedName] = useState(
		additionalSchedsOfTeacher.name || ''
	);
	const [schedSubject, setSchedSubject] = useState(
		additionalSchedsOfTeacher.subject || -1
	);
	const [schedDuration, setSchedDuration] = useState(
		additionalSchedsOfTeacher.duration || 0
	);
	const [schedFrequency, setSchedFrequency] = useState(
		additionalSchedsOfTeacher.frequency || 0
	);
	const [schedShown, setSchedShown] = useState(
		additionalSchedsOfTeacher.shown || false
	);
	const [schedTime, setSchedtime] = useState(
        additionalSchedsOfTeacher.time || 0
    );

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


		setAdditionalScheds((prev) => {
			const updatedScheds = [...prev];
			updatedScheds[arrayIndex] = newSched;

			return updatedScheds;
		});

		resetStates();

		document
			.getElementById(
				`add_additional_sched_modal_${viewingMode}_teacher-${teacherID}_idx-${arrayIndex}`
			)
			.close();
	};

	const handleClose = () => {
		const modal = document.getElementById(
			`add_additional_sched_modal_${viewingMode}_teacher-${teacherID}_idx-${arrayIndex}`
		);

		resetStates();

		if (modal) {
			modal.close();
		}
	};

	const resetStates = () => {
		setSchedName(additionalSchedsOfTeacher.name);
		setSchedSubject(additionalSchedsOfTeacher.subject);
		setSchedDuration(additionalSchedsOfTeacher.duration);
		setSchedFrequency(additionalSchedsOfTeacher.frequency);
		setSchedShown(additionalSchedsOfTeacher.frequency);
		setSchedtime(additionalSchedsOfTeacher.time);
	};

// ============================================================================

	useEffect(() => {
		setSchedName(additionalSchedsOfTeacher.name || '');
		setSchedSubject(additionalSchedsOfTeacher.subject || -1);
		setSchedDuration(additionalSchedsOfTeacher.duration || 0);
		setSchedFrequency(additionalSchedsOfTeacher.frequency || '');
		setSchedShown(additionalSchedsOfTeacher.shown || false);
		setSchedtime(additionalSchedsOfTeacher.time || 0);
	}, [additionalSchedsOfTeacher]);

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
			id={`add_additional_sched_modal_${viewingMode}_teacher-${teacherID}_idx-${arrayIndex}`}
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

					{/* SCHEDULE NAME */}
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

					{/* SCHEDULE SUBJECT */}
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
                                <option value={0} className="text-gray-400">
                                    N/A
                                </option>
                                {teacherSubjects.map((id) => (
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

					{/* SCHEDULE DURATION */}
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

					{/* SCHEDULE FREQUENCY */}
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

					{/* SCHEDULE MUST APPEAR */}
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

					{/* SCHEDULE TIME */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Time:
                        </label>
                        {viewingMode === 0 ? (
                            <TimeSelector 
                                className='z-10'
                                key={`newTeacherTimePicker-teacher{${teacherID}}-arrayIndex${arrayIndex}`}
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

export default AdditionalScheduleForTeacher;


