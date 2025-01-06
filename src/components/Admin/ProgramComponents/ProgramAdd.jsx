import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';
import { toast } from 'sonner';
import SearchableDropdownToggler from '../searchableDropdown';

import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { IoWarningSharp } from 'react-icons/io5';

import AdditionalScheduleForProgram from './AdditionalScheduleForProgram';
import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import TimeSelector from '@utils/timeSelector';

const AddProgramContainer = ({
    close,
    reduxField,
    reduxFunction,
    morningStartTime,
    afternoonStartTime,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays,
    breakTimeDuration,
}) => {
    const inputNameRef = useRef();
    const dispatch = useDispatch();

    // ===============================================================================

    const subjects = useSelector((state) => state.subject.subjects);

    const programs = useSelector((state) => state.program.programs);

    // ==============================================================================

    const [inputValue, setInputValue] = useState('');

    const [selectedSubjects, setSelectedSubjects] = useState({
        7: [],
        8: [],
        9: [],
        10: [],
    });

    const [fixedDays, setFixedDays] = useState({
        7: {},
        8: {},
        9: {},
        10: {},
    });

    const [fixedPositions, setFixedPositions] = useState({
        7: {},
        8: {},
        9: {},
        10: {},
    });

    const [selectedShifts, setSelectedShifts] = useState({
        7: 0, // 0 for AM, 1 for PM
        8: 0,
        9: 0,
        10: 0,
    });

    const [startTimes, setStartTimes] = useState({
        7: morningStartTime,
        8: morningStartTime,
        9: morningStartTime,
        10: morningStartTime,
    });

    const [endTimes, setEndTimes] = useState({
        7: afternoonStartTime,
        8: afternoonStartTime,
        9: afternoonStartTime,
        10: afternoonStartTime,
    });

    const [additionalScheds, setAdditionalScheds] = useState({
        7: [],
        8: [],
        9: [],
        10: [],
    });

    // For invalid end times
    const [validEndTimes, setValidEndTimes] = useState({
        7: true,
        8: true,
        9: true,
        10: true,
    });

    const isAddButtonDisabled = Object.values(validEndTimes).some((value) => !value);

    // ==============================================================================

    // Input
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // End Time
    const handleEndTimeChange = () => {
        console.log('breakTimeDuration', breakTimeDuration);

        [7, 8, 9, 10].forEach((grade) => {
            if (selectedSubjects[grade].length === 0) return;

            const startTimeIdx = getTimeSlotIndex(startTimes[grade]);
            const breakTimeCount = selectedSubjects[grade].length > 10 ? 2 : 1;

            let totalDuration = breakTimeCount * breakTimeDuration;

            selectedSubjects[grade].forEach((subId) => {
                totalDuration += subjects[subId].classDuration;
            });

            const endTimeIdx = Math.ceil(totalDuration / 5) + startTimeIdx;

            if (!getTimeSlotString(endTimeIdx)) {
                setValidEndTimes((prevValidEndTimes) => ({
                    ...prevValidEndTimes,
                    [grade]: false,
                }));
                return;
            }

            setValidEndTimes((prevValidEndTimes) => ({
                ...prevValidEndTimes,
                [grade]: true,
            }));

            setEndTimes((prevEndTimes) => ({
                ...prevEndTimes,
                [grade]: endTimeIdx || 216, // 216 = 6:00 PM
            }));
        });
    };

    useEffect(() => {
        handleEndTimeChange();
    }, [selectedSubjects, startTimes, breakTimeDuration]);

    // Subjects
    const handleSubjectSelection = (grade, selectedList) => {
        const validCombinations = [];

        setSelectedSubjects((prevState) => ({
            ...prevState,
            [grade]: selectedList,
        }));

        const updatedFixedDays = structuredClone(fixedDays[grade]);
        const updatedFixedPositions = structuredClone(fixedPositions[grade]);

        Object.keys(updatedFixedDays).forEach((subID) => {
            if (!selectedList.includes(Number(subID))) {
                delete updatedFixedDays[subID];
                delete updatedFixedPositions[subID];
            }
        });

        selectedList.forEach((subjectID) => {
            if (!updatedFixedDays[subjectID]) {
                const subject = subjects[subjectID];
                if (subject) {
                    const numClasses = Math.min(Math.ceil(subject.weeklyMinutes / subject.classDuration), numOfSchoolDays);
                    updatedFixedDays[subjectID] = Array(numClasses).fill(0);
                    updatedFixedPositions[subjectID] = Array(numClasses).fill(0);
                }
            }
        });

        selectedList.forEach((subID) => {
            const subjDays = updatedFixedDays[subID] || [];
            const subjPositions = updatedFixedPositions[subID] || [];

            subjDays.forEach((day, index) => {
                const position = subjPositions[index];
                if (day !== 0 && position !== 0) {
                    validCombinations.push([day, position]);
                }
            });
        });

        selectedList.forEach((subID) => {
            const subjDays = updatedFixedDays[subID];
            const subjPositions = updatedFixedPositions[subID];

            for (let i = 0; i < subjDays.length; i++) {
                if (subjPositions[i] > selectedList.length || subjDays[i] > numOfSchoolDays) {
                    subjDays[i] = 0;
                    subjPositions[i] = 0;
                }
            }

            updatedFixedDays[subID] = subjDays;
            updatedFixedPositions[subID] = subjPositions;
        });

        setFixedDays((prevState) => ({
            ...prevState,
            [grade]: updatedFixedDays, // Update only the specified grade
        }));

        setFixedPositions((prevState) => ({
            ...prevState,
            [grade]: updatedFixedPositions, // Update only the specified grade
        }));
    };

    // Shift
    const handleShiftSelection = (grade, shift) => {
        setSelectedShifts((prevState) => ({
            ...prevState,
            [grade]: shift,
        }));

        const defaultTime = shift === 0 ? morningStartTime : afternoonStartTime;
        setStartTimes((prevTimes) => ({
            ...prevTimes,
            [grade]: defaultTime,
        }));
    };

    // Additional Schedules
    const handleAddAdditionalSchedule = (grade) => {
        setAdditionalScheds((prevScheds) => ({
            ...prevScheds,
            [grade]: [
                ...prevScheds[grade],
                {
                    name: '',
                    subject: -1,
                    duration: 60,
                    frequency: 1,
                    shown: true,
                },
            ],
        }));
    };

    const handleDeleteAdditionalSchedule = (grade, index) => {
        setAdditionalScheds((prevScheds) => ({
            ...prevScheds,
            [grade]: prevScheds[grade].filter((_, i) => i !== index),
        }));
    };

    // ==============================================================================

    const handleAddEntry = () => {
        if (!inputValue.trim()) {
            setErrorMessage('Program name cannot be empty');
            setErrorField('program');
            return;
        } else if (selectedSubjects[7].length === 0) {
            setErrorMessage('Select at least one subject for grade 7');
            setErrorField('sub7');
            return;
        } else if (selectedShifts[7] === undefined || !startTimes[7]) {
            setErrorMessage('Select shift and start time for grade 7');
            setErrorField('subTime7');
            return;
        } else if (selectedSubjects[8].length === 0) {
            setErrorMessage('Select at least one subject for grade 8');
            setErrorField('sub8');
            return;
        } else if (selectedShifts[8] === undefined || !startTimes[8]) {
            setErrorMessage('Select shift and start time for grade 8');
            setErrorField('subTime8');
            return;
        } else if (selectedSubjects[9].length === 0) {
            setErrorMessage('Select at least one subject for grade 9');
            setErrorField('sub9');
            return;
        } else if (selectedShifts[9] === undefined || !startTimes[9]) {
            setErrorMessage('Select shift and start time for grade 9');
            setErrorField('subTime9');
            return;
        } else if (selectedSubjects[10].length === 0) {
            setErrorMessage('Select at least one subject for grade 10');
            setErrorField('sub10');
            return;
        } else if (selectedShifts[10] === undefined || !startTimes[10]) {
            setErrorMessage('Select shift and start time for grade 10');
            setErrorField('subTime10');
            return;
        }

        const duplicateProgram = Object.values(programs).find(
            (program) => program.program.trim().toLowerCase() === inputValue.trim().toLowerCase()
        );

        if (duplicateProgram) {
            setErrorMessage('A program with this name already exists.');
            setErrorField('program');
        } else {
            dispatch(
                reduxFunction({
                    [reduxField[0]]: inputValue,
                    7: {
                        subjects: selectedSubjects[7],
                        fixedDays: fixedDays[7],
                        fixedPositions: fixedPositions[7],
                        shift: selectedShifts[7],
                        startTime: getTimeSlotIndex(startTimes[7]),
                        endTime: endTimes[7],
                        additionalScheds: additionalScheds[7],
                    },
                    8: {
                        subjects: selectedSubjects[8],
                        fixedDays: fixedDays[8],
                        fixedPositions: fixedPositions[8],
                        shift: selectedShifts[8],
                        startTime: getTimeSlotIndex(startTimes[8]),
                        endTime: endTimes[8],
                        additionalScheds: additionalScheds[8],
                    },
                    9: {
                        subjects: selectedSubjects[9],
                        fixedDays: fixedDays[9],
                        fixedPositions: fixedPositions[9],
                        shift: selectedShifts[9],
                        startTime: getTimeSlotIndex(startTimes[9]),
                        endTime: endTimes[9],
                        additionalScheds: additionalScheds[9],
                    },
                    10: {
                        subjects: selectedSubjects[10],
                        fixedDays: fixedDays[10],
                        fixedPositions: fixedPositions[10],
                        shift: selectedShifts[10],
                        startTime: getTimeSlotIndex(startTimes[10]),
                        endTime: endTimes[10],
                        additionalScheds: additionalScheds[10],
                    },
                })
            );

            toast.success('Program added successfully!', {
                style: {
                    backgroundColor: 'green',
                    color: 'white',
                    bordercolor: 'green',
                },
            });
            handleReset();
            close();
        }
    };

    const handleReset = () => {
        setErrorField('');
        setErrorMessage('');
        setInputValue('');
        setSelectedSubjects({
            7: [],
            8: [],
            9: [],
            10: [],
        });
        setFixedDays({
            7: {},
            8: {},
            9: {},
            10: {},
        });
        setFixedPositions({
            7: {},
            8: {},
            9: {},
            10: {},
        });
        setSelectedShifts({
            7: 0,
            8: 0,
            9: 0,
            10: 0,
        });
        setStartTimes({
            7: morningStartTime,
            8: morningStartTime,
            9: morningStartTime,
            10: morningStartTime,
        });
        setAdditionalScheds({
            7: [],
            8: [],
            9: [],
            10: [],
        });
    };

    const handleClose = () => {
        setInputValue('');
        setSelectedSubjects({
            7: [],
            8: [],
            9: [],
            10: [],
        });
        setFixedDays({
            7: {},
            8: {},
            9: {},
            10: {},
        });
        setFixedPositions({
            7: {},
            8: {},
            9: {},
            10: {},
        });
        setSelectedShifts({
            7: 0,
            8: 0,
            9: 0,
            10: 0,
        });
        setStartTimes({
            7: morningStartTime,
            8: morningStartTime,
            9: morningStartTime,
            10: morningStartTime,
        });

        document.getElementById('add_program_modal').close();
    };

    // ===================================================================================

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    // ==============================================================================

    return (
        <dialog id='add_program_modal' className='modal modal-bottom sm:modal-middle'>
            <div className='modal-box' style={{ width: '60%', maxWidth: 'none' }}>
                <div className='p-6'>
                    {/* Header section with centered "Add {reduxField}" */}
                    <div className='flex justify-between mb-4'>
                        <h3 className='text-lg font-bold text-center w-full'>
                            Add New {reduxField[0].charAt(0).toUpperCase() + reduxField[0].slice(1).toLowerCase()}
                        </h3>
                    </div>

                    {/* Input field for program name */}
                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-2'>Program Name:</label>
                        <input
                            type='text'
                            ref={inputNameRef}
                            className='input input-bordered w-full'
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder='Enter Program name'
                        />
                    </div>

                    {/* Subject, shift, and fixed schedules management */}
                    <div className='text-sm flex flex-col space-y-4'>
                        {[7, 8, 9, 10].map((grade) => (
                            <div key={grade}>
                                <div>
                                    <h3 className='font-bold mb-2'>{`Grade ${grade}`}</h3>
                                </div>
                                <div className='flex flex-wrap'>
                                    <div key={grade} className='w-7/12 shadow-md rounded-lg p-4'>
                                        {/* Shift selection */}
                                        <div className='mt-2 mb-2 text-base flex flex-wrap items-start'>
                                            <label className='w-1/4 mr-2 p-2 flex justify-end font-bold'>SHIFT</label>
                                            <div className='flex flex-col pl-2'>
                                                <label className='mb-1'>
                                                    <input
                                                        type='radio'
                                                        value={selectedShifts[grade]}
                                                        checked={selectedShifts[grade] === 0}
                                                        onChange={() => handleShiftSelection(grade, 0)}
                                                    />
                                                    AM
                                                </label>
                                                <label>
                                                    <input
                                                        type='radio'
                                                        value={selectedShifts[grade]}
                                                        checked={selectedShifts[grade] === 1}
                                                        onChange={() => handleShiftSelection(grade, 1)}
                                                    />
                                                    PM
                                                </label>
                                            </div>
                                        </div>

                                        {/* Start time selection */}
                                        <div className='mt-2 flex flex-wrap'>
                                            {/* Label */}
                                            <label className='w-1/4 mr-2 p-2 text-base flex items-center justify-end font-bold'>
                                                START TIME
                                            </label>

                                            {/* Time selector */}
                                            <div className='w-7/12 pl-2'>
                                                <TimeSelector
                                                    time={startTimes[grade]}
                                                    setTime={(newTime) => {
                                                        setStartTimes((prevStartTimes) => ({
                                                            ...prevStartTimes,
                                                            [grade]: newTime, // Update the specific grade's time
                                                        }));
                                                    }}
                                                    am={selectedShifts[grade] === 0 ? 1 : 0}
                                                    pm={selectedShifts[grade] === 1 ? 1 : 0}
                                                />
                                            </div>

                                            {/* Warning icon */}
                                            {!validEndTimes[grade] && (
                                                <div
                                                    className='w-auto flex ml-2 items-center tooltip text-red-500'
                                                    data-tip='Total class time exceeds the day, consider adjusting the start time.'
                                                >
                                                    <IoWarningSharp size={35} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Subject selection */}
                                        <div className='flex items-center mb-2 py-4 flex-wrap'>
                                            <div className='m-1'>
                                                <SearchableDropdownToggler
                                                    selectedList={selectedSubjects[grade]}
                                                    setSelectedList={(list) => handleSubjectSelection(grade, list)}
                                                />
                                            </div>
                                            {selectedSubjects[grade]?.map((id, index) => (
                                                <div key={id} className='p-2'>
                                                    <div className='h-10 w-20 bg-green-400 rounded-md flex items-center justify-center truncate'>
                                                        {subjects[id]?.subject}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Setting of fixed schedule (optional) */}
                                        {selectedSubjects[grade]?.length > 0 && (
                                            <div>
                                                <button
                                                    className='btn btn-primary'
                                                    onClick={() =>
                                                        document
                                                            .getElementById(
                                                                `assign_fixed_sched_modal_prog(0)-grade(${grade})-view(0)`
                                                            )
                                                            .showModal()
                                                    }
                                                >
                                                    Open Fixed Schedule Maker
                                                </button>

                                                <FixedScheduleMaker
                                                    key={grade}
                                                    viewingMode={0}
                                                    pvs={0}
                                                    program={0}
                                                    grade={grade}
                                                    // totalTimeslot={
                                                    //     gradeTotalTimeslot[grade]
                                                    // }
                                                    additionalSchedules={additionalScheds[grade] || []}
                                                    selectedSubjects={selectedSubjects[grade]}
                                                    fixedDays={fixedDays[grade]}
                                                    setFixedDays={setFixedDays}
                                                    fixedPositions={fixedPositions[grade]}
                                                    setFixedPositions={setFixedPositions}
                                                    numOfSchoolDays={numOfSchoolDays}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className='w-5/12 p-1 rounded-lg'>
                                        <div className='font-bold bg-base-200 p-2 rounded-lg'>Additional Schedules</div>
 
                                        {/* Button to add schedules */}
                                        <button
                                            onClick={() => handleAddAdditionalSchedule(grade)}
                                            className='flex flex-wrap items-right text-xs mt-2 bg-blue-500 px-2 py-1 rounded-lg hover:bg-blue-600'
                                        >
                                            Add Schedule
                                        </button>

                                        {/* Render the ScheduleComponent as many times as specified */}
                                        <div
                                            className='mt-2 overflow-y-auto max-h-36 border border-base-content border-opacity-20 rounded-lg'
                                            style={{
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: '#a0aec0 #edf2f7',
                                            }} // Optional for styled scrollbars
                                        >
                                            {additionalScheds[grade].map((sched, index) => (
                                                <div
                                                    key={index}
                                                    className='flex flex-wrap border border-base-content border-opacity-20'
                                                >
                                                    <button
                                                        className='w-1/12 rounded-l-lg  flex items-center justify-center hover:text-error hover:bg-base-200'
                                                        onClick={() => handleDeleteAdditionalSchedule(grade, index)}
                                                    >
                                                        <RiDeleteBin7Line size={15} />
                                                    </button>
                                                    <div className='w-10/12'>
                                                        <button
                                                            className='w-full p-2 shadow-sm '
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        `add_additional_sched_modal_1_grade-${grade}_prog-0_idx-${index}`
                                                                    )
                                                                    .showModal()
                                                            }
                                                        >
                                                            {sched.name ? (
                                                                // Content to show when both are not empty
                                                                <>
                                                                    <p>Name: {sched.name}</p>
                                                                    <p>
                                                                        Subject:{' '}
                                                                        {sched.subject === -1
                                                                            ? 'N/A'
                                                                            : subjects[sched.subject].subject}
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                // Content to show when either is empty
                                                                <p>Untitled Schedule {index + 1}</p>
                                                            )}
                                                        </button>
                                                        <AdditionalScheduleForProgram
                                                            viewingMode={1}
                                                            programID={0}
                                                            grade={grade}
                                                            arrayIndex={index}
                                                            additionalSchedsOfProgYear={sched}
                                                        />
                                                    </div>
                                                    <div className='w-1/12 flex items-center  bg-base-100 hover:bg-base-200 justify-center'>
                                                        <button
                                                            className='hover:text-primary'
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        `add_additional_sched_modal_0_grade-${grade}_prog-0_idx-${index}`
                                                                    )
                                                                    .showModal()
                                                            }
                                                        >
                                                            <RiEdit2Fill size={15} />
                                                        </button>
                                                        <AdditionalScheduleForProgram
                                                            viewingMode={0}
                                                            programID={0}
                                                            grade={grade}
                                                            arrayIndex={index}
                                                            numOfSchoolDays={numOfSchoolDays}
                                                            progYearSubjects={selectedSubjects[grade]}
                                                            additionalSchedsOfProgYear={sched}
                                                            setAdditionalScheds={setAdditionalScheds}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {errorMessage && <p className='text-red-500 text-sm my-4 font-medium select-none '>{errorMessage}</p>}

                    {/* Add button centered at the bottom */}
                    <div className='flex mt-6 justify-center gap-2'>
                        <div className='flex justify-end space-x-2'>
                            <button
                                className='btn btn-primary flex items-center'
                                onClick={handleAddEntry}
                                disabled={isAddButtonDisabled}
                            >
                                <div>Add {reduxField[0]}</div>
                            </button>
                        </div>
                        <button className='btn btn-error border-0' onClick={handleReset}>
                            Reset
                        </button>
                    </div>
                </div>
                <div className='modal-action w-full'>
                    <button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2' onClick={handleClose}>
                        ✕
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default AddProgramContainer;
