import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    fetchPrograms,
    addProgram,
    editProgram,
    removeProgram,
} from '@features/programSlice';
import { fetchSections, editSection } from '@features/sectionSlice';
import { fetchSubjects } from '@features/subjectSlice';

import debounce from 'debounce';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import SearchableDropdownToggler from './searchableDropdown';
import { getTimeSlotIndex, getTimeSlotString } from './timeSlotMapper';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';
import { toast } from 'sonner';

import FixedScheduleMaker from './FixedSchedules/fixedScheduleMaker';

const AddProgramContainer = ({
    reduxField,
    reduxFunction,
    morningStartTime,
    afternoonStartTime,
}) => {
    const inputNameRef = useRef();
    const subjects = useSelector((state) => state.subject.subjects);
    const programs = useSelector((state) => state.program.programs);
    const dispatch = useDispatch();

    const numOfSchoolDays = parseInt(
        localStorage.getItem('numOfSchoolDays'),
        10
    );

    const [inputValue, setInputValue] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState({
        7: [],
        8: [],
        9: [],
        10: [],
    });
    const [gradeTotalTimeslot, setGradeTotalTimeslot] = useState({
        7: null,
        8: null,
        9: null,
        10: null,
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

    const handleStartTimeChange = (grade, time) => {
        setStartTimes((prevTimes) => ({
            ...prevTimes,
            [grade]: time,
        }));
    };

    const renderTimeOptions = (shift) => {
        const times =
            shift === 0
                ? Array.from({ length: 36 }, (_, i) => {
                      const hours = 6 + Math.floor(i / 6);
                      const minutes = (i % 6) * 10;
                      return `${String(hours).padStart(2, '0')}:${String(
                          minutes
                      ).padStart(2, '0')} AM`;
                  })
                : ['01:00 PM'];

        return times.map((time) => (
            <option key={time} value={time}>
                {time}
            </option>
        ));
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSubjectSelection = (grade, selectedList) => {
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
                    const numClasses = Math.min(
                        Math.ceil(
                            subject.weeklyMinutes / subject.classDuration
                        ),
                        numOfSchoolDays
                    );
                    updatedFixedDays[subjectID] = Array(numClasses).fill(0);
                    updatedFixedPositions[subjectID] =
                        Array(numClasses).fill(0);
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
                if (
                    subjPositions[i] > selectedList.length ||
                    subjDays[i] > numOfSchoolDays
                ) {
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

    const handleAddEntry = () => {
        if (!inputValue.trim()) {
            alert('Program name cannot be empty');
            return;
        } else if (selectedSubjects[7].length === 0) {
            alert('Select at least one subject for grade 7');
            return;
        } else if (selectedShifts[7] === undefined || !startTimes[7]) {
            alert('Select shift and start time for grade 7');
            return;
        } else if (selectedSubjects[8].length === 0) {
            alert('Select at least one subject for grade 8');
            return;
        } else if (selectedShifts[8] === undefined || !startTimes[8]) {
            alert('Select shift and start time for grade 8');
            return;
        } else if (selectedSubjects[9].length === 0) {
            alert('Select at least one subject for grade 9');
            return;
        } else if (selectedShifts[9] === undefined || !startTimes[9]) {
            alert('Select shift and start time for grade 9');
            return;
        } else if (selectedSubjects[10].length === 0) {
            alert('Select at least one subject for grade 10');
            return;
        } else if (selectedShifts[10] === undefined || !startTimes[10]) {
            alert('Select shift and start time for grade 10');
            return;
        }

        const duplicateProgram = Object.values(programs).find(
            (program) =>
                program.program.trim().toLowerCase() ===
                inputValue.trim().toLowerCase()
        );

        if (duplicateProgram) {
            alert('A program with this name already exists.');
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
                    },
                    8: {
                        subjects: selectedSubjects[8],
                        fixedDays: fixedDays[8],
                        fixedPositions: fixedPositions[8],
                        shift: selectedShifts[8],
                        startTime: getTimeSlotIndex(startTimes[8]),
                    },
                    9: {
                        subjects: selectedSubjects[9],
                        fixedDays: fixedDays[9],
                        fixedPositions: fixedPositions[9],
                        shift: selectedShifts[9],
                        startTime: getTimeSlotIndex(startTimes[9]),
                    },
                    10: {
                        subjects: selectedSubjects[10],
                        fixedDays: fixedDays[10],
                        fixedPositions: fixedPositions[10],
                        shift: selectedShifts[10],
                        startTime: getTimeSlotIndex(startTimes[10]),
                    },
                })
            );
            // Set success message and show the modal
            //  setModalMessage('Program added successfully!');
            //  setShowSuccessModal(true);
            // close();
        }
    };

    const handleReset = () => {
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

    useEffect(() => {
        [7, 8, 9, 10].forEach((grade) => {
            let totalNumOfClasses = 0;

            selectedSubjects[grade].forEach((subject) => {
                // console.log('updating timeslot checekr');
                totalNumOfClasses += Math.ceil(
                    subjects[subject].weeklyMinutes /
                        subjects[subject].classDuration
                );
            });

            let totalTimeslot = Math.ceil(totalNumOfClasses / numOfSchoolDays);

            setGradeTotalTimeslot((prevState) => ({
                ...prevState,
                [grade]: totalTimeslot,
            }));
        });
    }, [selectedSubjects, subjects, numOfSchoolDays]);

    useEffect(() => {
        // console.log(gradeTotalTimeslot);
    }, [gradeTotalTimeslot]);

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    return (
        <dialog
            id="add_program_modal"
            className="modal modal-bottom sm:modal-middle"
        >
            <div
                className="modal-box"
                style={{ width: '50%', maxWidth: 'none' }}
            >
                <div className="p-6">
                    {/* Header section with centered "Add {reduxField}" */}
                    <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-bold text-center w-full">
                            Add New{' '}
                            {reduxField[0].charAt(0).toUpperCase() +
                                reduxField[0].slice(1).toLowerCase()}
                        </h3>
                    </div>

                    {/* Input field for program name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Program Name:
                        </label>
                        <input
                            type="text"
                            ref={inputNameRef}
                            className="input input-bordered w-full"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Enter Program name"
                        />
                    </div>

                    {/* Subject, shift, and fixed schedules management */}
                    <div className="text-sm flex flex-col space-y-4">
                        {[7, 8, 9, 10].map((grade) => (
                            <div
                                key={grade}
                                className="bg-white shadow-md rounded-lg p-4"
                            >
                                <h3 className="font-bold mb-2">{`Grade ${grade}`}</h3>

                                {/* Shift selection */}
                                <div className="mt-2 mb-2">
                                    <label className="mr-2">Shift:</label>
                                    <label className="mr-2">
                                        <input
                                            type="radio"
                                            value={selectedShifts[grade]}
                                            checked={
                                                selectedShifts[grade] === 0
                                            }
                                            onChange={() =>
                                                handleShiftSelection(grade, 0)
                                            }
                                        />
                                        AM
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            value={selectedShifts[grade]}
                                            checked={
                                                selectedShifts[grade] === 1
                                            }
                                            onChange={() =>
                                                handleShiftSelection(grade, 1)
                                            }
                                        />
                                        PM
                                    </label>
                                </div>

                                {/* Start time selection */}
                                <div className="mt-2">
                                    <label className="mr-2">Start Time:</label>
                                    <select
                                        className="input input-bordered"
                                        value={startTimes[grade]}
                                        onChange={(e) =>
                                            handleStartTimeChange(
                                                grade,
                                                e.target.value
                                            )
                                        }
                                    >
                                        {renderTimeOptions(
                                            selectedShifts[grade]
                                        )}
                                    </select>
                                </div>

                                {/* Subject selection */}
                                <div className="flex items-center mb-2 py-4 flex-wrap">
                                    <div className="m-1">
                                        <SearchableDropdownToggler
                                            selectedList={
                                                selectedSubjects[grade]
                                            }
                                            setSelectedList={(list) =>
                                                handleSubjectSelection(
                                                    grade,
                                                    list
                                                )
                                            }
                                        />
                                    </div>
                                    {selectedSubjects[grade]?.map(
                                        (id, index) => (
                                            <div key={id} className="p-2">
                                                <div className="h-10 w-20 bg-green-400 rounded-md flex items-center justify-center truncate">
                                                    {subjects[id]?.subject}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Setting of fixed schedule (optional) */}
                                {selectedSubjects[grade]?.length > 0 && (
                                    <div>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() =>
                                                document
                                                    .getElementById(
                                                        `assign_fixed_sched_modal_prog(0)-grade(${grade})`
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
                                            totalTimeslot={
                                                gradeTotalTimeslot[grade]
                                            }
                                            selectedSubjects={
                                                selectedSubjects[grade]
                                            }
                                            fixedDays={fixedDays[grade]}
                                            setFixedDays={setFixedDays}
                                            fixedPositions={
                                                fixedPositions[grade]
                                            }
                                            setFixedPositions={
                                                setFixedPositions
                                            }
                                            numOfSchoolDays={numOfSchoolDays}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add button centered at the bottom */}
                    <div className="flex mt-6 justify-center gap-2">
                        <button
                            className="btn btn-secondary"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="btn btn-primary flex items-center"
                                onClick={handleAddEntry}
                            >
                                <div>Add {reduxField[0]}</div>
                                <IoAdd size={20} className="ml-2" />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="modal-action w-full">
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

const ProgramListContainer = ({ editable = false }) => {
    const dispatch = useDispatch();

    const { programs, status: programStatus } = useSelector(
        (state) => state.program
    );

    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );

    const { sections, status: sectionStatus } = useSelector(
        (state) => state.section
    );

    // console.log('programs ', programs);
    // console.log('subjects ', subjects);
    // console.log('sections', sections);

    const numOfSchoolDays = parseInt(
        localStorage.getItem('numOfSchoolDays'),
        10
    );
    const morningStartTime =
        localStorage.getItem('morningStartTime') || '06:00 AM';
    const afternoonStartTime =
        localStorage.getItem('afternoonStartTime') || '01:00 PM';

    const [editProgramId, setEditProgramId] = useState(null);
    const [editProgramValue, setEditProgramValue] = useState('');
    const [editProgramCurr, setEditProgramCurr] = useState([]);
    const [searchProgramResult, setSearchProgramResult] = useState(programs);
    const [searchProgramValue, setSearchProgramValue] = useState('');

    const [selectedShifts, setSelectedShifts] = useState({
        7: 0,
        8: 0,
        9: 0,
        10: 0,
    });
    const [startTimes, setStartTimes] = useState({
        7: '06:00 AM',
        8: '06:00 AM',
        9: '06:00 AM',
        10: '06:00 AM',
    });

    const [editFixedDays, setEditFixedDays] = useState({
        7: {},
        8: {},
        9: {},
        10: {},
    });
    const [editFixedPositions, setEditFixedPositions] = useState({
        7: {},
        8: {},
        9: {},
        10: {},
    });

    useEffect(() => {
        // console.log('OMG          G editProgramCurr ', editProgramCurr);
    }, [editProgramCurr]);

    useEffect(() => {
        // console.log('OMG          G programs ', programs);
    }, [programStatus, subjectStatus, programs]);

    const renderTimeOptions = (shift) => {
        const times =
            shift === 0
                ? Array.from({ length: 36 }, (_, i) => {
                      const hours = 6 + Math.floor(i / 6);
                      const minutes = (i % 6) * 10;
                      return `${String(hours).padStart(2, '0')}:${String(
                          minutes
                      ).padStart(2, '0')} AM`;
                  })
                : ['01:00 PM'];

        return times.map((time) => (
            <option key={time} value={time}>
                {time}
            </option>
        ));
    };

    const handleSubjectSelection = (grade, selectedList) => {
        const validCombinations = [];

        setEditProgramCurr((prevState) => ({
            ...prevState,
            [grade]: selectedList,
        }));

        const updatedFixedDays = structuredClone(editFixedDays[grade]);
        const updatedFixedPositions = structuredClone(
            editFixedPositions[grade]
        );

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
                    const numClasses = Math.min(
                        Math.ceil(
                            subject.weeklyMinutes / subject.classDuration
                        ),
                        numOfSchoolDays
                    );
                    updatedFixedDays[subjectID] = Array(numClasses).fill(0);
                    updatedFixedPositions[subjectID] =
                        Array(numClasses).fill(0);
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
            const subjDays = structuredClone(updatedFixedDays[subID]);
            const subjPositions = structuredClone(updatedFixedPositions[subID]);

            for (let i = 0; i < subjDays.length; i++) {
                if (
                    subjPositions[i] > selectedList.length ||
                    subjDays[i] > numOfSchoolDays
                ) {
                    subjDays[i] = 0;
                    subjPositions[i] = 0;
                }
            }

            updatedFixedDays[subID] = subjDays;
            updatedFixedPositions[subID] = subjPositions;
        });

        setEditFixedDays((prevState) => ({
            ...prevState,
            [grade]: updatedFixedDays, // Update only the specified grade
        }));

        setEditFixedPositions((prevState) => ({
            ...prevState,
            [grade]: updatedFixedPositions, // Update only the specified grade
        }));
    };

    const handleShiftSelection = (grade, shift) => {
        setSelectedShifts((prevState) => ({
            ...prevState,
            [grade]: shift,
        }));

        const defaultTime = shift === 0 ? morningStartTime : afternoonStartTime;
        setStartTimes((prevState) => ({
            ...prevState,
            [grade]: defaultTime,
        }));
    };

    const handleEditProgramClick = (program) => {
        setEditProgramId(program.id);
        setEditProgramValue(program.program);
        setEditProgramCurr({
            7: program[7]?.subjects || [],
            8: program[8]?.subjects || [],
            9: program[9]?.subjects || [],
            10: program[10]?.subjects || [],
        });
        setStartTimes({
            7: getTimeSlotString(program[7]?.startTime || 0),
            8: getTimeSlotString(program[8]?.startTime || 0),
            9: getTimeSlotString(program[9]?.startTime || 0),
            10: getTimeSlotString(program[10]?.startTime || 0),
        });
        setSelectedShifts({
            7: program[7]?.shift || 0,
            8: program[8]?.shift || 0,
            9: program[9]?.shift || 0,
            10: program[10]?.shift || 0,
        });
        setEditFixedDays({
            7: program[7]?.fixedDays || {},
            8: program[8]?.fixedDays || {},
            9: program[9]?.fixedDays || {},
            10: program[10]?.fixedDays || {},
        });
        setEditFixedPositions({
            7: program[7]?.fixedPositions || {},
            8: program[8]?.fixedPositions || {},
            9: program[9]?.fixedPositions || {},
            10: program[10]?.fixedPositions || {},
        });
    };

    const handleSaveProgramEditClick = (programId) => {
        if (!editProgramValue.trim()) {
            alert('Program name cannot be empty');
            return;
        } else if (editProgramCurr[7].length === 0) {
            alert('Select at least one subject for grade 7');
            return;
        } else if (selectedShifts[7] === undefined || !startTimes[7]) {
            alert('Select shift and start time for grade 7');
            return;
        } else if (editProgramCurr[8].length === 0) {
            alert('Select at least one subject for grade 8');
            return;
        } else if (selectedShifts[8] === undefined || !startTimes[8]) {
            alert('Select shift and start time for grade 8');
            return;
        } else if (editProgramCurr[9].length === 0) {
            alert('Select at least one subject for grade 9');
            return;
        } else if (selectedShifts[9] === undefined || !startTimes[9]) {
            alert('Select shift and start time for grade 9');
            return;
        } else if (editProgramCurr[10].length === 0) {
            alert('Select at least one subject for grade 10');
            return;
        } else if (selectedShifts[10] === undefined || !startTimes[10]) {
            alert('Select shift and start time for grade 10');
            return;
        }

        const currentProgram = programs[programId]?.program || '';

        if (
            editProgramValue.trim().toLowerCase() ===
            currentProgram.trim().toLowerCase()
        ) {
            dispatch(
                editProgram({
                    programId,
                    updatedProgram: {
                        program: editProgramValue,
                        7: {
                            subjects: editProgramCurr[7],
                            fixedDays: editFixedDays[7],
                            fixedPositions: editFixedPositions[7],
                            shift: selectedShifts[7],
                            startTime: getTimeSlotIndex(
                                startTimes[7] || '06:00 AM'
                            ),
                        },
                        8: {
                            subjects: editProgramCurr[8],
                            fixedDays: editFixedDays[8],
                            fixedPositions: editFixedPositions[8],
                            shift: selectedShifts[8],
                            startTime: getTimeSlotIndex(
                                startTimes[8] || '06:00 AM'
                            ),
                        },
                        9: {
                            subjects: editProgramCurr[9],
                            fixedDays: editFixedDays[9],
                            fixedPositions: editFixedPositions[9],
                            shift: selectedShifts[9],
                            startTime: getTimeSlotIndex(
                                startTimes[9] || '06:00 AM'
                            ),
                        },
                        10: {
                            subjects: editProgramCurr[10],
                            fixedDays: editFixedDays[10],
                            fixedPositions: editFixedPositions[10],
                            shift: selectedShifts[10],
                            startTime: getTimeSlotIndex(
                                startTimes[10] || '06:00 AM'
                            ),
                        },
                    },
                })
            );

            updateProgramDependencies();

            toast.success('Data and dependencies updated successfully!', {
                style: {
                    backgroundColor: '#28a745',
                    color: '#fff',
                    borderColor: '#28a745',
                },
            });

            setEditProgramId(null);
            setEditProgramValue('');
            setEditProgramCurr([]);
            setStartTimes({
                7: '06:00 AM',
                8: '06:00 AM',
                9: '06:00 AM',
                10: '06:00 AM',
            });
            setSelectedShifts({
                7: 0,
                8: 0,
                9: 0,
                10: 0,
            });
            setEditFixedDays({
                7: {},
                8: {},
                9: {},
                10: {},
            });
            setEditFixedPositions({
                7: {},
                8: {},
                9: {},
                10: {},
            });
        } else {
            const duplicateProgram = Object.values(programs).find(
                (program) =>
                    program.program.trim().toLowerCase() ===
                    editProgramValue.trim().toLowerCase()
            );

            if (duplicateProgram) {
                alert('A program with this name already exists!');
            } else if (editProgramValue.trim()) {
                dispatch(
                    editProgram({
                        programId,
                        updatedProgram: {
                            program: editProgramValue,
                            7: {
                                subjects: editProgramCurr[7],
                                fixedDays: editFixedDays[7],
                                fixedPositions: editFixedPositions[7],
                                shift: selectedShifts[7],
                                startTime: getTimeSlotIndex(
                                    startTimes[7] || '06:00 AM'
                                ),
                            },
                            8: {
                                subjects: editProgramCurr[8],
                                fixedDays: editFixedDays[8],
                                fixedPositions: editFixedPositions[8],
                                shift: selectedShifts[8],
                                startTime: getTimeSlotIndex(
                                    startTimes[8] || '06:00 AM'
                                ),
                            },
                            9: {
                                subjects: editProgramCurr[9],
                                fixedDays: editFixedDays[9],
                                fixedPositions: editFixedPositions[9],
                                shift: selectedShifts[9],
                                startTime: getTimeSlotIndex(
                                    startTimes[9] || '06:00 AM'
                                ),
                            },
                            10: {
                                subjects: editProgramCurr[10],
                                fixedDays: editFixedDays[10],
                                fixedPositions: editFixedPositions[10],
                                shift: selectedShifts[10],
                                startTime: getTimeSlotIndex(
                                    startTimes[10] || '06:00 AM'
                                ),
                            },
                        },
                    })
                );

                updateProgramDependencies();

                toast.success('Data and dependencies updated successfully!', {
                    style: {
                        backgroundColor: '#28a745',
                        color: '#fff',
                        borderColor: '#28a745',
                    },
                });

                setEditProgramId(null);
                setEditProgramValue('');
                setEditProgramCurr([]);
                setStartTimes({
                    7: '06:00 AM',
                    8: '06:00 AM',
                    9: '06:00 AM',
                    10: '06:00 AM',
                });
                setSelectedShifts({
                    7: 0,
                    8: 0,
                    9: 0,
                    10: 0,
                });
                setEditFixedDays({
                    7: {},
                    8: {},
                    9: {},
                    10: {},
                });
                setEditFixedPositions({
                    7: {},
                    8: {},
                    9: {},
                    10: {},
                });
            }
        }
    };

    const handleCancelProgramEditClick = () => {
        setEditProgramId(null);
        setEditProgramValue('');
        setEditProgramCurr([]);
        setStartTimes({
            7: '06:00 AM',
            8: '06:00 AM',
            9: '06:00 AM',
            10: '06:00 AM',
        });
        setSelectedShifts({
            7: 0,
            8: 0,
            9: 0,
            10: 0,
        });
        setEditFixedDays({
            7: {},
            8: {},
            9: {},
            10: {},
        });
        setEditFixedPositions({
            7: {},
            8: {},
            9: {},
            10: {},
        });
    };

    const updateProgramDependencies = () => {
        // Update program dependencies in SECTIONS
        Object.entries(sections).forEach(([id, section]) => {
            const originalSection = JSON.parse(JSON.stringify(section));
            const newSection = JSON.parse(JSON.stringify(section));

            // Early return if section is not part of the edited program
            if (newSection.program !== editProgramId) return;

            // Use set to quickly look up subjects from the edited program-year and the current section
            const newSubs = new Set(editProgramCurr[newSection.year]);
            const originalSubs = new Set(newSection.subjects);

            // Early return if there are no changes
            if (
                newSubs.size === originalSubs.size &&
                [...newSubs].every((subjectId) => originalSubs.has(subjectId))
            )
                return;

            // Add subjects from the edited program-year to the current section
            editProgramCurr[newSection.year].forEach((subjectId) => {
                if (!originalSubs.has(subjectId)) {
                    newSection.subjects.push(subjectId);
                    originalSubs.add(subjectId);
                }
            });

            // Remove subjects from the current section that are not in the edited program-year
            newSection.subjects = newSection.subjects.filter((subjectId) =>
                newSubs.has(subjectId)
            );

            // Update the section in the sections object
            const newSubjsSet = new Set(newSection.subjects);

            // Remove the fixed schedules from the current section that are not in the edited program-year
            Object.keys(newSection.fixedDays).forEach((subjectId) => {
                if (!newSubjsSet.has(subjectId)) {
                    delete newSection.fixedDays[subjectId];
                    delete newSection.fixedPositions[subjectId];
                }
            });

            // Retrieve all occupied days and positions of the current section
            const dayPositionMap = new Map();
            Object.keys(newSection.fixedDays).forEach((subjectId) => {
                newSection.fixedDays[subjectId].forEach((day, index) => {
                    const pos = newSection.fixedPositions[subjectId][index];
                    if (
                        day !== 0 &&
                        pos !== 0 &&
                        !dayPositionMap.has(`${day}-${pos}`)
                    ) {
                        dayPositionMap.set(`${day}-${pos}`, true);
                    }
                });
            });

            // Add fixed schedules from the edited program-year to the current section
            newSection.subjects.forEach((subjectId) => {
                if (!(subjectId in newSection.fixedDays)) {
                    let newSubjDays = [];
                    let newSubjPositions = [];

                    for (
                        let i = 0;
                        i < editFixedDays[newSection.year][subjectId].length;
                        i++
                    ) {
                        const day =
                            editFixedDays[newSection.year][subjectId][i];
                        const position =
                            editFixedPositions[newSection.year][subjectId][i];

                        // Check if the day-position combination is already occupied
                        if (
                            day !== 0 &&
                            position !== 0 &&
                            !dayPositionMap.has(`${day}-${position}`)
                        ) {
                            newSubjDays.push(day);
                            newSubjPositions.push(position);
                            dayPositionMap.set(`${day}-${position}`, true);
                        } else if (Number(day) + Number(position) === 1) {
                            newSubjDays.push(day);
                            newSubjPositions.push(position);
                        } else {
                            newSubjDays.push(0);
                            newSubjPositions.push(0);
                        }
                    }

                    newSection.fixedDays[subjectId] = newSubjDays;
                    newSection.fixedPositions[subjectId] = newSubjPositions;
                }
            });

            if (originalSection !== newSection) {
                dispatch(
                    editSection({
                        sectionId: newSection.id,
                        updatedSection: {
                            id: newSection.id,
                            teacher: newSection.teacher,
                            program: newSection.program,
                            section: newSection.section,
                            subjects: newSection.subjects,
                            fixedDays: newSection.fixedDays,
                            fixedPositions: newSection.fixedPositions,
                            year: newSection.year,
                            shift: newSection.shift,
                            startTime: getTimeSlotIndex(
                                newSection.startTime || '06:00 AM'
                            ),
                        },
                    })
                );
            }
        });
    };

    const debouncedSearch = useCallback(
        debounce((searchValue, programs, subjects) => {
            setSearchProgramResult(
                filterObject(programs, ([, program]) => {
                    if (!searchValue) return true;

                    const programsSubjectsName = Object.values(program)
                        .filter((gradeData) =>
                            Array.isArray(gradeData.subjects)
                        ) // Ensure we're working with subjects array for each grade
                        .flatMap((gradeData) =>
                            gradeData.subjects.map(
                                (subjectID) =>
                                    subjects[subjectID]?.subject || ''
                            )
                        )
                        .join(' ');

                    const escapedSearchValue = escapeRegExp(searchValue)
                        .split('\\*')
                        .join('.*');

                    const pattern = new RegExp(escapedSearchValue, 'i');

                    return (
                        pattern.test(program.program) ||
                        pattern.test(programsSubjectsName)
                    );
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        // console.log('editFixedDays', editFixedDays);
        // console.log('editFixedPositions', editFixedPositions);
    }, [editFixedDays, editFixedPositions]);

    useEffect(() => {
        debouncedSearch(searchProgramValue, programs, subjects);
    }, [searchProgramValue, programs, debouncedSearch, subjects]);

    useEffect(() => {
        if (sectionStatus === 'idle') {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

    useEffect(() => {
        if (programStatus === 'idle') {
            dispatch(fetchPrograms());
        }
    }, [programStatus, dispatch]);

    useEffect(() => {
        if (subjectStatus === 'idle') {
            dispatch(fetchSubjects());
        }
    }, [subjectStatus, dispatch]);

    const itemsPerPage = 3; // Change this to adjust the number of items per page
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages
    const totalPages = Math.ceil(
        Object.values(searchProgramResult).length / itemsPerPage
    );

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchProgramResult).slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const [gradeTotalTimeslot, setGradeTotalTimeslot] = useState({});

    useEffect(() => {
        if (programStatus !== 'succeeded' || subjectStatus !== 'succeeded') {
            console.log(
                'Programs or Subjects not loaded yet. Skipping gradeTotalTimeslot calculation.'
            );
            return;
        } else {
            console.log(
                'Programs and Subjects loaded. Calculating gradeTotalTimeslot.'
            );
        }

        const newGradeTotalTimeslot = {};
        // console.log('programssssssssss', programs);

        if (Object.keys(programs).length === 0) {
            console.log('No data to process');
            return;
        }

        Object.entries(programs).forEach(([programID, program]) => {
            // console.log('>', programID, 'program', program);

            if (!newGradeTotalTimeslot[programID]) {
                newGradeTotalTimeslot[programID] = {};
            }

            [7, 8, 9, 10].forEach((grade) => {
                let gradeInfo = program[grade];

                let totalNumOfClasses = 0;

                // console.log('grade', gradeInfo);
                // console.log('gradeInfo.subjects', gradeInfo.subjects);

                gradeInfo.subjects.forEach((subject) => {
                    totalNumOfClasses += Math.ceil(
                        subjects[subject].weeklyMinutes /
                            subjects[subject].classDuration
                    );
                });

                let totalTimeslot = Math.ceil(
                    totalNumOfClasses / numOfSchoolDays
                );

                newGradeTotalTimeslot[programID][grade] = totalTimeslot;
            });
        });

        // console.log('newGradeTotalTimeslot', newGradeTotalTimeslot);

        setGradeTotalTimeslot(newGradeTotalTimeslot);
    }, [subjects, numOfSchoolDays, programs, programStatus, subjectStatus]);

    useEffect(() => {
        // console.log(
        //     'BAT DI KA NAG U U P D A T E  G gradeTotalTimeslot ',
        //     gradeTotalTimeslot
        // );
    }, [gradeTotalTimeslot]);

    return (
        <React.Fragment>
            <div className="">
                <div className="flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5">
                    {/* Pagination */}
                    {currentItems.length > 0 && (
                        <div className="join flex justify-center mb-4 md:mb-0">
                            <button
                                className={`join-item btn ${
                                    currentPage === 1 ? 'btn-disabled' : ''
                                }`}
                                onClick={() => {
                                    if (currentPage > 1) {
                                        setCurrentPage(currentPage - 1);
                                    }
                                    handleCancelProgramEditClick();
                                }}
                                disabled={currentPage === 1}
                            >
                                «
                            </button>
                            <button className="join-item btn">
                                Page {currentPage} of {totalPages}
                            </button>
                            <button
                                className={`join-item btn ${
                                    currentPage === totalPages
                                        ? 'btn-disabled'
                                        : ''
                                }`}
                                onClick={() => {
                                    if (currentPage < totalPages) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                    handleCancelProgramEditClick();
                                }}
                                disabled={currentPage === totalPages}
                            >
                                »
                            </button>
                        </div>
                    )}

                    {currentItems.length === 0 && currentPage > 1 && (
                        <div className="hidden">
                            {setCurrentPage(currentPage - 1)}
                        </div>
                    )}

                    {/* Search Program */}
                    <div className="flex-grow w-full md:w-1/3 lg:w-1/4">
                        <label className="input input-bordered flex items-center gap-2 w-full">
                            <input
                                type="text"
                                className="grow p-3 text-sm w-full"
                                placeholder="Search Program"
                                value={searchProgramValue}
                                onChange={(e) =>
                                    setSearchProgramValue(e.target.value)
                                }
                            />
                            <IoSearch className="text-xl" />
                        </label>
                    </div>

                    {editable && (
                        <div className="w-full mt-4 md:mt-0 md:w-auto">
                            <button
                                className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
                                onClick={() =>
                                    document
                                        .getElementById('add_program_modal')
                                        .showModal()
                                }
                            >
                                Add Program <IoAdd size={20} className="ml-2" />
                            </button>
                            <AddProgramContainer
                                reduxField={['program', 'subjects']}
                                reduxFunction={addProgram}
                                morningStartTime={morningStartTime}
                                afternoonStartTime={afternoonStartTime}
                            />
                        </div>
                    )}
                </div>

                {/* Responsive Table */}
                <div className="overflow-x-auto">
                    <table className="table table-sm table-zebra w-full">
                        <thead>
                            <tr>
                                <th className="w-auto">#</th>
                                <th className="w-auto">Program ID</th>
                                <th className="w-auto">Program</th>
                                <th>
                                    Shift, Start Time, and Subjects (per year
                                    level)
                                </th>
                                {editable && (
                                    <th className="w-auto">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(searchProgramResult).length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        No Programs Found
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map(([, program], index) => (
                                    <tr
                                        key={program.id}
                                        className="group hover"
                                    >
                                        <td>{index + 1 + indexOfFirstItem}</td>
                                        <td>{program.id}</td>
                                        <td className="max-w-28">
                                            {editProgramId === program.id ? (
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm w-full"
                                                    value={editProgramValue}
                                                    onChange={(e) =>
                                                        setEditProgramValue(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            ) : (
                                                program.program
                                            )}
                                        </td>
                                        <td className="">
                                            {' '}
                                            {/* This can remain as is for additional styling */}
                                            {editProgramId === program.id ? (
                                                <div>
                                                    {[7, 8, 9, 10].map(
                                                        (grade) => (
                                                            <div
                                                                key={grade}
                                                                className="my-2"
                                                            >
                                                                <div className="flex flex-wrap">
                                                                    <div className="w-1/2">
                                                                        <h3 className="font-bold">{`Grade ${grade}`}</h3>
                                                                        <div className="mt-2">
                                                                            <label className="mr-2">
                                                                                Shift:
                                                                            </label>
                                                                            <label className="mr-2">
                                                                                <input
                                                                                    type="radio"
                                                                                    value={
                                                                                        selectedShifts[
                                                                                            grade
                                                                                        ]
                                                                                    }
                                                                                    checked={
                                                                                        selectedShifts[
                                                                                            grade
                                                                                        ] ===
                                                                                        0
                                                                                    }
                                                                                    onChange={() =>
                                                                                        handleShiftSelection(
                                                                                            grade,
                                                                                            0
                                                                                        )
                                                                                    }
                                                                                />
                                                                                AM
                                                                            </label>
                                                                            <label>
                                                                                <input
                                                                                    type="radio"
                                                                                    value={
                                                                                        selectedShifts[
                                                                                            grade
                                                                                        ]
                                                                                    }
                                                                                    checked={
                                                                                        selectedShifts[
                                                                                            grade
                                                                                        ] ===
                                                                                        1
                                                                                    }
                                                                                    onChange={() =>
                                                                                        handleShiftSelection(
                                                                                            grade,
                                                                                            1
                                                                                        )
                                                                                    }
                                                                                />
                                                                                PM
                                                                            </label>
                                                                        </div>
                                                                        <div>
                                                                            <label>
                                                                                Start
                                                                                Time:
                                                                            </label>
                                                                            <select
                                                                                value={
                                                                                    startTimes[
                                                                                        grade
                                                                                    ]
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) => {
                                                                                    const newValue =
                                                                                        e
                                                                                            .target
                                                                                            .value;
                                                                                    setStartTimes(
                                                                                        (
                                                                                            prevState
                                                                                        ) => ({
                                                                                            ...prevState,
                                                                                            [grade]:
                                                                                                newValue,
                                                                                        })
                                                                                    );
                                                                                }}
                                                                            >
                                                                                {renderTimeOptions(
                                                                                    selectedShifts[
                                                                                        grade
                                                                                    ]
                                                                                )}
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap w-1/2">
                                                                        <div className="w-full">
                                                                            <SearchableDropdownToggler
                                                                                selectedList={
                                                                                    editProgramCurr[
                                                                                        grade
                                                                                    ]
                                                                                }
                                                                                setSelectedList={(
                                                                                    list
                                                                                ) =>
                                                                                    handleSubjectSelection(
                                                                                        grade,
                                                                                        list
                                                                                    )
                                                                                }
                                                                            />

                                                                            <div className="flex flex-wrap gap-2 p-2 w-full">
                                                                                {editProgramCurr[
                                                                                    grade
                                                                                ]?.map(
                                                                                    (
                                                                                        id,
                                                                                        index
                                                                                    ) => (
                                                                                        <div
                                                                                            key={
                                                                                                id
                                                                                            }
                                                                                            className="h-8 w-10 bg-green-400 rounded-md text-xs flex items-center justify-center truncate"
                                                                                        >
                                                                                            {
                                                                                                subjects[
                                                                                                    id
                                                                                                ]
                                                                                                    ?.subject
                                                                                            }
                                                                                        </div>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-center items-center">
                                                                    <button
                                                                        className="btn text-xs"
                                                                        onClick={() =>
                                                                            document
                                                                                .getElementById(
                                                                                    `assign_fixed_sched_modal_prog(${editProgramId})-grade(${grade})`
                                                                                )
                                                                                .showModal()
                                                                        }
                                                                    >
                                                                        Open
                                                                        Fixed
                                                                        Schedule
                                                                        Maker
                                                                        for
                                                                        Grade{' '}
                                                                        {grade}
                                                                    </button>

                                                                    {gradeTotalTimeslot[
                                                                        program
                                                                            .id
                                                                    ] && (
                                                                        <FixedScheduleMaker
                                                                            key={
                                                                                grade
                                                                            }
                                                                            viewingMode={
                                                                                0
                                                                            }
                                                                            pvs={
                                                                                0
                                                                            }
                                                                            program={
                                                                                editProgramId
                                                                            }
                                                                            grade={
                                                                                grade
                                                                            }
                                                                            selectedSubjects={
                                                                                editProgramCurr[
                                                                                    grade
                                                                                ]
                                                                            }
                                                                            totalTimeslot={
                                                                                gradeTotalTimeslot[
                                                                                    editProgramId
                                                                                ][
                                                                                    grade
                                                                                ]
                                                                            }
                                                                            fixedDays={
                                                                                editFixedDays[
                                                                                    grade
                                                                                ]
                                                                            }
                                                                            setFixedDays={
                                                                                setEditFixedDays
                                                                            }
                                                                            fixedPositions={
                                                                                editFixedPositions[
                                                                                    grade
                                                                                ]
                                                                            }
                                                                            setFixedPositions={
                                                                                setEditFixedPositions
                                                                            }
                                                                            numOfSchoolDays={
                                                                                numOfSchoolDays
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="">
                                                    {[7, 8, 9, 10].map(
                                                        (grade) => (
                                                            <div
                                                                key={grade}
                                                                className="my-4 flex flex-wrap"
                                                            >
                                                                <div className="w-1/3">
                                                                    <h3 className="font-bold">{`Grade ${grade}`}</h3>
                                                                    <div className="flex items-center mt-2">
                                                                        <span className="inline-block bg-blue-500 text-white text-xs font-semibold py-1 px-3 rounded-lg">
                                                                            {program[
                                                                                `${grade}`
                                                                            ]
                                                                                ?.shift ===
                                                                            0
                                                                                ? 'AM'
                                                                                : 'PM'}
                                                                        </span>
                                                                        <span className="ml-2 text-sm font-medium">
                                                                            {getTimeSlotString(
                                                                                program[
                                                                                    `${grade}`
                                                                                ]
                                                                                    ?.startTime ||
                                                                                    0
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="w-2/3 flex flex-wrap">
                                                                    <div className="w-full">
                                                                        Assigned
                                                                        Subjects
                                                                        for
                                                                        Grade{' '}
                                                                        {grade}:
                                                                    </div>
                                                                    <div className="w-full flex flex-wrap gap-1 p-1">
                                                                        {program[
                                                                            `${grade}`
                                                                        ]?.subjects?.map(
                                                                            (
                                                                                id
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        id
                                                                                    }
                                                                                    className="h-8 w-10 bg-green-400 rounded-md text-xs flex items-center justify-center truncate"
                                                                                >
                                                                                    {
                                                                                        subjects[
                                                                                            id
                                                                                        ]
                                                                                            ?.subject
                                                                                    }
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <button
                                                                            className="btn text-xs"
                                                                            onClick={() =>
                                                                                document
                                                                                    .getElementById(
                                                                                        `assign_fixed_sched_modal_prog(${program.id})-grade(${grade})`
                                                                                    )
                                                                                    .showModal()
                                                                            }
                                                                        >
                                                                            View
                                                                            Fixed
                                                                            Schedules
                                                                            for
                                                                            Grade{' '}
                                                                            {
                                                                                grade
                                                                            }
                                                                        </button>

                                                                        {gradeTotalTimeslot[
                                                                            program
                                                                                .id
                                                                        ] && (
                                                                            <FixedScheduleMaker
                                                                                key={
                                                                                    grade
                                                                                }
                                                                                viewingMode={
                                                                                    1
                                                                                }
                                                                                pvs={
                                                                                    0
                                                                                }
                                                                                program={
                                                                                    program.id
                                                                                }
                                                                                grade={
                                                                                    grade
                                                                                }
                                                                                totalTimeslot={
                                                                                    gradeTotalTimeslot[
                                                                                        program
                                                                                            .id
                                                                                    ][
                                                                                        grade
                                                                                    ]
                                                                                }
                                                                                selectedSubjects={
                                                                                    program[
                                                                                        grade
                                                                                    ]
                                                                                        ?.subjects ||
                                                                                    []
                                                                                }
                                                                                fixedDays={
                                                                                    program[
                                                                                        grade
                                                                                    ]
                                                                                        ?.fixedDays ||
                                                                                    {}
                                                                                }
                                                                                fixedPositions={
                                                                                    program[
                                                                                        grade
                                                                                    ]
                                                                                        ?.fixedPositions ||
                                                                                    {}
                                                                                }
                                                                                numOfSchoolDays={
                                                                                    numOfSchoolDays
                                                                                }
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        {editable && (
                                            <td>
                                                {editProgramId ===
                                                program.id ? (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline"
                                                            onClick={() =>
                                                                handleSaveProgramEditClick(
                                                                    program.id
                                                                )
                                                            }
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline"
                                                            onClick={
                                                                handleCancelProgramEditClick
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn btn-xs btn-ghost text-blue-500"
                                                            onClick={() =>
                                                                handleEditProgramClick(
                                                                    program
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
                                                                    removeProgram(
                                                                        program.id
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
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </React.Fragment>
    );
};

export default ProgramListContainer;
