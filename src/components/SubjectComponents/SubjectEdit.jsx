import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { RiEdit2Fill } from 'react-icons/ri';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';

import { fetchPrograms, editProgram } from '@features/programSlice';
import { fetchSections, editSection } from '@features/sectionSlice';
import { fetchSubjects } from '@features/subjectSlice';

import calculateTotalClass from '../../utils/calculateTotalClass';
import { getTimeSlotIndex } from '@utils/timeSlotMapper';

const SubjectEdit = ({
    subject,
    reduxFunction,
    setErrorMessage,
    errorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays,
    breakTimeDuration,
}) => {

    const inputNameRef = useRef(null);
    const dispatch = useDispatch();

// =============================================================================

// =============================================================================

    const { subjects, status: subjectStatus } = useSelector((state) => state.subject);

    const { programs, status: programStatus } = useSelector(
        (state) => state.program
    );
    
    const { sections, status: sectionStatus } = useSelector(
        (state) => state.section
    );

// =============================================================================

    const [editSubjectId, setEditSubjectId] = useState('');
    const [editSubjectValue, setEditSubjectValue] = useState('');
    const [editClassDuration, setEditClassDuration] = useState(0);
    const [editSubjectWeeklyMinutes, setEditSubjectWeeklyMinutes] = useState(0);

    useEffect(() => {
        if (subject) {
            setEditSubjectId(subject.id || '');
            setEditSubjectValue(subject.subject || '');
            setEditClassDuration(subject.classDuration || 0);
            setEditSubjectWeeklyMinutes(subject.weeklyMinutes || 0);
        }
    }, [subject]);

    useEffect(() => {
        console.log('editSubjectId:', editSubjectId);
        console.log('editSubjectValue:', editSubjectValue);
        console.log('editClassDuration:', editClassDuration);
        console.log('editSubjectWeeklyMinutes:', editSubjectWeeklyMinutes);
    }, [
        editSubjectId,
        editSubjectValue,
        editClassDuration,
        editSubjectWeeklyMinutes,]);

// =============================================================================

    const handleEditSubject = () => {

        console.log('editSubjectId:', editSubjectId);
        console.log('editSubjectValue:', editSubjectValue);
        console.log('editClassDuration:', editClassDuration);
        console.log('editSubjectWeeklyMinutes:', editSubjectWeeklyMinutes);

        if (!editSubjectValue.trim()) {
            setErrorMessage('Subject name cannot be empty');
            setErrorField('name');
            return;
        }
        if (!editClassDuration) {
            setErrorMessage('Class duration cannot be empty');
            setErrorField('duration');
            return;
        }
        if (!editSubjectWeeklyMinutes) {
            setErrorMessage('Weekly time requirement cannot be empty');
            setErrorField('weeklyMinutes');
            return;
        }

        if (editSubjectValue.trim().toLowerCase() !== subject.subject.trim().toLowerCase()) {
            const isDuplicate = Object.values(subjects).some(
                (existingSubject) =>
                    existingSubject.subject.trim().toLowerCase() === editSubjectValue.trim().toLowerCase()
            );
            if (isDuplicate) {
                setErrorMessage('A subject with this name already exists.');
                setErrorField('name');
                return;
            }
        }

        dispatch(
            reduxFunction({
                subjectId: editSubjectId,
                updatedSubject: {
                    subject: editSubjectValue,
                    classDuration: editClassDuration,
                    weeklyMinutes: editSubjectWeeklyMinutes,
                },
            })
        );

        updateSubjectDependencies();

        toast.success('Data and dependencies updated successfully!', {
            style: {
                backgroundColor: '#28a745',
                color: '#fff',
                borderColor: '#28a745',
            },
        });

        handleReset();
        closeModal();
    };

    const updateSubjectDependencies = () => {
        if (Object.keys(programs).length === 0) return;

        // Update subject dependencies in PROGRAMS
        Object.entries(programs).forEach(([id, program]) => {
            const originalProgram = JSON.parse(JSON.stringify(program));
            const newProgram = JSON.parse(JSON.stringify(program));

            [7, 8, 9, 10].forEach((grade) => {
                if (!newProgram[grade].subjects.length === 0) return;

                if (!newProgram[grade].subjects.includes(editSubjectId)) return;

                // =============== Update program start and end time ===============

                    const startTimeIdx = newProgram[grade].startTime;
                    const breakTimeCount = newProgram[grade].subjects.length > 10 ? 2 : 1;
        
                    let totalDuration = breakTimeCount * breakTimeDuration;

                    newProgram[grade].subjects.forEach((subId) => {
                        if (subId === editSubjectId) {
                            totalDuration += editClassDuration;
                        } else {
                            totalDuration += subjects[subId].classDuration;
                        }  
                    });

                    console.log('totalDuration', totalDuration);

                    const endTimeIdx = Math.ceil(totalDuration / 5) + startTimeIdx;

                    newProgram[grade].endTime = endTimeIdx || 216; // 216 = 6:00 PM

                // =============== Update program fixed days and positons ===============

                    const newTotalTimeslot = calculateTotalClass(
                        {
                            ...subjects,
                            [editSubjectId]: {
                                ...subjects[editSubjectId],
                                subject: editSubjectValue,
                                classDuration: editClassDuration,
                                weeklyMinutes: editSubjectWeeklyMinutes,
                            },
                        },
                        newProgram[grade].subjects,
                        numOfSchoolDays
                    );

                    Object.entries(newProgram[grade].fixedPositions).forEach(
                        ([subjectId, fixedPosition]) => {
                            fixedPosition.forEach((item, i) => {
                                if (item > newTotalTimeslot) {
                                    fixedPosition[i] = 0;
                                    newProgram[grade].fixedDays[subjectId][i] = 0;
                                }
                            });
                        }
                    );

                    let dayTimeSlots = {};
                    let positionTimeSlots = {};

                    for (let subjectID of newProgram[grade].subjects) {
                        const { fixedDays, fixedPositions } = newProgram[grade];

                        fixedDays[subjectID].forEach((day, i) => {
                            const position = fixedPositions[subjectID][i];

                            if (day || position) { // Only process non-zero day or position
                                dayTimeSlots[day] ??= newTotalTimeslot; // Use nullish coalescing assignment
                                positionTimeSlots[position] ??= numOfSchoolDays;
                            }
                        });
                    }

                    // Loop through all subjects of the year level
                    for (let subjectID of newProgram[grade].subjects) {
                        // Retrieve the number of classes allowed for the subject
                        let numOfClasses = 0;
                        if (subjectID === editSubjectId) {
                            numOfClasses = Math.min(
                                Math.ceil(
                                    editSubjectWeeklyMinutes / editClassDuration
                                ),
                                numOfSchoolDays
                            );
                        } else {
                            numOfClasses = Math.min(
                                Math.ceil(
                                    subjects[subjectID].weeklyMinutes /
                                    subjects[subjectID].classDuration
                                ),
                                numOfSchoolDays
                            );
                        }
                        console.log('grade', grade);
                        console.log('subjectID', subjectID);
                        console.log('numOfClasses', numOfClasses);

                        const fixedDays = newProgram[grade].fixedDays[subjectID];
                        const fixedPositions =
                            newProgram[grade].fixedPositions[subjectID];

                        console.log('fixedDays', fixedDays);
                        console.log('fixedPositions', fixedPositions);

                        // Use hash maps to quickly look up subjects and day-position pairs
                        const dayPositionMap = new Map();

                        fixedDays.forEach((day, index) => {
                            const pos = fixedPositions[index];
                            console.log('day', day);
                            console.log('pos', pos);
                            if (
                                (
                                    (day !== 0 && pos === 0) ||
                                    (day === 0 && pos !== 0) ||
                                    (day !== 0 && pos !== 0)) &&
                                !dayPositionMap.has(`${day}-${pos}`
                                )
                            ) {
                                dayPositionMap.set(`${day}-${pos}`, [day, pos]);
                            }
                        });

                        console.log('dayPositionMap', dayPositionMap);

                        // Now we process the day-position pairs efficiently
                        let result = [];
                        dayPositionMap.forEach(([day, pos]) => {
                            if (result.length < numOfClasses && dayTimeSlots[day] > 0 && positionTimeSlots[pos] > 0) {
                                result.push([day, pos]);
                                dayTimeSlots[day]--;
                                positionTimeSlots[pos]--;
                            }
                        });

                        console.log('result', result);

                        // Pad with [0, 0] if necessary
                        while (result.length < numOfClasses) {
                            result.push([0, 0]);
                        }

                        // Split the combined array back into fixedDays and fixedPositions
                        newProgram[grade].fixedDays[subjectID] = result.map(
                            ([day]) => day
                        );
                        newProgram[grade].fixedPositions[subjectID] = result.map(
                            ([_, pos]) => pos
                        );
                    }
            });

            const updateProgramDetails = (newProgram, grade) => ({
                subjects: newProgram[grade].subjects,
                fixedDays: newProgram[grade].fixedDays,
                fixedPositions: newProgram[grade].fixedPositions,
                shift: newProgram[grade].shift,
                startTime: getTimeSlotIndex(
                    newProgram[grade].startTime || newProgram[grade].shift === 0 ? '06:00 AM' : '01:00 PM'
                ),
                endTime: newProgram[grade].endTime, 
                additionalScheds: newProgram[grade].additionalScheds,
            });

            // console.log('updated newProgram', newProgram);

            if (originalProgram !== newProgram) {
                dispatch(
                    editProgram({
                        programId: newProgram.id,
                        updatedProgram: {
                            program: newProgram.program,
                            ...[7, 8, 9, 10].reduce((grades, grade) => {
                                grades[grade] = updateProgramDetails(newProgram, grade);
                                return grades;
                            }, {}),
                        },
                    })
                );
            } else {
                console.log('no changes');
            }
        });

        if (Object.keys(sections).length === 0) return;

        // Update subject dependencies in SECTIONS
        Object.entries(sections).forEach(([id, section]) => {
            const originalSection = JSON.parse(JSON.stringify(section));
            const newSection = JSON.parse(JSON.stringify(section));

            if (!newSection.subjects.includes(editSubjectId)) return;

            // =============== Update section start and end time ===============

                const startTimeIdx = newSection.startTime;
                const breakTimeCount = newSection.subjects.length > 10 ? 2 : 1;

                let totalDuration = breakTimeCount * breakTimeDuration;

                newSection.subjects.forEach((subId) => {
                    if (subId === editSubjectId) {
                        totalDuration += editClassDuration;
                    } else {
                        totalDuration += subjects[subId].classDuration;
                    }  
                });

                console.log('totalDuration', totalDuration);

                const endTimeIdx = Math.ceil(totalDuration / 5) + startTimeIdx;

                newSection.endTime = endTimeIdx || 216; // 216 = 6:00 PM

            // =============== Update section fixed days and positions ===============

            const originalTotalClass = calculateTotalClass(subjects, newSection.subjects, numOfSchoolDays);

            const originalTotalTimeslot = Math.ceil(originalTotalClass / numOfSchoolDays);

            const newTotalClass = calculateTotalClass(
                {
                    ...subjects,
                    [editSubjectId]: {
                        ...subjects[editSubjectId],
                        subject: editSubjectValue,
                        classDuration: editClassDuration,
                        weeklyMinutes: editSubjectWeeklyMinutes,
                    },
                },
                newSection.subjects,
                numOfSchoolDays
            );

            const newTotalTimeslot = Math.ceil(newTotalClass / numOfSchoolDays);

            if (newTotalTimeslot < originalTotalTimeslot) {
                Object.entries(newSection.fixedPositions).forEach(([subjectId, fixedPosition]) => {
                    fixedPosition.forEach((item, i) => {
                        if (item > newTotalTimeslot) {
                            fixedPosition[i] = 0;
                            newSection.fixedDays[subjectId][i] = 0;
                        } // reset all positions to zero if timeslot is removed
                    });
                });
            }

            const numOfClasses = Math.min(Math.ceil(editSubjectWeeklyMinutes / editClassDuration), numOfSchoolDays);

            const fixedDays = newSection.fixedDays[editSubjectId];
            const fixedPositions = newSection.fixedPositions[editSubjectId];

            let dayTimeSlots = {};
            let positionTimeSlots = {};

            for (let subjectID of newSection.subjects) {
                const { fixedDays, fixedPositions } = newSection;

                fixedDays[subjectID].forEach((day, i) => {
                    const position = fixedPositions[subjectID][i];

                    if (day || position) {
                        // Only process non-zero day or position
                        dayTimeSlots[day] ??= newTotalTimeslot; // Use nullish coalescing assignment
                        positionTimeSlots[position] ??= numOfSchoolDays;
                    }
                });
            }

            // Use hash maps to quickly look up subjects and day-position pairs
            const dayPositionMap = new Map();

            fixedDays.forEach((day, index) => {
                const pos = fixedPositions[index];
                if (
                    ((day !== 0 && pos === 0) || (day === 0 && pos !== 0) || (day !== 0 && pos !== 0)) &&
                    !dayPositionMap.has(`${day}-${pos}`)
                ) {
                    dayPositionMap.set(`${day}-${pos}`, [day, pos]);
                }
            });

            // Now we process the day-position pairs efficiently
            let result = [];
            dayPositionMap.forEach(([day, pos]) => {
                if (result.length < numOfClasses && dayTimeSlots[day] > 0 && positionTimeSlots[pos] > 0) {
                    result.push([day, pos]);
                    dayTimeSlots[day] -= 1;
                    positionTimeSlots[pos] -= 1;
                }
            });

            console.log('fafaf dayPositionMap', dayPositionMap);

            // Pad with [0, 0] if necessary
            while (result.length < numOfClasses) {
                result.push([0, 0]);
            }

            // Split the combined array back into fixedDays and fixedPositions
            newSection.fixedDays[editSubjectId] = result.map(([day]) => day);
            newSection.fixedPositions[editSubjectId] = result.map(([_, pos]) => pos);

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
                            startTime: getTimeSlotIndex(newSection.startTime || '06:00 AM'),
                        },
                    })
                );
            }
        });
    };

    const handleReset = () => {
        setEditSubjectId(subject.id || '');
        setEditSubjectValue(subject.subject || '');
        setEditClassDuration(subject.classDuration || 0);
        setEditSubjectWeeklyMinutes(subject.weeklyMinutes || 0);

        setErrorMessage('');
        setErrorField('');
    };

    const closeModal = () => {
        const modalCheckbox = document.getElementById(`edit_modal_${subject.id}`);
        if (modalCheckbox) {
            modalCheckbox.checked = false; // Uncheck the modal toggle
        }
        handleReset();
    };

