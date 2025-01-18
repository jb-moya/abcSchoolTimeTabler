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

        setErrorField('');
        setErrorMessage('');
        document.getElementById('add_program_modal').close();
    };

    // ===================================================================================

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    // ==============================================================================

    const [activeTab, setActiveTab] = useState(7);

    const grades = [7, 8, 9, 10];

    return (
        <dialog id='add_program_modal' className='modal'>
            <div className='modal-box' style={{ width: '48%', maxWidth: 'none' }}>
                <div>
                    {/* Header section with centered "Add {reduxField}" */}
                    <div className='flex justify-between mb-4'>
                        <h3 className='text-lg font-bold text-center w-full'>
                            Add New {reduxField[0].charAt(0).toUpperCase() + reduxField[0].slice(1).toLowerCase()}
                        </h3>
                    </div>

                    <hr className='mb-4' />

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
                        {/* Tabs Navigation */}
                        <div className='flex justify-between space-x-2 bg-base-300 p-3 rounded-lg overflow-auto border border-base-content border-opacity-20 shadow-md'>
                            {grades.map((grade) => (
                                <button
                                    key={grade}
                                    onClick={() => setActiveTab(grade)}
                                    className={`px-11 py-2 font-semibold rounded-lg transition ${
                                        activeTab === grade ? 'bg-primary text-white shadow-md' : 'bg-base-100 hover:bg-base-200'
                                    }`}
                                >
                                    Grade {grade}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {grades.map((grade) => (
                            <div key={grade} className={`${activeTab === grade ? 'block' : 'hidden'}`}>
                                <div className='flex flex-col'>
                                    {/* Shift and Start Time Selection */}
                                    <div className='rounded-lg shadow-md border space-y-2 p-4 mb-4'>
                                        <div className='flex items-center'>
                                            <label className='w-1/4 font-semibold text-base text-center'>SHIFT:</label>
                                            <div className='flex space-x-6 text-base'>
                                                {['AM', 'PM'].map((shift, index) => (
                                                    <label key={index} className='flex items-center space-x-2'>
                                                        <input
                                                            type='radio'
                                                            checked={selectedShifts[grade] === index}
                                                            onChange={() => handleShiftSelection(grade, index)}
                                                            className='scale-150'
                                                        />
                                                        <span>{shift}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className='flex items-center'>
                                            <label className='w-1/4 font-semibold text-base text-center'>START TIME:</label>
                                            <div className='flex items-center space-x-4 w-3/4'>
                                                <div className='w-full'>
                                                    <TimeSelector
                                                        time={startTimes[grade]}
                                                        setTime={(newTime) =>
                                                            setStartTimes((prevStartTimes) => ({
                                                                ...prevStartTimes,
                                                                [grade]: newTime,
                                                            }))
                                                        }
                                                        am={selectedShifts[grade] === 0 ? 1 : 0}
                                                        pm={selectedShifts[grade] === 1 ? 1 : 0}
                                                    />
                                                </div>
                                                {!validEndTimes[grade] && (
                                                    <div
                                                        className='tooltip text-red-500 flex items-center'
                                                        data-tip='Total class time exceeds the day.'
                                                    >
                                                        <IoWarningSharp size={24} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subject Selection */}
                                    <div className='rounded-lg shadow-md border space-y-2 p-4 mb-4'>
                                        <div className='font-semibold text-lg text-center'>Subjects</div>
                                        <hr className='my-2'></hr>
                                        <div className='bg-base-100 py-2 rounded-lg space-y-4'>
                                            <div className='bg-base-100 py-2 rounded-lg space-y-4 p-4'>
                                                <div className=''>
                                                    {/* Dropdown and Button */}
                                                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                                                        {/* Searchable Dropdown */}
                                                        <div className='flex-1'>
                                                            <SearchableDropdownToggler
                                                                selectedList={selectedSubjects[grade]}
                                                                setSelectedList={(list) => handleSubjectSelection(grade, list)}
                                                            />
                                                        </div>

                                                        {/* Fixed Schedule Maker Button */}
                                                        <div className='flex justify-center md:justify-start'>
                                                            <div className='flex justify-center'>
                                                                <button
                                                                    className='btn btn-primary'
                                                                    onClick={() =>
                                                                        document
                                                                            .getElementById(
                                                                                `assign_fixed_sched_modal_prog(0)-grade(${grade})-view(0)`
                                                                            )
                                                                            .showModal()
                                                                    }
                                                                    disabled={!selectedSubjects[grade]?.length}
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
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='flex space-x-2'>
                                                    <label className='font-semibold w-1/4'>Selected Subjects:</label>
                                                    {selectedSubjects[grade]?.length === 0 ? (
                                                        <div className='text-gray-500 w-3/4 flex justify-start'>
                                                            No Subjects Selected
                                                        </div>
                                                    ) : (
                                                        selectedSubjects[grade]?.map((id) => (
                                                            <div key={id} className='badge badge-secondary px-4 py-2 truncate'>
                                                                {subjects[id]?.subject || 'Subject not found'}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Schedules */}

                                    <div className='p-4 rounded-lg shadow-md border'>
                                        <div className='text-center font-semibold text-lg'>Additional Schedules</div>
                                        <hr className='my-2'></hr>

                                        {/* Button to add schedules */}
                                        <button
                                            onClick={() =>  handleAddAdditionalSchedule(grade)}
                                            className='flex flex-wrap items-right text-sm mt-2 bg-primary p-4 text-white px-2 py-1 rounded-lg hover:bg-blue-600'
                                        >
                                            Add Schedule
                                        </button>

                                        {/* Render the ScheduleComponent as many times as specified */}
                                        <div
                                            className='mt-2 overflow-y-auto max-h-36 border border-gray-300 rounded-lg'
                                            style={{
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: '#a0aec0 #edf2f7',
                                            }} // Optional for styled scrollbars
                                        >
                                            {additionalScheds[grade].map((sched, index) => (
                                                <div key={index} className='flex flex-wrap'>
                                                    <button
                                                        className='w-1/12 border rounded-l-lg hover:bg-gray-200 flex items-center justify-center'
                                                        onClick={() => handleDeleteAdditionalSchedule(grade, index)}
                                                    >
                                                        <RiDeleteBin7Line size={15} />
                                                    </button>
                                                    <div className='w-10/12'>
                                                        <button
                                                            className='w-full bg-gray-100 p-2 border shadow-sm hover:bg-gray-200'
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
                                                    <div className='w-1/12  flex items-center justify-center border rounded-r-lg hover:bg-gray-200'>
                                                        <button
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
                                                             viewingMode={1}
                                                             programID={0}
                                                             grade={grade}
                                                             arrayIndex={index}
                                                             additionalSchedsOfProgYear={sched}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Shift and Start Time Selection */}
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
