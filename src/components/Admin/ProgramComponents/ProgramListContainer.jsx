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
import SearchableDropdownToggler from '../searchableDropdown';

import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';

import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';
import { toast } from 'sonner';

import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import DeleteData from '../DeleteData';
import AddProgramContainer from './ProgramAdd';
import AdditionalScheduleForProgram from './AdditionalScheduleForProgram';
import ProgramEdit from './ProgramEdit';

const ProgramListContainer = ({
    numOfSchoolDays: externalNumOfSchoolDays,
    editable = false,
}) => {
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

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState('');

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return (
            externalNumOfSchoolDays ??
            (Number(localStorage.getItem('numOfSchoolDays')) || 0)
        );
    });

    const morningStartTime =
        localStorage.getItem('morningStartTime') || '06:00 AM';
    const afternoonStartTime =
        localStorage.getItem('afternoonStartTime') || '01:00 PM';

    const [searchProgramResult, setSearchProgramResult] = useState(programs);
    const [searchProgramValue, setSearchProgramValue] = useState('');

    const [editProgramId, setEditProgramId] = useState(null);
    const [editProgramValue, setEditProgramValue] = useState('');
    const [editProgramCurr, setEditProgramCurr] = useState([]);
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
    const [editAdditionalScheds, setEditAdditionalScheds] = useState({
        7: [],
        8: [],
        9: [],
        10: [],
    });

    // For auto updates in sections
    const [sectionDetailsToUpdate, setSectionDetailsToUpdate] = useState({
        shift: false,
        startTime: false,
        fixedScheds: false,
        additionalScheds: false,
    });

    // Handling edit
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
        setEditAdditionalScheds({
            7: program[7]?.additionalScheds || [],
            8: program[8]?.additionalScheds || [],
            9: program[9]?.additionalScheds || [],
            10: program[10]?.additionalScheds || [],
        });
    };

    // const handleSaveProgramEditClick = () => {
    //     if (!editProgramValue.trim()) {
    //         toast.error('Program name cannot be empty', {
    //             style: {
    //                 backgroundColor: 'red',
    //                 color: 'white',
    //             },
    //         });
    //         return;
    //     } else if (editProgramCurr[7].length === 0) {
    //         toast.error('Select at least one subject for grade 7', {
    //             style: {
    //                 backgroundColor: 'red',
    //                 color: 'white',
    //             },
    //         });
    //         return;
    //     } else if (selectedShifts[7] === undefined || !startTimes[7]) {
    //         toast.error('Select shift and start time for grade 7', {
    //             style: {
    //                 backgroundColor: 'red',
    //                 color: 'white',
    //             },
    //         });
    //         return;
    //     } else if (editProgramCurr[8].length === 0) {
    //         toast.error('Select at least one subject for grade 8', {
    //             style: {
    //                 backgroundColor: 'red',
    //                 color: 'white',
    //             },
    //         });
    //         return;
    //     } else if (selectedShifts[8] === undefined || !startTimes[8]) {
    //         toast.error('Select shift and start time for grade 8', {
    //             style: {
    //                 backgroundColor: 'red',
    //                 color: 'white',
    //             },
    //         });
    //         return;
    //     } else if (editProgramCurr[9].length === 0) {
    //         toast.error('Select at least one subject for grade 9', {
    //             style: {
    //                 backgroundColor: 'red',
    //                 color: 'white',
    //             },
    //         });
    //         return;
    //     } else if (selectedShifts[9] === undefined || !startTimes[9]) {
    //         toast.error('Select shift and start time for grade 9', {
    //             style: {
    //                 backgroundColor: 'red',
    //                 color: 'white',
    //             },
    //         });
    //         return;
    //     } else if (editProgramCurr[10].length === 0) {
    //         toast.error('Select at least one subject for grade 10', {
    //             style: {
    //                 backgroundColor: 'red',
    //                 color: 'white',
    //             },
    //         });
    //         return;
    //     } else if (selectedShifts[10] === undefined || !startTimes[10]) {
    //         toast.error('Select shift and start time for grade 10', {
    //             style: {
    //                 backgroundColor: 'red',
    //                 color: 'white',
    //             },
    //         });
    //         return;
    //     }

    //     const currentProgram = programs[editProgramId]?.program || '';

    //     if (
    //         editProgramValue.trim().toLowerCase() ===
    //         currentProgram.trim().toLowerCase()
    //     ) {
    //         dispatch(
    //             editProgram({
    //                 programId: editProgramId,
    //                 updatedProgram: {
    //                     program: editProgramValue,
    //                     7: {
    //                         subjects: editProgramCurr[7],
    //                         fixedDays: editFixedDays[7],
    //                         fixedPositions: editFixedPositions[7],
    //                         shift: selectedShifts[7],
    //                         startTime: getTimeSlotIndex(
    //                             startTimes[7] || '06:00 AM'
    //                         ),
    //                         additionalScheds: editAdditionalScheds[7],
    //                     },
    //                     8: {
    //                         subjects: editProgramCurr[8],
    //                         fixedDays: editFixedDays[8],
    //                         fixedPositions: editFixedPositions[8],
    //                         shift: selectedShifts[8],
    //                         startTime: getTimeSlotIndex(
    //                             startTimes[8] || '06:00 AM'
    //                         ),
    //                         additionalScheds: editAdditionalScheds[8],
    //                     },
    //                     9: {
    //                         subjects: editProgramCurr[9],
    //                         fixedDays: editFixedDays[9],
    //                         fixedPositions: editFixedPositions[9],
    //                         shift: selectedShifts[9],
    //                         startTime: getTimeSlotIndex(
    //                             startTimes[9] || '06:00 AM'
    //                         ),
    //                         additionalScheds: editAdditionalScheds[9],
    //                     },
    //                     10: {
    //                         subjects: editProgramCurr[10],
    //                         fixedDays: editFixedDays[10],
    //                         fixedPositions: editFixedPositions[10],
    //                         shift: selectedShifts[10],
    //                         startTime: getTimeSlotIndex(
    //                             startTimes[10] || '06:00 AM'
    //                         ),
    //                         additionalScheds: editAdditionalScheds[10],
    //                     },
    //                 },
    //             })
    //         );

    //         updateProgramDependencies();

    //         toast.success('Data and dependencies updated successfully!', {
    //             style: {
    //                 backgroundColor: '#28a745',
    //                 color: '#fff',
    //                 borderColor: '#28a745',
    //             },
    //         });

    //         resetStates();
    //         handleConfirmationModalClose();
    //     } else {
    //         const duplicateProgram = Object.values(programs).find(
    //             (program) =>
    //                 program.program.trim().toLowerCase() ===
    //                 editProgramValue.trim().toLowerCase()
    //         );

    //         if (duplicateProgram) {
    //             toast.error('A program with this name already exists!', {
    //                 style: {
    //                     backgroundColor: 'red',
    //                     color: 'white',
    //                 },
    //             });
    //         } else if (editProgramValue.trim()) {
    //             dispatch(
    //                 editProgram({
    //                     programId: editProgramId,
    //                     updatedProgram: {
    //                         program: editProgramValue,
    //                         7: {
    //                             subjects: editProgramCurr[7],
    //                             fixedDays: editFixedDays[7],
    //                             fixedPositions: editFixedPositions[7],
    //                             shift: selectedShifts[7],
    //                             startTime: getTimeSlotIndex(
    //                                 startTimes[7] || '06:00 AM'
    //                             ),
    //                             additionalScheds: editAdditionalScheds[7],
    //                         },
    //                         8: {
    //                             subjects: editProgramCurr[8],
    //                             fixedDays: editFixedDays[8],
    //                             fixedPositions: editFixedPositions[8],
    //                             shift: selectedShifts[8],
    //                             startTime: getTimeSlotIndex(
    //                                 startTimes[8] || '06:00 AM'
    //                             ),
    //                             additionalScheds: editAdditionalScheds[8],
    //                         },
    //                         9: {
    //                             subjects: editProgramCurr[9],
    //                             fixedDays: editFixedDays[9],
    //                             fixedPositions: editFixedPositions[9],
    //                             shift: selectedShifts[9],
    //                             startTime: getTimeSlotIndex(
    //                                 startTimes[9] || '06:00 AM'
    //                             ),
    //                             additionalScheds: editAdditionalScheds[9],
    //                         },
    //                         10: {
    //                             subjects: editProgramCurr[10],
    //                             fixedDays: editFixedDays[10],
    //                             fixedPositions: editFixedPositions[10],
    //                             shift: selectedShifts[10],
    //                             startTime: getTimeSlotIndex(
    //                                 startTimes[10] || '06:00 AM'
    //                             ),
    //                             additionalScheds: editAdditionalScheds[10],
    //                         },
    //                     },
    //                 })
    //             );

    //             updateProgramDependencies();

    //             toast.success('Data and dependencies updated successfully!', {
    //                 style: {
    //                     backgroundColor: '#28a745',
    //                     color: '#fff',
    //                     borderColor: '#28a745',
    //                 },
    //             });

    //             resetStates();
    //             handleConfirmationModalClose();
    //         }
    //     }
    // };

    // const updateProgramDependencies = () => {
    //     // Update program dependencies in SECTIONS
    //     Object.entries(sections).forEach(([id, section]) => {
    //         const originalSection = JSON.parse(JSON.stringify(section));
    //         const newSection = JSON.parse(JSON.stringify(section));

    //         console.log('xasdsadsa: ', newSection.startTime)
    //         console.log('starting time: ', startTimes[newSection.year]);

    //         // Early return if section is not part of the edited program
    //         if (newSection.program !== editProgramId) return;

    //         // Update shift and start time (if true)
    //         if (sectionDetailsToUpdate.shiftAndStartTime === true)
    //         {
    //             newSection.shift = selectedShifts[newSection.year];
    //             newSection.startTime = startTimes[newSection.year];
    //         }

    //         // Update additional schedules (if true)
    //         if (sectionDetailsToUpdate.additionalScheds === true)
    //             newSection.additionalScheds =
    //                 editAdditionalScheds[newSection.year];

    //         // Update fixed schedules (if true)
    //         if (sectionDetailsToUpdate.fixedScheds === true) {
    //             newSection.subjects = editProgramCurr[newSection.year];
    //             newSection.fixedDays = editFixedDays[newSection.year];
    //             newSection.fixedPositions = editFixedPositions[newSection.year];
    //         } else {
    //             // Use set to quickly look up subjects from the edited program-year and the current section
    //             const newSubs = new Set(editProgramCurr[newSection.year]);
    //             const originalSubs = new Set(newSection.subjects);

    //             // Early return if there are no changes
    //             if (
    //                 newSubs.size !== originalSubs.size ||
    //                 !([...newSubs].every((subjectId) => originalSubs.has(subjectId)))
    //             ) {
    //                 // Add subjects from the edited program-year to the current section
    //                 editProgramCurr[newSection.year].forEach((subjectId) => {
    //                     if (!originalSubs.has(subjectId)) {
    //                         newSection.subjects.push(subjectId);
    //                         originalSubs.add(subjectId);
    //                     }
    //                 });

    //                 // Remove subjects from the current section that are not in the edited program-year
    //                 newSection.subjects = newSection.subjects.filter((subjectId) =>
    //                     newSubs.has(subjectId)
    //                 );

    //                 // Update the section in the sections object
    //                 const newSubjsSet = new Set(newSection.subjects);

    //                 // Remove the fixed schedules from the current section that are not in the edited program-year
    //                 Object.keys(newSection.fixedDays).forEach((subjectId) => {
    //                     if (!newSubjsSet.has(subjectId)) {
    //                         delete newSection.fixedDays[subjectId];
    //                         delete newSection.fixedPositions[subjectId];
    //                     }
    //                 });

    //                 // Retrieve all occupied days and positions of the current section
    //                 const dayPositionMap = new Map();
    //                 Object.keys(newSection.fixedDays).forEach((subjectId) => {
    //                     newSection.fixedDays[subjectId].forEach((day, index) => {
    //                         const pos = newSection.fixedPositions[subjectId][index];
    //                         if (
    //                             day !== 0 &&
    //                             pos !== 0 &&
    //                             !dayPositionMap.has(`${day}-${pos}`)
    //                         ) {
    //                             dayPositionMap.set(`${day}-${pos}`, true);
    //                         }
    //                     });
    //                 });

    //                 // Add fixed schedules from the edited program-year to the current section
    //                 newSection.subjects.forEach((subjectId) => {
    //                     if (!(subjectId in newSection.fixedDays)) {
    //                         let newSubjDays = [];
    //                         let newSubjPositions = [];

    //                         for (
    //                             let i = 0;
    //                             i <
    //                             editFixedDays[newSection.year][subjectId].length;
    //                             i++
    //                         ) {
    //                             const day =
    //                                 editFixedDays[newSection.year][subjectId][i];
    //                             const position =
    //                                 editFixedPositions[newSection.year][subjectId][
    //                                     i
    //                                 ];

    //                             // Check if the day-position combination is already occupied
    //                             if (
    //                                 day !== 0 &&
    //                                 position !== 0 &&
    //                                 !dayPositionMap.has(`${day}-${position}`)
    //                             ) {
    //                                 newSubjDays.push(day);
    //                                 newSubjPositions.push(position);
    //                                 dayPositionMap.set(`${day}-${position}`, true);
    //                             }
    //                             // else if (Number(day) + Number(position) === 1) {
    //                             //     newSubjDays.push(day);
    //                             //     newSubjPositions.push(position);
    //                             // }
    //                             else {
    //                                 newSubjDays.push(0);
    //                                 newSubjPositions.push(0);
    //                             }
    //                         }

    //                         newSection.fixedDays[subjectId] = newSubjDays;
    //                         newSection.fixedPositions[subjectId] = newSubjPositions;
    //                     }
    //                 });
    //             }
    //         }      

    //         console.log('check', newSection);

    //         if (originalSection !== newSection) {
    //             dispatch(
    //                 editSection({
    //                     sectionId: newSection.id,
    //                     updatedSection: {
    //                         id: newSection.id,
    //                         teacher: newSection.teacher,
    //                         program: newSection.program,
    //                         section: newSection.section,
    //                         subjects: newSection.subjects,
    //                         fixedDays: newSection.fixedDays,
    //                         fixedPositions: newSection.fixedPositions,
    //                         year: newSection.year,
    //                         shift: newSection.shift,
    //                         startTime: getTimeSlotIndex(
    //                             newSection.startTime || '06:00 AM'
    //                         ),
    //                         additionalScheds: newSection.additionalScheds,
    //                     },
    //                 })
    //             );
    //         }
    //     });
    // };

    // Handling detail changes
    // const renderTimeOptions = (shift) => {
    //     const times =
    //         shift === 0
    //             ? Array.from({ length: 36 }, (_, i) => {
    //                   const hours = 6 + Math.floor(i / 6);
    //                   const minutes = (i % 6) * 10;
    //                   return `${String(hours).padStart(2, '0')}:${String(
    //                       minutes
    //                   ).padStart(2, '0')} AM`;
    //               })
    //             : ['01:00 PM'];

    //     return times.map((time) => (
    //         <option key={time} value={time}>
    //             {time}
    //         </option>
    //     ));
    // };

    // const handleSubjectSelection = (grade, selectedList) => {
    //     const validCombinations = [];

    //     setEditProgramCurr((prevState) => ({
    //         ...prevState,
    //         [grade]: selectedList,
    //     }));

    //     const updatedFixedDays = structuredClone(editFixedDays[grade]);
    //     const updatedFixedPositions = structuredClone(
    //         editFixedPositions[grade]
    //     );

    //     Object.keys(updatedFixedDays).forEach((subID) => {
    //         if (!selectedList.includes(Number(subID))) {
    //             delete updatedFixedDays[subID];
    //             delete updatedFixedPositions[subID];
    //         }
    //     });

    //     selectedList.forEach((subjectID) => {
    //         if (!updatedFixedDays[subjectID]) {
    //             const subject = subjects[subjectID];
    //             if (subject) {
    //                 const numClasses = Math.min(
    //                     Math.ceil(
    //                         subject.weeklyMinutes / subject.classDuration
    //                     ),
    //                     numOfSchoolDays
    //                 );
    //                 updatedFixedDays[subjectID] = Array(numClasses).fill(0);
    //                 updatedFixedPositions[subjectID] =
    //                     Array(numClasses).fill(0);
    //             }
    //         }
    //     });

    //     selectedList.forEach((subID) => {
    //         const subjDays = updatedFixedDays[subID] || [];
    //         const subjPositions = updatedFixedPositions[subID] || [];

    //         subjDays.forEach((day, index) => {
    //             const position = subjPositions[index];
    //             if (day !== 0 && position !== 0) {
    //                 validCombinations.push([day, position]);
    //             }
    //         });
    //     });

    //     selectedList.forEach((subID) => {
    //         const subjDays = structuredClone(updatedFixedDays[subID]);
    //         const subjPositions = structuredClone(updatedFixedPositions[subID]);

    //         for (let i = 0; i < subjDays.length; i++) {
    //             if (
    //                 subjPositions[i] > selectedList.length ||
    //                 subjDays[i] > numOfSchoolDays
    //             ) {
    //                 subjDays[i] = 0;
    //                 subjPositions[i] = 0;
    //             }
    //         }

    //         updatedFixedDays[subID] = subjDays;
    //         updatedFixedPositions[subID] = subjPositions;
    //     });

    //     setEditFixedDays((prevState) => ({
    //         ...prevState,
    //         [grade]: updatedFixedDays, // Update only the specified grade
    //     }));

    //     setEditFixedPositions((prevState) => ({
    //         ...prevState,
    //         [grade]: updatedFixedPositions, // Update only the specified grade
    //     }));
    // };

    // const handleAddAdditionalSchedule = (grade) => {
    //     setEditAdditionalScheds((prevScheds) => ({
    //         ...prevScheds,
    //         [grade]: [
    //             ...prevScheds[grade],
    //             {
    //                 name: '',
    //                 subject: 0,
    //                 duration: 60,
    //                 frequency: 1,
    //                 shown: true,
    //                 time: selectedShifts[grade] === 0 ? 192 : 96,
    //             },
    //         ],
    //     }));
    // };

    // const handleDeleteAdditionalSchedule = (grade, index) => {
    //     setEditAdditionalScheds((prevScheds) => ({
    //         ...prevScheds,
    //         [grade]: prevScheds[grade].filter((_, i) => i !== index),
    //     }));
    // };

    // const handleShiftSelection = (grade, shift) => {
    //     setSelectedShifts((prevState) => ({
    //         ...prevState,
    //         [grade]: shift,
    //     }));

    //     const defaultTime = shift === 0 ? morningStartTime : afternoonStartTime;
    //     setStartTimes((prevState) => ({
    //         ...prevState,
    //         [grade]: defaultTime,
    //     }));
    // };

    // // Reset states
    // const resetStates = () => {
    //     setEditProgramId(null);
    //     setEditProgramValue('');
    //     setEditProgramCurr([]);
    //     setStartTimes({
    //         7: '06:00 AM',
    //         8: '06:00 AM',
    //         9: '06:00 AM',
    //         10: '06:00 AM',
    //     });
    //     setSelectedShifts({
    //         7: 0,
    //         8: 0,
    //         9: 0,
    //         10: 0,
    //     });
    //     setEditFixedDays({
    //         7: {},
    //         8: {},
    //         9: {},
    //         10: {},
    //     });
    //     setEditFixedPositions({
    //         7: {},
    //         8: {},
    //         9: {},
    //         10: {},
    //     });
    //     setEditAdditionalScheds({
    //         7: [],
    //         8: [],
    //         9: [],
    //         10: [],
    //     });
    // };

    // Search
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

    // Functions for deletion functionality

    // To handle closing of add program modal
    const handleClose = () => {
        const modal = document.getElementById('add_program_modal');
        if (modal) {
            modal.close();
            setErrorMessage('');
            setErrorField('');
        } else {
            console.error("Modal with ID 'add_program_modal' not found.");
        }
    };

    // const handleConfirmationModalClose = () => {
    //     setSectionDetailsToUpdate({
    //         shiftAndStartTime: false,
    //         fixedScheds: false,
    //         additionalScheds: false,
    //     });

    //     document.getElementById(`confirm_program_edit_modal`).close();
    // };

    return (
        <React.Fragment>
            <div className="">
            
                <div className="flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5">
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
                                    resetStates();
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
                                    resetStates();
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
                                close={handleClose}
                                reduxField={['program', 'subjects']}
                                reduxFunction={addProgram}
                                morningStartTime={morningStartTime}
                                afternoonStartTime={afternoonStartTime}
                                errorMessage={errorMessage}
                                setErrorMessage={setErrorMessage}
                                errorField={errorField}
                                setErrorField={setErrorField}
                                numOfSchoolDays={numOfSchoolDays}
                            />
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="table table-sm table-zebra w-full">
                        <thead>
                            <tr>
                                <th className="w-1/12">#</th>
                                <th className="w-1/12">Program ID</th>
                                <th className="w-1/12">Program</th>
                                <th className="w-5/12">
                                    Shift, Start Time, and Subjects (per year
                                    level)
                                </th>
                                <th className="w-auto">Additional Schedules</th>
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
                                                                    <FixedScheduleMaker
                                                                        key={
                                                                            grade
                                                                        }
                                                                        viewingMode={
                                                                            0
                                                                        }
                                                                        pvs={0}
                                                                        program={
                                                                            editProgramId
                                                                        }
                                                                        grade={
                                                                            grade
                                                                        }
                                                                        selectedSubjects={
                                                                            editProgramCurr[
                                                                                grade
                                                                            ] ||
                                                                            []
                                                                        }
                                                                        fixedDays={
                                                                            editFixedDays[
                                                                                grade
                                                                            ] ||
                                                                            {}
                                                                        }
                                                                        setFixedDays={
                                                                            setEditFixedDays
                                                                        }
                                                                        fixedPositions={
                                                                            editFixedPositions[
                                                                                grade
                                                                            ] ||
                                                                            {}
                                                                        }
                                                                        setFixedPositions={
                                                                            setEditFixedPositions
                                                                        }
                                                                        numOfSchoolDays={
                                                                            numOfSchoolDays
                                                                        }
                                                                    />
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
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {editProgramId === program.id ? (
                                                <>
                                                    <div>
                                                        {[7, 8, 9, 10].map(
                                                            (grade) => (
                                                                <div
                                                                    key={`edit-add-sched-edit-prog(${program.id})-grade(${grade})`}
                                                                    className="mt-2 overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg"
                                                                    style={{
                                                                        scrollbarWidth:
                                                                            'thin',
                                                                        scrollbarColor:
                                                                            '#a0aec0 #edf2f7',
                                                                    }} // Optional for styled scrollbars
                                                                >
                                                                    <div
                                                                        className="flex flex-wrap"
                                                                        style={{
                                                                            position:
                                                                                'sticky',
                                                                            top: 0,
                                                                            zIndex: 1,
                                                                            backgroundColor:
                                                                                'white',
                                                                        }}
                                                                    >
                                                                        <div className="w-9/12 font-bold p-2 border-b border-gray-300">
                                                                            Grade{' '}
                                                                            {
                                                                                grade
                                                                            }
                                                                        </div>
                                                                        <div className="w-3/12 flex justify-center items-center border-b border-gray-300">
                                                                            <button
                                                                                className="w-3/4 bg-green-700 m-2 font-bold text-white rounded-lg hover:bg-green-500"
                                                                                onClick={() =>
                                                                                    handleAddAdditionalSchedule(
                                                                                        grade
                                                                                    )
                                                                                }
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    {editAdditionalScheds[
                                                                        grade
                                                                    ].map(
                                                                        (
                                                                            sched,
                                                                            index
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="flex flex-wrap"
                                                                            >
                                                                                <button
                                                                                    className="w-1/12 border rounded-l-lg bg-blue-200 hover:bg-blue-100 flex items-center justify-center"
                                                                                    onClick={() =>
                                                                                        handleDeleteAdditionalSchedule(
                                                                                            grade,
                                                                                            index
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <RiDeleteBin7Line
                                                                                        size={
                                                                                            15
                                                                                        }
                                                                                    />
                                                                                </button>
                                                                                <div className="w-10/12">
                                                                                    <button
                                                                                        className="w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-gray-200"
                                                                                        onClick={() =>
                                                                                            document
                                                                                                .getElementById(
                                                                                                    `add_additional_sched_modal_1_grade-${grade}_prog-${program.id}_idx-${index}`
                                                                                                )
                                                                                                .showModal()
                                                                                        }
                                                                                    >
                                                                                        {sched.name ||
                                                                                        sched.subject ? (
                                                                                            // Content to show when both are not empty
                                                                                            <>
                                                                                                <p>
                                                                                                    Name:{' '}
                                                                                                    {
                                                                                                        sched.name
                                                                                                    }
                                                                                                </p>
                                                                                                <p>
                                                                                                    Subject:{' '}
                                                                                                    {sched.subject ===
                                                                                                    0
                                                                                                        ? 'N/A'
                                                                                                        : subjects[
                                                                                                              sched
                                                                                                                  .subject
                                                                                                          ]
                                                                                                              .subject}
                                                                                                </p>
                                                                                            </>
                                                                                        ) : (
                                                                                            // Content to show when either is empty
                                                                                            <p>
                                                                                                Untitled
                                                                                                Schedule{' '}
                                                                                                {index +
                                                                                                    1}
                                                                                            </p>
                                                                                        )}
                                                                                    </button>
                                                                                    <AdditionalScheduleForProgram
                                                                                        viewingMode={
                                                                                            1
                                                                                        }
                                                                                        programID={
                                                                                            program.id
                                                                                        }
                                                                                        grade={
                                                                                            grade
                                                                                        }
                                                                                        arrayIndex={
                                                                                            index
                                                                                        }
                                                                                        additionalSchedsOfProgYear={
                                                                                            sched
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div className="w-1/12 text-xs font-bold rounded-r-lg bg-blue-200 hover:bg-blue-100 flex text-center justify-center items-center p-2 cursor-pointer">
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            document
                                                                                                .getElementById(
                                                                                                    `add_additional_sched_modal_0_grade-${grade}_prog-${program.id}_idx-${index}`
                                                                                                )
                                                                                                .showModal()
                                                                                        }
                                                                                    >
                                                                                        <RiEdit2Fill
                                                                                            size={
                                                                                                15
                                                                                            }
                                                                                        />
                                                                                    </button>
                                                                                    <AdditionalScheduleForProgram
                                                                                        viewingMode={
                                                                                            0
                                                                                        }
                                                                                        programID={
                                                                                            program.id
                                                                                        }
                                                                                        grade={
                                                                                            grade
                                                                                        }
                                                                                        arrayIndex={
                                                                                            index
                                                                                        }
                                                                                        numOfSchoolDays={
                                                                                            numOfSchoolDays
                                                                                        }
                                                                                        progYearSubjects={
                                                                                            editProgramCurr[
                                                                                                grade
                                                                                            ]
                                                                                        }
                                                                                        additionalSchedsOfProgYear={
                                                                                            sched
                                                                                        }
                                                                                        setAdditionalScheds={
                                                                                            setEditAdditionalScheds
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        {[7, 8, 9, 10].map(
                                                            (grade) => (
                                                                <div
                                                                    key={`edit-add-sched-view-prog(${program.id})-grade(${grade})`}
                                                                    className="mt-2 overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg"
                                                                    style={{
                                                                        scrollbarWidth:
                                                                            'thin',
                                                                        scrollbarColor:
                                                                            '#a0aec0 #edf2f7',
                                                                    }} // Optional for styled scrollbars
                                                                >
                                                                    <div
                                                                        className="font-bold p-2 border-b border-gray-300"
                                                                        style={{
                                                                            position:
                                                                                'sticky',
                                                                            top: 0,
                                                                            zIndex: 1,
                                                                            backgroundColor:
                                                                                'white',
                                                                        }}
                                                                    >
                                                                        Grade{' '}
                                                                        {grade}
                                                                    </div>
                                                                    {program[
                                                                        grade
                                                                    ]?.additionalScheds.map(
                                                                        (
                                                                            sched,
                                                                            index
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="flex flex-wrap"
                                                                            >
                                                                                <div className="w-1/12 text-xs font-bold bg-blue-100 flex text-center justify-center items-center p-2">
                                                                                    {index +
                                                                                        1}
                                                                                </div>
                                                                                <div className="w-11/12">
                                                                                    <button
                                                                                        className="w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-gray-200"
                                                                                        onClick={() =>
                                                                                            document
                                                                                                .getElementById(
                                                                                                    `add_additional_sched_modal_1_grade-${grade}_prog-${program.id}_idx-${index}`
                                                                                                )
                                                                                                .showModal()
                                                                                        }
                                                                                    >
                                                                                        {sched.name ||
                                                                                        sched.subject ? (
                                                                                            // Content to show when both are not empty
                                                                                            <>
                                                                                                <p>
                                                                                                    Name:{' '}
                                                                                                    {
                                                                                                        sched.name
                                                                                                    }
                                                                                                </p>
                                                                                                <p>
                                                                                                    Subject:{' '}
                                                                                                    {sched.subject ===
                                                                                                    0
                                                                                                        ? 'N/A'
                                                                                                        : subjects[
                                                                                                              sched
                                                                                                                  .subject
                                                                                                          ]
                                                                                                              .subject}
                                                                                                </p>
                                                                                            </>
                                                                                        ) : (
                                                                                            // Content to show when either is empty
                                                                                            <p>
                                                                                                Untitled
                                                                                                Schedule{' '}
                                                                                                {index +
                                                                                                    1}
                                                                                            </p>
                                                                                        )}
                                                                                    </button>
                                                                                    <AdditionalScheduleForProgram
                                                                                        viewingMode={
                                                                                            1
                                                                                        }
                                                                                        programID={
                                                                                            program.id
                                                                                        }
                                                                                        grade={
                                                                                            grade
                                                                                        }
                                                                                        arrayIndex={
                                                                                            index
                                                                                        }
                                                                                        additionalSchedsOfProgYear={
                                                                                            sched
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        {editable && (
                                            <td>
                                            <div className='flex'>

                                            <ProgramEdit 
                                                        className="btn btn-xs btn-ghost text-blue-500"
                                                        program = {program}
                                                        reduxField={['program', 'subjects']}
                                                        reduxFunction={editProgram}
                                                        morningStartTime={morningStartTime}
                                                        afternoonStartTime={afternoonStartTime}
                                                        errorMessage={errorMessage}
                                                        setErrorMessage={setErrorMessage}
                                                        errorField={errorField}
                                                        setErrorField={setErrorField}
                                                        numOfSchoolDays={numOfSchoolDays}
                                                        />
                                                        <DeleteData
                                                            className="btn btn-xs btn-ghost text-red-500"
                                                            id={program.id}
                                                            reduxFunction={removeProgram}
                                                        />

                                            </div>
                                                {/* {editProgramId ===
                                                program.id ? (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline"
                                                            // onClick={() =>
                                                            //     handleSaveProgramEditClick(
                                                            //         program.id
                                                            //     )
                                                            // }
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        `confirm_program_edit_modal`
                                                                    )
                                                                    .showModal()
                                                            }
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline"
                                                            onClick={
                                                                resetStates
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <> */}
                                                        {/* <button
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
                                                        </button> */}

                                                      
                                                    {/* </> */}
                                                {/* )} */}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal for confirming program modifications */}
                {/* <dialog
                    id="confirm_program_edit_modal"
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
                                Your modifications in this program will be saved
                                as well in all associated sections. Please
                                select which section details you would like to
                                update.
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
                                                        shiftAndStartTime: e.target.checked,
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
                                    onClick={handleSaveProgramEditClick}
                                >
                                    Confirm
                                </button>
                                <button
                                    className="btn btn-sm"
                                    onClick={handleConfirmationModalClose}
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
                </dialog> */}
            </div>
        </React.Fragment>
    );
};

export default ProgramListContainer;