// =============================================================================

    useEffect(() => {
        if (subjectStatus === 'idle') {
            dispatch(fetchSubjects());
        }
    }, [subjectStatus, dispatch]);

    useEffect(() => {
        if (programStatus === 'idle') {
            dispatch(fetchPrograms());
        }
    }, [programStatus, dispatch]);
    
    useEffect(() => {
        if (sectionStatus === 'idle') {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

// =============================================================================

    return (
        <div className='flex items-center justify-center'>
            {/* Trigger Button */}
            <label htmlFor={`edit_modal_${subject.id}`} className='btn btn-xs btn-ghost text-blue-500'>
                <RiEdit2Fill size={20} />
            </label>

            {/* Modal */}
            <input type='checkbox' id={`edit_modal_${subject.id}`} className='modal-toggle' />
            <div className='modal'>
                <div className='modal-box relative'>
                    <label onClick={closeModal} className='btn btn-sm btn-circle absolute right-2 top-2'>
                        ✕
                    </label>
                    <h3 className='flex justify-center text-lg font-bold mb-4'>Edit Subject</h3>
                    <hr className='mb-4'></hr>

                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-2'>Subject Name:</label>
                        <input
                            type="text"
                            className={`input input-bordered w-full ${errorField === 'name' ? 'border-red-500' : ''
                                }`}
                            value={editSubjectValue}
                            onChange={(e) => setEditSubjectValue(e.target.value)}
                            placeholder="Enter subject name"
                            ref={inputNameRef}
                        />
                    </div>

                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-2'>Class Duration (minutes):</label>
                        <input
                            type="number"
                            className={`input input-bordered w-full ${errorField === 'duration' ? 'border-red-500' : ''
                                }`}
                            value={editClassDuration}
                            onChange={(e) => setEditClassDuration(Number(e.target.value))}
                            placeholder="Enter class duration"
                            step={5}
                            min={10}
                        />
                    </div>

                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-2'>Weekly Time Requirement (minutes):</label>
                        <input
                            type="number"
                            className={`input input-bordered w-full ${errorField === 'weeklyMinutes' ? 'border-red-500' : ''
                                }`}
                            value={editSubjectWeeklyMinutes}
                            onChange={(e) => setEditSubjectWeeklyMinutes(Number(e.target.value))}
                            placeholder="Enter weekly minutes"
                            step={5}
                        />
                    </div>

                    {errorMessage && <p className='flex justify-center text-red-500 text-sm my-4 font-medium'>{errorMessage}</p>}

                    <div className='flex justify-center gap-2'>
                        <button className='btn btn-primary' onClick={handleEditSubject}>
                            Update Subject
                        </button>
                        <button className='btn btn-error' onClick={handleReset}>
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectEdit;
