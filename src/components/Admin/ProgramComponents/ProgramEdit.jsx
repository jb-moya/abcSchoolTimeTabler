import { useState, useEffect, useRef } from 'react';

import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';
import { toast } from 'sonner';

import SearchableDropdownToggler from '../searchableDropdown';

import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { IoWarningSharp } from 'react-icons/io5';

import { editDocument } from '../../../hooks/CRUD/editDocument';

import AdditionalScheduleForProgram from './AdditionalScheduleForProgram';
import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import TimeSelector from '@utils/timeSelector';

const ProgramEdit = ({
    subjects,
    programs, 
    sections,
    program,
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
        7: morningStartTime,
        8: morningStartTime,
        9: morningStartTime,
        10: morningStartTime,
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

    const [editClassModality, setEditClassModality] = useState({
        7: new Array(numOfSchoolDays).fill(1),
        8: new Array(numOfSchoolDays).fill(1),
        9: new Array(numOfSchoolDays).fill(1),
        10: new Array(numOfSchoolDays).fill(1),
    });

    const [editAdditionalScheds, setEditAdditionalScheds] = useState({
        7: [],
        8: [],
        9: [],
        10: [],
    });

    const [validEndTimes, setValidEndTimes] = useState({
        7: true,
        8: true,
        9: true,
        10: true,
    });

    const isAddButtonDisabled = Object.values(validEndTimes).some((value) => !value);

    // useEffect(() => {
    //     console.log('editAdditionalScheds', editAdditionalScheds);
    // }, [editAdditionalScheds]);

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
            editClassModality[level] = program[level]?.modality || new Array(numOfSchoolDays).fill(1);
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
        setEditClassModality(editClassModality);
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
        modality: false,
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

        const filteredAdditionalScheds = updatedAdditionalScheds.filter(
            (sched) => selectedList.includes(sched.subject) || sched.subject === -1
        );

        console.log('filteredAdditionalScheds', filteredAdditionalScheds);

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
            const subjDays = structuredClone(updatedFixedDays[subID]);
            const subjPositions = structuredClone(updatedFixedPositions[subID]);

            for (let i = 0; i < subjDays.length; i++) {
                if (subjPositions[i] > selectedList.length || subjDays[i] > numOfSchoolDays) {
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

    useEffect(() => {
        console.log('editProgramCurr', editProgramCurr);
    }, [editProgramCurr]);

    // End Time
    const handleEndTimeChange = () => {

        [7, 8, 9, 10].forEach((grade) => {
            if (editProgramCurr[grade].length === 0) return;

            const startTimeIdx = getTimeSlotIndex(editStartTimes[grade]);
            const breakTimeCount = editProgramCurr[grade].length > 10 ? 2 : 1;

            let noOfClassBlocks = 0;
            const classDurations = [];

            editProgramCurr[grade].forEach((subId) => {
                const duration = subjects[subId].classDuration;
                classDurations.push(duration);
                noOfClassBlocks += Math.ceil(subjects[subId].weeklyMinutes / subjects[subId].classDuration);
            });

            let noOfRows = breakTimeCount + Math.ceil(noOfClassBlocks / numOfSchoolDays);

            const topDurations = classDurations.sort((a, b) => b - a).slice(0, noOfRows);

            let totalDuration = (breakTimeCount * breakTimeDuration) + topDurations.reduce((sum, duration) => sum + duration, 0);

            // console.log('noOfClassBlocks', noOfClassBlocks);
            // console.log('noOfRows', noOfRows);
            // console.log('topDurations', topDurations);
            // console.log('totalDuration', totalDuration);

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

    const handleModalityChange = (grade, index) => {
        setEditClassModality(prevState => ({
            ...prevState,
            [grade]: prevState[grade].map((value, i) => 
                i === index ? (value === 1 ? 0 : 1) : value
            )
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

            // Early return if section is not part of the edited program
            if (newSection.program !== editProgramId) return;

            // Update shift and start time (if true)
            if (sectionDetailsToUpdate.shiftAndStartTime === true) {
                newSection.shift = editSelectedShifts[newSection.year];

                console.log('editStartTimes[newSection.year]:', editStartTimes[newSection.year]);

                newSection.startTime = getTimeSlotIndex(editStartTimes[newSection.year]);

                newSection.endTime = editEndTimes[newSection.year];

                console.log('newSection.endTime:', newSection.endTime);
            }

            // Update modality (if true)
            if (sectionDetailsToUpdate.modality === true)
                newSection.modality = editClassModality[newSection.year];

            // Update additional schedules (if true)
            if (sectionDetailsToUpdate.additionalScheds === true)
                newSection.additionalScheds = editAdditionalScheds[newSection.year];

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
                if (newSubs.size !== originalSubs.size || ![...newSubs].every((subjectId) => originalSubs.has(subjectId))) {
                    // ================================================================================================

                    const startTimeIdx = newSection.startTime;
                    const breakTimeCount = newSubs.length > 10 ? 2 : 1;

                    let totalDuration = breakTimeCount * breakTimeDuration;

                    newSubs.forEach((subId) => {
                        totalDuration += subjects[subId].classDuration;
                    });

                    const endTimeIdx = Math.ceil(totalDuration / 5) + startTimeIdx;

                    if (getTimeSlotString(endTimeIdx)) {
                        newSection.endTime = endTimeIdx;
                    } else {
                        newSection.endTime = 216; // 216 = 6:00 PM
                    }

                    // =================================================================================================

                    // Add subjects from the edited program-year to the current section
                    editProgramCurr[newSection.year].forEach((subjectId) => {
                        if (!originalSubs.has(subjectId)) {
                            newSection.subjects.push(subjectId);
                            originalSubs.add(subjectId);
                        }
                    });

                    // Remove subjects from the current section that are not in the edited program-year
                    newSection.subjects = newSection.subjects.filter((subjectId) => newSubs.has(subjectId));

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
                            if (day !== 0 && pos !== 0 && !dayPositionMap.has(`${day}-${pos}`)) {
                                dayPositionMap.set(`${day}-${pos}`, true);
                            }
                        });
                    });

                    // Add fixed schedules from the edited program-year to the current section
                    newSection.subjects.forEach((subjectId) => {
                        if (!(subjectId in newSection.fixedDays)) {
                            let newSubjDays = [];
                            let newSubjPositions = [];

                            for (let i = 0; i < editFixedDays[newSection.year][subjectId].length; i++) {
                                const day = editFixedDays[newSection.year][subjectId][i];
                                const position = editFixedPositions[newSection.year][subjectId][i];

                                // Check if the day-position combination is already occupied
                                if (day !== 0 && position !== 0 && !dayPositionMap.has(`${day}-${position}`)) {
                                    newSubjDays.push(day);
                                    newSubjPositions.push(position);
                                    dayPositionMap.set(`${day}-${position}`, true);
                                } else {
                                    newSubjDays.push(0);
                                    newSubjPositions.push(0);
                                }
                            }

                            newSection.fixedDays[subjectId] = newSubjDays;
                            newSection.fixedPositions[subjectId] = newSubjPositions;
                        }
                    });
                }
            }

            console.log('originalSection.subjects: ', originalSection.subjects);
            console.log('newSection.subjects: ', newSection.subjects);

            if (originalSection !== newSection) {
                

                const updatedEntry = {
                    teacher: newSection.teacher,
                    program: newSection.program,
                    section: newSection.section,
                    subjects: newSection.subjects,
                    fixedDays: newSection.fixedDays,
                    fixedPositions: newSection.fixedPositions,
                    year: newSection.year,
                    shift: newSection.shift,
                    startTime: newSection.startTime,
                    endTime: newSection.endTime,
                    modality: newSection.modality,
                    additionalScheds: newSection.additionalScheds,
                }

                editDocument('sections', newSection.id, updatedEntry);
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

        // console.log('editProgramId:', editProgramId);
        // console.log('editProgramValue:', editProgramValue);
        // console.log('editProgramCurr:', editProgramCurr);
        // console.log('editFixedDays:', editFixedDays);
        // console.log('editFixedPositions:', editFixedPositions);
        // console.log('editSelectedShifts:', editSelectedShifts);
        // console.log('editStartTimes:', editStartTimes);
        // console.log('editEndTimes:', editEndTimes);
        // console.log('editAdditionalScheds:', editAdditionalScheds);

        // const currentProgram = programs[editProgramId]?.program || '';
        const currentProgram = programs[editProgramId]?.program || '';

        if (editProgramValue.trim().toLowerCase() === currentProgram.trim().toLowerCase()) {
            
            try {

                editDocument('programs', editProgramId, {
                    program: editProgramValue,
                    7: {
                        subjects: editProgramCurr[7],
                        fixedDays: editFixedDays[7],
                        fixedPositions: editFixedPositions[7],
                        shift: editSelectedShifts[7],
                        startTime: getTimeSlotIndex(editStartTimes[7] || '06:00 AM'),
                        endTime: editEndTimes[7],
                        additionalScheds: editAdditionalScheds[7],
                        modality: editClassModality[7],
                    },
                    8: {
                        subjects: editProgramCurr[8],
                        fixedDays: editFixedDays[8],
                        fixedPositions: editFixedPositions[8],
                        shift: editSelectedShifts[8],
                        startTime: getTimeSlotIndex(editStartTimes[8] || '06:00 AM'),
                        endTime: editEndTimes[8],
                        additionalScheds: editAdditionalScheds[8],
                        modality: editClassModality[8],
                    },
                    9: {
                        subjects: editProgramCurr[9],    
                        fixedDays: editFixedDays[9],
                        fixedPositions: editFixedPositions[9],
                        shift: editSelectedShifts[9],
                        startTime: getTimeSlotIndex(editStartTimes[9] || '06:00 AM'),
                        endTime: editEndTimes[9],
                        additionalScheds: editAdditionalScheds[9],
                        modality: editClassModality[9],
                    },
                    10: {
                        subjects: editProgramCurr[10],
                        fixedDays: editFixedDays[10],
                        fixedPositions: editFixedPositions[10],
                        shift: editSelectedShifts[10],
                        startTime: getTimeSlotIndex(editStartTimes[10] || '06:00 AM'),
                        endTime: editEndTimes[10],
                        additionalScheds: editAdditionalScheds[10],
                        modality: editClassModality[10],
                    },
                });

                updateProgramDependencies();
            } catch (error) {
                console.error("Error updating program: ", error);
            } finally {
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
            
        } else {
            const duplicateProgram = Object.values(programs).find(
                (program) => program.program.trim().toLowerCase() === editProgramValue.trim().toLowerCase()
            );

            if (duplicateProgram) {
                toast.error('A program with this name already exists!', {
                    style: {
                        backgroundColor: 'red',
                        color: 'white',
                    },
                });
            } else if (editProgramValue.trim()) {
                // dispatch(
                //     reduxFunction({
                //         programId: editProgramId,
                //         updatedProgram: {
                //             program: editProgramValue,
                //             7: {
                //                 subjects: editProgramCurr[7],
                //                 fixedDays: editFixedDays[7],
                //                 fixedPositions: editFixedPositions[7],
                //                 shift: editSelectedShifts[7],
                //                 startTime: getTimeSlotIndex(editStartTimes[7] || '06:00 AM'),
                //                 endTime: editEndTimes[7],
                //                 additionalScheds: editAdditionalScheds[7],
                //                 modality: editClassModality[7],
                //             },
                //             8: {
                //                 subjects: editProgramCurr[8],
                //                 fixedDays: editFixedDays[8],
                //                 fixedPositions: editFixedPositions[8],
                //                 shift: editSelectedShifts[8],
                //                 startTime: getTimeSlotIndex(editStartTimes[8] || '06:00 AM'),
                //                 endTime: editEndTimes[8],
                //                 additionalScheds: editAdditionalScheds[8],
                //                 modality: editClassModality[8],
                //             },
                //             9: {
                //                 subjects: editProgramCurr[9],
                //                 fixedDays: editFixedDays[9],
                //                 fixedPositions: editFixedPositions[9],
                //                 shift: editSelectedShifts[9],
                //                 startTime: getTimeSlotIndex(editStartTimes[9] || '06:00 AM'),
                //                 endTime: editEndTimes[9],
                //                 additionalScheds: editAdditionalScheds[9],
                //                 modality: editClassModality[9],
                //             },
                //             10: {
                //                 subjects: editProgramCurr[10],
                //                 fixedDays: editFixedDays[10],
                //                 fixedPositions: editFixedPositions[10],
                //                 shift: editSelectedShifts[10],
                //                 startTime: getTimeSlotIndex(editStartTimes[10] || '06:00 AM'),
                //                 endTime: editEndTimes[10],
                //                 additionalScheds: editAdditionalScheds[10],
                //                 modality: editClassModality[10],
                //             },
                //         },
                //     })
                // );

                try {

                    editDocument('programs', editProgramId, {
                        program: editProgramValue,
                        7: {
                            subjects: editProgramCurr[7],
                            fixedDays: editFixedDays[7],
                            fixedPositions: editFixedPositions[7],
                            shift: editSelectedShifts[7],
                            startTime: getTimeSlotIndex(editStartTimes[7] || '06:00 AM'),
                            endTime: editEndTimes[7],
                            additionalScheds: editAdditionalScheds[7],
                            modality: editClassModality[7],
                        },
                        8: {
                            subjects: editProgramCurr[8],
                            fixedDays: editFixedDays[8],
                            fixedPositions: editFixedPositions[8],
                            shift: editSelectedShifts[8],
                            startTime: getTimeSlotIndex(editStartTimes[8] || '06:00 AM'),
                            endTime: editEndTimes[8],
                            additionalScheds: editAdditionalScheds[8],
                            modality: editClassModality[8],
                        },
                        9: {
                            subjects: editProgramCurr[9],    
                            fixedDays: editFixedDays[9],
                            fixedPositions: editFixedPositions[9],
                            shift: editSelectedShifts[9],
                            startTime: getTimeSlotIndex(editStartTimes[9] || '06:00 AM'),
                            endTime: editEndTimes[9],
                            additionalScheds: editAdditionalScheds[9],
                            modality: editClassModality[9],
                        },
                        10: {
                            subjects: editProgramCurr[10],
                            fixedDays: editFixedDays[10],
                            fixedPositions: editFixedPositions[10],
                            shift: editSelectedShifts[10],
                            startTime: getTimeSlotIndex(editStartTimes[10] || '06:00 AM'),
                            endTime: editEndTimes[10],
                            additionalScheds: editAdditionalScheds[10],
                            modality: editClassModality[10],
                        },
                    });
    
                    updateProgramDependencies();
                } catch (error) {
                    console.error("Error updating program: ", error);
                } finally {
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
        setEditClassModality({
            7: program[7]?.modality || new Array(numOfSchoolDays).fill(1),
            8: program[8]?.modality || new Array(numOfSchoolDays).fill(1),
            9: program[9]?.modality || new Array(numOfSchoolDays).fill(1),
            10: program[10]?.modality || new Array(numOfSchoolDays).fill(1),
        })
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
        const modalCheckbox = document.getElementById(`programEdit_modal_${program.id}`);
        if (modalCheckbox) {
            modalCheckbox.checked = false; // Uncheck the modal toggle
        }
        // handleReset();
    };

// ==========================================================================

    // useEffect(() => {
    //     if (sectionStatus === 'idle') {
    //         dispatch(fetchSections());
    //     }
    // }, [sectionStatus, dispatch]);

    // useEffect(() => {
    //     if (programStatus === 'idle') {
    //         dispatch(fetchPrograms());
    //     }
    // }, [programStatus, dispatch]);

    // useEffect(() => {
    //     if (subjectStatus === 'idle') {
    //         dispatch(fetchSubjects());
    //     }
    // }, [subjectStatus, dispatch]);

// ==========================================================================

    const [activeTab, setActiveTab] = useState(7);

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    const grades = [7, 8, 9, 10];

    return (
        <div className=''>
            {/* Trigger Button */}
            <label htmlFor={`programEdit_modal_${program.id}`} className='btn btn-xs btn-ghost text-blue-500'>
                <RiEdit2Fill size={20} />
            </label>

            {/* Modal */}
            <input type='checkbox' id={`programEdit_modal_${program.id}`} className='modal-toggle' />
            <div className='modal'>
                <div className='modal-box' style={{ width: '48%', maxWidth: 'none' }}>
                    <div>
                        {/* Header section with centered "Add {reduxField}" */}
                        <div className='flex justify-between mb-4'>
                            <h3 className='text-lg font-bold text-center w-full'>Edit Program</h3>
                        </div>

                        <hr className='mb-4' />

                        {/* Input field for program name */}
                        <div className='mb-4'>
                            <label className='flex justify-center text-sm font-medium mb-2'>Program Name:</label>
                            <input
                                type='text'
                                className='input input-bordered w-full'
                                value={editProgramValue}
                                onChange={(e) => setEditProgramValue(e.target.value)}
                                placeholder='Enter program name'
                                ref={inputNameRef}
                            />
                        </div>

                        {/* Subject, shift, and fixed schedules management */}
                        <div className='text-sm flex flex-col space-y-4'>
                            {/* Tabs Navigation */}
                            <div className='flex justify-between space-x-2 bg-base-300 p-3 rounded-lg border border-base-content border-opacity-20 shadow-md'>
                                {grades.map((grade) => (
                                    <button
                                        key={grade}
                                        onClick={() => setActiveTab(grade)}
                                        className={`px-11 py-2 font-semibold rounded-lg transition ${
                                            activeTab === grade
                                                ? 'bg-primary text-white shadow-md'
                                                : 'bg-base-100 hover:bg-base-200'
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
                                        <div className='rounded-lg shadow-md border border-base-content border-opacity-20 space-y-2 p-4 mb-4'>
                                            <div className='flex items-center'>
                                                <label className='w-1/4 font-semibold text-base text-center'>SHIFT:</label>
                                                <div className='flex space-x-6 text-base'>
                                                    {['AM', 'PM'].map((shift, index) => (
                                                        <label key={index} className='flex items-center space-x-2'>
                                                            <input
                                                                type='radio'
                                                                value={editSelectedShifts[grade]}
                                                                checked={editSelectedShifts[grade] === index}
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
                                                            time={editStartTimes[grade]}
                                                            setTime={(newTime) =>
                                                                setEditStartTimes((prevStartTimes) => ({
                                                                    ...prevStartTimes,
                                                                    [grade]: newTime,
                                                                }))
                                                            }
                                                            am={editSelectedShifts[grade] === 0 ? 1 : 0}
                                                            pm={editSelectedShifts[grade] === 1 ? 1 : 0}
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
                                        <div className='rounded-lg shadow-md border border-base-content border-opacity-20 space-y-2 p-4 mb-4'>
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
                                                                    selectedList={editProgramCurr[grade] || []}
                                                                    setSelectedList={(list) =>
                                                                        handleSubjectSelection(grade, list)
                                                                    }
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
                                                                                    `assign_fixed_sched_modal_prog(${editProgramId})-grade(${grade})-view(0)`
                                                                                )
                                                                                .showModal()
                                                                        }
                                                                        disabled={!editProgramCurr[grade]?.length}
                                                                    >
                                                                        Open Fixed Schedule Maker
                                                                    </button>

                                                                    <FixedScheduleMaker
                                                                        subjectsStore={subjects}
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
                                                        </div>
                                                    </div>

                                                    <div className='flex space-x-2'>
                                                        <label className='font-semibold w-1/4'>Selected Subjects:</label>
                                                        {editProgramCurr[grade]?.length === 0 ? (
                                                            <div className='text-gray-500 w-3/4 flex justify-start'>
                                                                No Subjects Selected
                                                            </div>
                                                        ) : (
                                                            editProgramCurr[grade]?.map((id) => (
                                                                <div
                                                                    key={id}
                                                                    className='badge badge-secondary px-4 py-2 truncate'
                                                                >
                                                                    {subjects[id]?.subject || 'Subject not found'}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Class Modality */}
                                        <div className='rounded-lg shadow-md border space-y-2 p-4 mb-4'>
                                            <div className='font-semibold text-lg text-center'>Class Modality</div>
                                            <hr className='my-2'></hr>

                                            <table className='table'>
                                                <thead>
                                                    <tr>
                                                        {Array.from({ length: numOfSchoolDays }, (_, index) => (
                                                            <th 
                                                                key={index}
                                                                className='text-center border border-gray-300'
                                                                style={{ width: `${100 / numOfSchoolDays}%` }} // Ensures equal width for all days
                                                            >
                                                                {days[index]}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody> 
                                                    <tr>
                                                        {Array.from({ length: numOfSchoolDays }, (_, index) => (
                                                            <td 
                                                                key={index}
                                                                className='text-center border border-gray-300'
                                                                style={{ width: `${100 / numOfSchoolDays}%` }} // Ensures equal width for all days
                                                            >
                                                                <button
                                                                    key={`${grade}-${index}`}
                                                                    className={`btn w-full h-full flex items-center justify-center ${editClassModality[grade][index] === 1 ? 'bg-green-500' : 'bg-red-500'}`}
                                                                    onClick={() => handleModalityChange(grade, index)}
                                                                >
                                                                    {editClassModality[grade][index] === 1 ? 'ONSITE' : 'OFFSITE'}
                                                                </button>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>


                                        {/* Additional Schedules */}
                                        <div className='p-4 rounded-lg shadow-md border border-base-content border-opacity-20'>
                                            <div className='text-center font-semibold text-lg'>Additional Schedules</div>
                                            <hr className='my-2'></hr>

                                            {/* Button to add schedules */}
                                            <button
                                                onClick={() => handleAddAdditionalSchedule(grade)}
                                                className='flex flex-wrap items-right text-sm mt-2 bg-primary text-white p-4 px-2 py-1 rounded-lg hover:bg-blue-600'
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
                                                {editAdditionalScheds[grade].map((sched, index) => (
                                                    <div
                                                        key={index}
                                                        className='flex flex-wrap border-b border-base-content border-opacity-20'
                                                    >
                                                        <button
                                                            className='w-1/12 rounded-l-lg hover:bg-primary-content flex rounded-lg hover:text-error items-center justify-center'
                                                            onClick={() => handleDeleteAdditionalSchedule(grade, index)}
                                                        >
                                                            <RiDeleteBin7Line size={15} />
                                                        </button>
                                                        <div className='w-10/12'>
                                                            <button
                                                                className='w-full p-2 shadow-sm hover:bg-primary-content rounded-lg'
                                                                onClick={() =>
                                                                    document
                                                                        .getElementById(
                                                                            `add_additional_sched_modal_1_grade-${grade}_prog-${editProgramId}_idx-${index}`
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
                                                                subjects={subjects}
                                                                viewingMode={1}
                                                                programID={editProgramId}
                                                                grade={grade}
                                                                arrayIndex={index}
                                                                additionalSchedsOfProgYear={sched}
                                                            />
                                                        </div>
                                                        <button
                                                            className='w-1/12 flex items-center justify-center rounded-lg hover:text-primary hover:bg-primary-content'
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        `add_additional_sched_modal_0_grade-${grade}_prog-${editProgramId}_idx-${index}`
                                                                    )
                                                                    .showModal()
                                                            }
                                                        >
                                                            <RiEdit2Fill size={15} />
                                                        </button>
                                                        <AdditionalScheduleForProgram
                                                            subjects={subjects}
                                                            viewingMode={0}
                                                            programID={editProgramId}
                                                            grade={grade}
                                                            arrayIndex={index}
                                                            numOfSchoolDays={numOfSchoolDays}
                                                            progYearSubjects={editProgramCurr[grade]}
                                                            additionalSchedsOfProgYear={sched}
                                                            setAdditionalScheds={setEditAdditionalScheds}
                                                        />
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
                                    onClick={() =>
                                        document.getElementById(`confirm_program_edit_modal_${program.id}`).showModal()
                                    }
                                    disabled={isAddButtonDisabled}
                                >
                                    <div>Update Program</div>
                                </button>
                            </div>
                            <button className='btn btn-error border-0' onClick={initializeStates}>
                                Reset
                            </button>
                        </div>
                    </div>
                    <div className='modal-action w-full'>
                        <button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2' onClick={closeModal}>
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            <dialog id={`confirm_program_edit_modal_${program.id}`} className='modal modal-bottom sm:modal-middle'>
                <div className='modal-box' style={{ width: '30%', maxWidth: 'none' }}>
                    <div>
                        <div className='mb-3 text-center text-lg font-bold'>Confirmation for Modifications on Program</div>
                    </div>

                    <div>
                        <div className='m-2 p-2'>
                            Your modifications in this program will be saved as well in all associated sections. Please select
                            which section details you would like to update.
                        </div>
                        <div className='flex justify-center items-center'>
                            <div className='text-left'>
                                <label>
                                    <input
                                        type='checkbox'
                                        name='shift'
                                        className='mr-2'
                                        checked={sectionDetailsToUpdate?.shiftAndStartTime || false}
                                        onChange={(e) =>
                                            setSectionDetailsToUpdate((prev) => ({
                                                ...prev,
                                                shiftAndStartTime: e.target.checked,
                                            }))
                                        }
                                    />
                                    Update Shift and Start Time
                                </label>
                                <br />

                                <label>
                                    <input
                                        type='checkbox'
                                        name='fixedScheds'
                                        className='mr-2'
                                        checked={sectionDetailsToUpdate?.fixedScheds || false}
                                        onChange={(e) =>
                                            setSectionDetailsToUpdate((prev) => ({
                                                ...prev,
                                                fixedScheds: e.target.checked,
                                            }))
                                        }
                                    />
                                    Update Fixed Schedules
                                </label>
                                <br />

                                <label>
                                    <input
                                        type='checkbox'
                                        name='additionalScheds'
                                        className='mr-2'
                                        checked={sectionDetailsToUpdate?.additionalScheds || false}
                                        onChange={(e) =>
                                            setSectionDetailsToUpdate((prev) => ({
                                                ...prev,
                                                additionalScheds: e.target.checked,
                                            }))
                                        }
                                    />
                                    Update Additional Schedules
                                </label>
                                <br />

                                <label>
                                    <input
                                        type='checkbox'
                                        name='modality'
                                        className='mr-2'
                                        checked={sectionDetailsToUpdate?.modality || false}
                                        onChange={(e) =>
                                            setSectionDetailsToUpdate((prev) => ({
                                                ...prev,
                                                modality: e.target.checked,
                                            }))
                                        }
                                    />
                                    Update Class Modality
                                </label>
                            </div>
                        </div>
                        <div className='mt-4 flex justify-center items-center gap-3'>
                            <button
                                className='btn btn-sm bg-green-400 hover:bg-green-200'
                                onClick={() => handleSaveProgramEditClick()}
                            >
                                Confirm
                            </button>
                            <button className='btn btn-sm' onClick={() => handleConfirmationModalClose()}>
                                Cancel
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

export default ProgramEdit;
