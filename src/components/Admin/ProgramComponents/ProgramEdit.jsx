import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';
import { toast } from 'sonner';

import SearchableDropdownToggler from '../searchableDropdown';

import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import AdditionalScheduleForProgram from './AdditionalScheduleForProgram';
import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import { fetchSections, editSection } from '@features/sectionSlice';
import { fetchSubjects } from '@features/subjectSlice';
import TimeSelector from '@utils/timeSelector';

const ProgramEdit = ({
    program,
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

// ==========================================================================

    const { programs, status: programStatus } = useSelector(
        (state) => state.program
    );

    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );

    const { sections, status: sectionStatus } = useSelector(
        (state) => state.section
    );

// ==========================================================================

    const [editProgramId, setEditProgramId] = useState('');

    const [editProgramValue, setEditProgramValue] = useState('');

    const [editProgramCurr, setEditProgramCurr] = useState({
        7: [],
        8: [],
        9: [],
        10: [],
    });

    const [editSelectedShifts, setEditSelectedShifts] = useState({
        7: 0,
        8: 0,
        9: 0,
        10: 0,
    });

    const [editStartTimes, setEditStartTimes] = useState({
        7: morningStartTime,
        8: morningStartTime,
        9: morningStartTime,
        10: morningStartTime,
    });

    const [editEndTimes, setEditEndTimes] = useState({
        7: afternoonStartTime,
        8: afternoonStartTime,
        9: afternoonStartTime,
        10: afternoonStartTime,
    })

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

    const [editAdditionalScheds, setEditAdditionalScheds] = useState({
        7: [],
        8: [],
        9: [],
        10: [],
    });

    useEffect(() => {
        console.log('editAdditionalScheds', editAdditionalScheds);
    }, [editAdditionalScheds]);

// ==========================================================================

    const initializeStates = () => {
        if (!program) return;
    
        const editProgramCurr = {};
        const editSelectedShifts = {};
        const editStartTimes = {};
        const editEndTimes = {};
        const editFixedDays = {};
        const editFixedPositions = {};
        const editAdditionalScheds = {};
    
        [7, 8, 9, 10].forEach((level) => {
            editProgramCurr[level] = program[level]?.subjects || [];
            editSelectedShifts[level] = program[level]?.shift || 0;
            editStartTimes[level] = getTimeSlotString(program[level]?.startTime || 0);
            editEndTimes[level] = getTimeSlotString(program[level]?.endTime || 0);
            editFixedDays[level] = program[level]?.fixedDays || {};
            editFixedPositions[level] = program[level]?.fixedPositions || {};
            editAdditionalScheds[level] = program[level]?.additionalScheds || [];
        });
    
        setEditProgramId(program.id || null);
        setEditProgramValue(program.program || '');
        setEditProgramCurr(editProgramCurr);
        setEditSelectedShifts(editSelectedShifts);
        setEditStartTimes(editStartTimes);
        setEditEndTimes(editEndTimes);
        setEditFixedDays(editFixedDays);
        setEditFixedPositions(editFixedPositions);
        setEditAdditionalScheds(editAdditionalScheds);
    };

    useEffect(() => {
        if (program) {
            initializeStates();
        }
    }, [program]);

// ==========================================================================

    const [sectionDetailsToUpdate, setSectionDetailsToUpdate] = useState({
        shiftAndStartTime: false,
        fixedScheds: false,
        additionalScheds: false,
    });

// ==========================================================================

    // Subjects
        const handleSubjectSelection = (grade, selectedList) => {
            const validCombinations = [];

            setEditProgramCurr((prevState) => ({
                ...prevState,
                [grade]: selectedList,
            }));

            const updatedFixedDays = structuredClone(editFixedDays[grade]);
            const updatedFixedPositions = structuredClone(editFixedPositions[grade]);
            const updatedAdditionalScheds = structuredClone(editAdditionalScheds[grade]);

            Object.keys(updatedFixedDays).forEach((subID) => {
                if (!selectedList.includes(Number(subID))) {
                    delete updatedFixedDays[subID];
                    delete updatedFixedPositions[subID];
                }
            });

            const filteredAdditionalScheds = updatedAdditionalScheds.filter((sched) => selectedList.includes(sched.subject) || sched.subject === -1);

            console.log('filteredAdditionalScheds', filteredAdditionalScheds);

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

            setEditAdditionalScheds((prevState) => ({
                ...prevState,
                [grade]: filteredAdditionalScheds, // Update only the specified grade
            }));
        };

    // End Time
        const handleEndTimeChange = () => {
            [7, 8, 9, 10].forEach((grade) => {
                if (editProgramCurr[grade].length === 0) return;

                const startTimeIdx = getTimeSlotIndex(editStartTimes[grade]);
                const breakTimeCount = editProgramCurr[grade].length > 10 ? 2 : 1;

                let totalDuration = breakTimeCount * breakTimeDuration;

                editProgramCurr[grade].forEach((subId) => {
                    totalDuration += subjects[subId].classDuration;
                });

                const endTimeIdx = Math.ceil(totalDuration / 5) + startTimeIdx;

                setEditEndTimes((prevEndTimes) => ({
                    ...prevEndTimes,
                    [grade]: endTimeIdx || 216, // 216 = 6:00 PM
                }));
            });
        };

        useEffect(() => {
            if (editProgramCurr.length === 0) return;

            handleEndTimeChange();
        }, [editProgramCurr, editStartTimes, breakTimeDuration]);

    // Shift
        const handleShiftSelection = (grade, shift) => {
            setEditSelectedShifts((prevState) => ({
                ...prevState,
                [grade]: shift,
            }));

            const defaultTime = shift === 0 ? morningStartTime : afternoonStartTime;
            setEditStartTimes((prevState) => ({
                ...prevState,
                [grade]: defaultTime,
            }));
        };

    // Additional Schedule
        const handleAddAdditionalSchedule = (grade) => {
            setEditAdditionalScheds((prevScheds) => ({
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
            setEditAdditionalScheds((prevScheds) => ({
                ...prevScheds,
                [grade]: prevScheds[grade].filter((_, i) => i !== index),
            }));
        };

// ==========================================================================

    const updateProgramDependencies = () => {
        // Update program dependencies in SECTIONS
        Object.entries(sections).forEach(([id, section]) => {
            const originalSection = JSON.parse(JSON.stringify(section));
            const newSection = JSON.parse(JSON.stringify(section));

            console.log('xasdsadsa: ', newSection.startTime);
            console.log('starting time: ', editStartTimes[newSection.year]);

            // Early return if section is not part of the edited program
            if (newSection.program !== editProgramId) return;

            // Update shift and start time (if true)
            if (sectionDetailsToUpdate.shiftAndStartTime === true) {
                newSection.shift = editSelectedShifts[newSection.year];
                newSection.startTime = editStartTimes[newSection.year];
            }

            // Update additional schedules (if true)
            if (sectionDetailsToUpdate.additionalScheds === true)
                newSection.additionalScheds =
                    editAdditionalScheds[newSection.year];

            // Update fixed schedules (if true)
            if (sectionDetailsToUpdate.fixedScheds === true) {
                newSection.subjects = editProgramCurr[newSection.year];
                newSection.fixedDays = editFixedDays[newSection.year];
                newSection.fixedPositions = editFixedPositions[newSection.year];
            } else {
                // Use set to quickly look up subjects from the edited program-year and the current section
                const newSubs = new Set(editProgramCurr[newSection.year]);
                const originalSubs = new Set(newSection.subjects);

                // Early return if there are no changes
                if (
                    newSubs.size !== originalSubs.size ||
                    ![...newSubs].every((subjectId) =>
                        originalSubs.has(subjectId)
                    )
                ) {
                    // Add subjects from the edited program-year to the current section
                    editProgramCurr[newSection.year].forEach((subjectId) => {
                        if (!originalSubs.has(subjectId)) {
                            newSection.subjects.push(subjectId);
                            originalSubs.add(subjectId);
                        }
                    });

                    // Remove subjects from the current section that are not in the edited program-year
                    newSection.subjects = newSection.subjects.filter(
                        (subjectId) => newSubs.has(subjectId)
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
                        newSection.fixedDays[subjectId].forEach(
                            (day, index) => {
                                const pos =
                                    newSection.fixedPositions[subjectId][index];
                                if (
                                    day !== 0 &&
                                    pos !== 0 &&
                                    !dayPositionMap.has(`${day}-${pos}`)
                                ) {
                                    dayPositionMap.set(`${day}-${pos}`, true);
                                }
                            }
                        );
                    });

                    // Add fixed schedules from the edited program-year to the current section
                    newSection.subjects.forEach((subjectId) => {
                        if (!(subjectId in newSection.fixedDays)) {
                            let newSubjDays = [];
                            let newSubjPositions = [];

                            for (
                                let i = 0;
                                i <
                                editFixedDays[newSection.year][subjectId]
                                    .length;
                                i++
                            ) {
                                const day =
                                    editFixedDays[newSection.year][subjectId][
                                        i
                                    ];
                                const position =
                                    editFixedPositions[newSection.year][
                                        subjectId
                                    ][i];

                                // Check if the day-position combination is already occupied
                                if (
                                    day !== 0 &&
                                    position !== 0 &&
                                    !dayPositionMap.has(`${day}-${position}`)
                                ) {
                                    newSubjDays.push(day);
                                    newSubjPositions.push(position);
                                    dayPositionMap.set(
                                        `${day}-${position}`,
                                        true
                                    );
                                }
                                // else if (Number(day) + Number(position) === 1) {
                                //     newSubjDays.push(day);
                                //     newSubjPositions.push(position);
                                // }
                                else {
                                    newSubjDays.push(0);
                                    newSubjPositions.push(0);
                                }
                            }

                            newSection.fixedDays[subjectId] = newSubjDays;
                            newSection.fixedPositions[subjectId] =
                                newSubjPositions;
                        }
                    });
                }
            }

            console.log('check', newSection);

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
                            additionalScheds: newSection.additionalScheds,
                        },
                    })
                );
            }
        });
    };

    const handleSaveProgramEditClick = () => {
        if (!editProgramValue.trim()) {
            toast.error('Program name cannot be empty', {
                style: {
                    backgroundColor: 'red',
                    color: 'white',
                },
            });
            return;
        } else if (editProgramCurr[7].length === 0) {
            toast.error('Select at least one subject for grade 7', {
                style: {
                    backgroundColor: 'red',
                    color: 'white',
                },
            });
            return;
        } else if (editSelectedShifts[7] === undefined || !editStartTimes[7]) {
            toast.error('Select shift and start time for grade 7', {
                style: {
                    backgroundColor: 'red',
                    color: 'white',
                },
            });
            return;
        } else if (editProgramCurr[8].length === 0) {
            toast.error('Select at least one subject for grade 8', {
                style: {
                    backgroundColor: 'red',
                    color: 'white',
                },
            });
            return;
        } else if (editSelectedShifts[8] === undefined || !editStartTimes[8]) {
            toast.error('Select shift and start time for grade 8', {
                style: {
                    backgroundColor: 'red',
                    color: 'white',
                },
            });
            return;
        } else if (editProgramCurr[9].length === 0) {
            toast.error('Select at least one subject for grade 9', {
                style: {
                    backgroundColor: 'red',
                    color: 'white',
                },
            });
            return;
        } else if (editSelectedShifts[9] === undefined || !editStartTimes[9]) {
            toast.error('Select shift and start time for grade 9', {
                style: {
                    backgroundColor: 'red',
                    color: 'white',
                },
            });
            return;
        } else if (editProgramCurr[10].length === 0) {
            toast.error('Select at least one subject for grade 10', {
                style: {
                    backgroundColor: 'red',
                    color: 'white',
                },
            });
            return;
        } else if (editSelectedShifts[10] === undefined || !editStartTimes[10]) {
            toast.error('Select shift and start time for grade 10', {
                style: {
                    backgroundColor: 'red',
                    color: 'white',
                },
            });
            return;
        }

        console.log('editProgramId:', editProgramId);
        console.log('editProgramValue:', editProgramValue);
        console.log('editProgramCurr:', editProgramCurr);
        console.log('editFixedDays:', editFixedDays);
        console.log('editFixedPositions:', editFixedPositions);
        console.log('editSelectedShifts:', editSelectedShifts);
        console.log('editStartTimes:', editStartTimes);
        console.log('editEndTimes:', editEndTimes);
        console.log('editAdditionalScheds:', editAdditionalScheds);

        const currentProgram = programs[editProgramId]?.program || '';

        if (
            editProgramValue.trim().toLowerCase() ===
            currentProgram.trim().toLowerCase()
        ) {
            dispatch(
                reduxFunction({
                    programId: editProgramId,
                    updatedProgram: {
                        program: editProgramValue,
                        7: {
                            subjects: editProgramCurr[7],
                            fixedDays: editFixedDays[7],
                            fixedPositions: editFixedPositions[7],
                            shift: editSelectedShifts[7],
                            startTime: getTimeSlotIndex(
                                editStartTimes[7] || '06:00 AM'
                            ),
                            endTime: editEndTimes[7],
                            additionalScheds: editAdditionalScheds[7],
                        },
                        8: {
                            subjects: editProgramCurr[8],
                            fixedDays: editFixedDays[8],
                            fixedPositions: editFixedPositions[8],
                            shift: editSelectedShifts[8],
                            startTime: getTimeSlotIndex(
                                editStartTimes[8] || '06:00 AM'
                            ),
                            endTime: editEndTimes[8],
                            additionalScheds: editAdditionalScheds[8],
                        },
                        9: {
                            subjects: editProgramCurr[9],
                            fixedDays: editFixedDays[9],
                            fixedPositions: editFixedPositions[9],
                            shift: editSelectedShifts[9],
                            startTime: getTimeSlotIndex(
                                editStartTimes[9] || '06:00 AM'
                            ),
                            endTime: editEndTimes[9],
                            additionalScheds: editAdditionalScheds[9],
                        },
                        10: {
                            subjects: editProgramCurr[10],
                            fixedDays: editFixedDays[10],
                            fixedPositions: editFixedPositions[10],
                            shift: editSelectedShifts[10],
                            startTime: getTimeSlotIndex(
                                editStartTimes[10] || '06:00 AM'
                            ),
                            endTime: editEndTimes[10],
                            additionalScheds: editAdditionalScheds[10],
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

            resetStates();
            handleConfirmationModalClose();
            closeModal();
        } else {
            const duplicateProgram = Object.values(programs).find(
                (program) =>
                    program.program.trim().toLowerCase() ===
                    editProgramValue.trim().toLowerCase()
            );

            if (duplicateProgram) {
                toast.error('A program with this name already exists!', {
                    style: {
                        backgroundColor: 'red',
                        color: 'white',
                    },
                });
            } else if (editProgramValue.trim()) {
                dispatch(
                    reduxFunction({
                        programId: editProgramId,
                        updatedProgram: {
                            program: editProgramValue,
                            7: {
                                subjects: editProgramCurr[7],
                                fixedDays: editFixedDays[7],
                                fixedPositions: editFixedPositions[7],
                                shift: editSelectedShifts[7],
                                startTime: getTimeSlotIndex(
                                    editStartTimes[7] || '06:00 AM'
                                ),
                                endTime: editEndTimes[7],
                                additionalScheds: editAdditionalScheds[7],
                            },
                            8: {
                                subjects: editProgramCurr[8],
                                fixedDays: editFixedDays[8],
                                fixedPositions: editFixedPositions[8],
                                shift: editSelectedShifts[8],
                                startTime: getTimeSlotIndex(
                                    editStartTimes[8] || '06:00 AM'
                                ),
                                endTime: editEndTimes[8],
                                additionalScheds: editAdditionalScheds[8],
                            },
                            9: {
                                subjects: editProgramCurr[9],
                                fixedDays: editFixedDays[9],
                                fixedPositions: editFixedPositions[9],
                                shift: editSelectedShifts[9],
                                startTime: getTimeSlotIndex(
                                    editStartTimes[9] || '06:00 AM'
                                ),
                                endTime: editEndTimes[9],
                                additionalScheds: editAdditionalScheds[9],
                            },
                            10: {
                                subjects: editProgramCurr[10],
                                fixedDays: editFixedDays[10],
                                fixedPositions: editFixedPositions[10],
                                shift: editSelectedShifts[10],
                                startTime: getTimeSlotIndex(
                                    editStartTimes[10] || '06:00 AM'
                                ),
                                endTime: editEndTimes[10],
                                additionalScheds: editAdditionalScheds[10],
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

                resetStates();
                handleConfirmationModalClose();
                closeModal();
            }
        }
    };

// ===========================================================================

    const resetStates = () => {
        setEditProgramId(null);
        setEditProgramValue('');
        setEditProgramCurr([]);
        setEditStartTimes({
            7: morningStartTime,
            8: morningStartTime,
            9: morningStartTime,
            10: morningStartTime,
        });
        setEditEndTimes({
            7: afternoonStartTime,
            8: afternoonStartTime,
            9: afternoonStartTime,
            10: afternoonStartTime,
        });
        setEditSelectedShifts({
            7: 0,
            8: 0,
            9: 0,
            10: 0,
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
        setEditAdditionalScheds({
            7: program[7]?.additionalScheds || [],
            8: program[8]?.additionalScheds || [],
            9: program[9]?.additionalScheds || [],
            10: program[10]?.additionalScheds || [],
        });
    };

// ==========================================================================

    const handleConfirmationModalClose = () => {
        setSectionDetailsToUpdate({
            shiftAndStartTime: false,
            fixedScheds: false,
            additionalScheds: false,
        });

        document.getElementById(`confirm_program_edit_modal_${program.id}`).close();
    };

    const closeModal = () => {
        const modalCheckbox = document.getElementById(
            `programEdit_modal_${program.id}`
        );
        if (modalCheckbox) {
            modalCheckbox.checked = false; // Uncheck the modal toggle
        }
        // handleReset();
    };

// ==========================================================================

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

// ==========================================================================

    return (
        <div className="flex items-center justify-center">
            {/* Trigger Button */}
            <label
                htmlFor={`programEdit_modal_${program.id}`}
                className="btn btn-xs btn-ghost text-blue-500"
            >
                <RiEdit2Fill size={20} />
            </label>

            {/* Modal */}
            <input
                type="checkbox"
                id={`programEdit_modal_${program.id}`}
                className="modal-toggle"
            />
            <div className="modal">
                <div
                    className="modal-box relative"
                    style={{ width: '50%', maxWidth: 'none' }}
                >
                    <label
                        onClick={closeModal}
                        className="btn btn-sm btn-circle absolute right-2 top-2"
                    >
                        ✕
                    </label>
                    <h3 className="flex justify-center text-lg font-bold mb-4">
                        Edit Program
                    </h3>
                    <hr className="mb-4" />

                    {editProgramId === program.id && (
                        <div className="p-6">

                            {/* Input Field for Program Name */}
                            <div className="mb-4">
                                <label className="flex justify-center text-sm font-medium mb-2">
                                    Program Name:
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={editProgramValue}
                                    onChange={(e) =>
                                        setEditProgramValue(e.target.value)
                                    }
                                    placeholder="Enter department name"
                                    ref={inputNameRef}
                                />
                            </div>
                            
                            {/* Shift, Start Time, Subjects, and Fixed Schedules */}
                            <div>
                                {[7, 8, 9, 10].map(
                                    (grade) => (
                                        <div
                                            key={grade}
                                            className="my-2"
                                        >
                                            <div className="flex flex-wrap">
                                                <div className="w-1/2">

                                                    {/* Grade */}
                                                    <h3 className="font-bold">{`Grade ${grade}`}</h3>

                                                    {/* Shift Selection */}
                                                    <div className="mt-2 mb-2 text-sm flex flex-wrap items-start items-center">
                                                        <label className="w-1/4 mr-2 p-2 flex justify-end font-bold">
                                                            SHIFT
                                                        </label>
                                                        <div 
                                                            className='flex flex-col pl-2'
                                                        >
                                                            <label className="mb-1">
                                                                <input
                                                                    type="radio"
                                                                    value={editSelectedShifts[grade]}
                                                                    checked={editSelectedShifts[grade] === 0}
                                                                    onChange={() => handleShiftSelection(grade, 0)}
                                                                />
                                                                AM
                                                            </label>
                                                            <label>
                                                                <input
                                                                    type="radio"
                                                                    value={editSelectedShifts[grade]}
                                                                    checked={editSelectedShifts[grade] === 1}
                                                                    onChange={() => handleShiftSelection(grade, 1)}
                                                                />
                                                                PM
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Start Time Selection */}
                                                    <div className="mt-2 flex flex-wrap">
                                                        <label className="w-1/4 mr-2 p-2 text-sm flex items-center justify-end font-bold">
                                                            START TIME  
                                                        </label>
                                                        <div
                                                            className='w-2/3 pl-2'
                                                        >
                                                            <TimeSelector 
                                                                time={editStartTimes[grade]}
                                                                setTime={(newTime) => {
                                                                    setEditStartTimes((prevStartTimes) => ({
                                                                        ...prevStartTimes,
                                                                        [grade]: newTime, // Update the specific grade's time
                                                                    }));
                                                                }}
                                                                am={editSelectedShifts[grade] === 0 ? 1 : 0}
                                                                pm={editSelectedShifts[grade] === 1 ? 1 : 0} 
                                                            />
                                                        </div>
                                                    </div>

                                                </div>
                                            
                                                <div className="flex flex-wrap w-1/2">
                                                    <div className="w-full">
                                                        <SearchableDropdownToggler
                                                            selectedList={editProgramCurr[grade]}
                                                            setSelectedList={(list) => handleSubjectSelection(grade, list)}
                                                        />

                                                        <div className="flex flex-wrap gap-2 p-2 w-full">
                                                            {editProgramCurr[grade]?.map((id, index) => (
                                                                <div
                                                                    key={id}
                                                                    className="h-8 w-10 bg-green-400 rounded-md text-xs flex items-center justify-center truncate"
                                                                >
                                                                    {subjects[id]?.subject}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-center items-center">
                                                <button
                                                    className="btn text-xs"
                                                    onClick={() => document.getElementById(`assign_fixed_sched_modal_prog(${editProgramId})-grade(${grade})-view(0)`).showModal()}
                                                >
                                                    Open Fixed Schedule Maker for Grade{' '}{grade}
                                                </button>
                                                <FixedScheduleMaker
                                                    key={grade}
                                                    viewingMode={0}
                                                    pvs={0}
                                                    program={editProgramId}
                                                    grade={grade}
                                                    selectedSubjects={editProgramCurr[grade] || []}
                                                    fixedDays={editFixedDays[grade] || {}}
                                                    setFixedDays={setEditFixedDays}
                                                    fixedPositions={editFixedPositions[grade] || {}}
                                                    setFixedPositions={setEditFixedPositions}
                                                    numOfSchoolDays={numOfSchoolDays}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Additional Schedules */}
                            <div
                                className='flex flex-col justify-center items-center'
                            >
                                {[7, 8, 9, 10].map(
                                    (grade) => (
                                        <div
                                            key={`edit-add-sched-edit-prog(${program.id})-grade(${grade})`}
                                            className="mt-2 w-1/2 overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg"
                                            style={{scrollbarWidth: 'thin',
                                                    scrollbarColor: '#a0aec0 #edf2f7',
                                            }} // Optional for styled scrollbars
                                        >
                                            <div
                                                className="flex flex-wrap"
                                                style={{position: 'sticky',
                                                        top: 0,
                                                        zIndex: 1,
                                                        backgroundColor: 'white',
                                                }}
                                            >
                                                <div className="w-9/12 font-bold p-2 border-b border-gray-300">
                                                    Grade{' '}{grade}
                                                </div>
                                                <div className="w-3/12 flex justify-center items-center border-b border-gray-300">
                                                    <button
                                                        className="w-3/4 bg-green-700 m-2 font-bold text-white rounded-lg hover:bg-green-500"
                                                        onClick={() => handleAddAdditionalSchedule(grade)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                            {editAdditionalScheds[grade].map((sched, index) => (
                                                <div
                                                    key={index}
                                                    className="flex flex-wrap"
                                                >
                                                    <button
                                                        className="w-1/12 border rounded-l-lg bg-blue-200 hover:bg-blue-100 flex items-center justify-center"
                                                        onClick={() => handleDeleteAdditionalSchedule(grade, index)}
                                                    >
                                                        <RiDeleteBin7Line
                                                            size={15}
                                                        />
                                                    </button>
                                                    <div className="w-10/12">
                                                        <button
                                                            className="w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-gray-200"
                                                            onClick={() => document.getElementById(`add_additional_sched_modal_1_grade-${grade}_prog-${program.id}_idx-${index}`).showModal()}
                                                        >
                                                            {sched.name ? (
                                                                // Content to show when both are not empty
                                                                <>
                                                                    <p>
                                                                        Name:{' '}{sched.name}
                                                                    </p>
                                                                    <p>
                                                                        Subject:{' '}
                                                                        {sched.subject === -1 ? 'N/A' : subjects[sched.subject].subject}
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                // Content to show when either is empty
                                                                <p>
                                                                    Untitled Schedule{' '}{index + 1}
                                                                </p>
                                                            )}
                                                        </button>
                                                        <AdditionalScheduleForProgram
                                                            viewingMode={1}
                                                            programID={program.id}
                                                            grade={grade}
                                                            arrayIndex={index}
                                                            additionalSchedsOfProgYear={sched}
                                                        />
                                                    </div>
                                                    <div className="w-1/12 text-xs font-bold rounded-r-lg bg-blue-200 hover:bg-blue-100 flex text-center justify-center items-center p-2 cursor-pointer">
                                                        <button
                                                            onClick={() => document.getElementById(`add_additional_sched_modal_0_grade-${grade}_prog-${program.id}_idx-${index}`).showModal()}
                                                        >
                                                            <RiEdit2Fill
                                                                size={15}
                                                            />
                                                        </button>
                                                        <AdditionalScheduleForProgram
                                                            viewingMode={0}
                                                            programID={program.id}
                                                            grade={grade}
                                                            arrayIndex={index}
                                                            numOfSchoolDays={numOfSchoolDays}
                                                            progYearSubjects={editProgramCurr[grade]}
                                                            additionalSchedsOfProgYear={sched}
                                                            setAdditionalScheds={setEditAdditionalScheds}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                                            
                            {/* Error Message */}
                            {errorMessage && (
                                <p className="text-red-500 text-sm my-4 font-medium">
                                    {errorMessage}
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-2 mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => document.getElementById(`confirm_program_edit_modal_${program.id}`).showModal()}
                                >
                                    Update Program
                                </button>
                                <button
                                    className="btn btn-error"
                                    onClick={initializeStates}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <dialog
                id={`confirm_program_edit_modal_${program.id}`}
                className="modal modal-bottom sm:modal-middle"
            >
                <div
                    className="modal-box"
                    style={{ width: '30%', maxWidth: 'none' }}
                >
                    <div>
                        <div className="mb-3 text-center text-lg font-bold">
                            Confirmation for Modifications on Program
                        </div>
                    </div>

                    <div>
                        <div className="m-2 p-2">
                            Your modifications in this program will be saved as
                            well in all associated sections. Please select which
                            section details you would like to update.
                        </div>
                        <div className="flex justify-center items-center">
                            <div className="text-left">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="shift"
                                        className="mr-2"
                                        checked={
                                            sectionDetailsToUpdate.shiftAndStartTime
                                        }
                                        onChange={(e) =>
                                            setSectionDetailsToUpdate(
                                                (prev) => ({
                                                    ...prev,
                                                    shiftAndStartTime:
                                                        e.target.checked,
                                                })
                                            )
                                        }
                                    />
                                    Update Shift and Start Time
                                </label>
                                <br />

                                <label>
                                    <input
                                        type="checkbox"
                                        name="fixedScheds"
                                        className="mr-2"
                                        checked={
                                            sectionDetailsToUpdate.fixedScheds
                                        }
                                        onChange={(e) =>
                                            setSectionDetailsToUpdate(
                                                (prev) => ({
                                                    ...prev,
                                                    fixedScheds:
                                                        e.target.checked,
                                                })
                                            )
                                        }
                                    />
                                    Update Fixed Schedules
                                </label>
                                <br />
                                <label>
                                    <input
                                        type="checkbox"
                                        name="additionalScheds"
                                        className="mr-2"
                                        checked={
                                            sectionDetailsToUpdate.additionalScheds
                                        }
                                        onChange={(e) =>
                                            setSectionDetailsToUpdate(
                                                (prev) => ({
                                                    ...prev,
                                                    additionalScheds:
                                                        e.target.checked,
                                                })
                                            )
                                        }
                                    />
                                    Update Additional Schedules
                                </label>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center items-center gap-3">
                            <button
                                className="btn btn-sm bg-green-400 hover:bg-green-200"
                                onClick={() => handleSaveProgramEditClick()}
                            >
                                Confirm
                            </button>
                            <button
                                className="btn btn-sm"
                                onClick={() => handleConfirmationModalClose()}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="modal-action w-full mt-0">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
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

export default ProgramEdit;
