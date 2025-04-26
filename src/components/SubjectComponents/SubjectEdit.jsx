import { useState, useEffect, useRef } from 'react';
import { RiEdit2Fill } from 'react-icons/ri';
import { toast } from 'sonner';

import { useEditDocument } from '../../hooks/firebaseCRUD/useEditDocument';

import calculateTotalClass from '../../utils/calculateTotalClass';
import { COLLECTION_ABBREVIATION } from '../../constants';
import { useSelector } from 'react-redux';
import LoadingButton from '../LoadingButton';

const SubjectEdit = ({
    // STORES
    subjects,
    programs,
    sections,
    // STORES

    subject,
    setErrorMessage,
    errorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays = 5,
    breakTimeDuration,
}) => {
    const { editDocument, loading: isEditLoading, error: editError } = useEditDocument();

    const inputNameRef = useRef(null);
    const { user: currentUser } = useSelector((state) => state.user);

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

    // =============================================================================

    const handleEditSubject = async () => {
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
                (existingSubject) => existingSubject.subject.trim().toLowerCase() === editSubjectValue.trim().toLowerCase()
            );
            if (isDuplicate) {
                setErrorMessage('A subject with this name already exists.');
                setErrorField('name');
                return;
            }
        }

        try {
            await editDocument({
                collectionName: 'subjects',
                collectionAbbreviation: COLLECTION_ABBREVIATION.SUBJECTS,
                userName: currentUser?.username || 'unknown user',
                itemName: 'an item',
                docId: editSubjectId,
                entryData: {
                    // subject: editSubjectValue,
                    s: editSubjectValue,
                    // classDuration: editClassDuration,
                    cd: editClassDuration,
                    // weeklyMinutes: editSubjectWeeklyMinutes,
                    wm: editSubjectWeeklyMinutes,
                },
            });

            updateSubjectDependencies();
        } catch {
            toast.error('Something went wrong. Please try again.');
            console.error('Something went wrong. Please try again.');
        } finally {
            toast.success('Data and dependencies updated successfully!', {
                style: {
                    backgroundColor: '#28a745',
                    color: '#fff',
                    borderColor: '#28a745',
                },
            });

            handleReset();
            closeModal();
        }
    };

    const updateSubjectDependencies = async () => {
        if (Object.keys(programs).length === 0) return;

        // Update subject dependencies in PROGRAMS
        for (const [id, program] of Object.entries(programs)) {
            const originalProgram = JSON.parse(JSON.stringify(program));
            const newProgram = JSON.parse(JSON.stringify(program));

            const program_id = program?.id || '';

            [7, 8, 9, 10].forEach((grade) => {
                if (!newProgram[grade].subjects.length === 0) return;

                if (!newProgram[grade].subjects.includes(editSubjectId)) return;

                console.log(`newProgram[${grade}]: `, newProgram[grade]);

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

                Object.entries(newProgram[grade].fixedPositions).forEach(([subjectId, fixedPosition]) => {
                    fixedPosition.forEach((item, i) => {
                        if (item > newTotalTimeslot) {
                            fixedPosition[i] = 0;
                            newProgram[grade].fixedDays[subjectId][i] = 0;
                        }
                    });
                });

                let dayTimeSlots = {};
                let positionTimeSlots = {};

                for (let subjectID of newProgram[grade].subjects) {
                    const { fixedDays, fixedPositions } = newProgram[grade];

                    console.log(`fixedDays[${subjectID}]: `, fixedDays[subjectID]);

                    fixedDays[subjectID].forEach((day, i) => {
                        const position = fixedPositions[subjectID][i];

                        if (day || position) {
                            // Only process non-zero day or position
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
                        numOfClasses = Math.min(Math.ceil(editSubjectWeeklyMinutes / editClassDuration), numOfSchoolDays);
                    } else {
                        numOfClasses = Math.min(
                            Math.ceil(subjects[subjectID].weeklyMinutes / subjects[subjectID].classDuration),
                            numOfSchoolDays
                        );
                    }

                    const fixedDays = newProgram[grade].fixedDays[subjectID];
                    const fixedPositions = newProgram[grade].fixedPositions[subjectID];

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
                            dayTimeSlots[day]--;
                            positionTimeSlots[pos]--;
                        }
                    });

                    // Pad with [0, 0] if necessary
                    while (result.length < numOfClasses) {
                        result.push([0, 0]);
                    }

                    // Split the combined array back into fixedDays and fixedPositions
                    newProgram[grade].fixedDays[subjectID] = result.map(([day]) => day);
                    newProgram[grade].fixedPositions[subjectID] = result.map(([_, pos]) => pos);
                }
            });

            if (originalProgram !== newProgram) {
                const schedules = {
                    7: [],
                    8: [],
                    9: [],
                    10: [],
                };

                [7, 8, 9, 10].forEach((grade) => {
                    schedules[grade] = newProgram[grade].additionalScheds.map((sched) => ({
                        n: sched.name,
                        su: sched.subject,
                        d: sched.duration,
                        f: sched.frequency,
                        sh: sched.shown,
                    }));
                });

                const updatedData = {
                    p: newProgram.program,
                    7: {
                        s: newProgram[7].subjects,
                        fd: newProgram[7].fixedDays,
                        fp: newProgram[7].fixedPositions,
                        sh: newProgram[7].shift,
                        st: newProgram[7].startTime,
                        et: newProgram[7].endTime,
                        m: newProgram[7].modality,
                        as: schedules[7],
                    },
                    8: {
                        s: newProgram[8].subjects,
                        fd: newProgram[8].fixedDays,
                        fp: newProgram[8].fixedPositions,
                        sh: newProgram[8].shift,
                        st: newProgram[8].startTime,
                        et: newProgram[8].endTime,
                        m: newProgram[8].modality,
                        as: schedules[8],
                    },
                    9: {
                        s: newProgram[9].subjects,
                        fd: newProgram[9].fixedDays,
                        fp: newProgram[9].fixedPositions,
                        sh: newProgram[9].shift,
                        st: newProgram[9].startTime,
                        et: newProgram[9].endTime,
                        m: newProgram[9].modality,
                        as: schedules[9],
                    },
                    10: {
                        s: newProgram[10].subjects,
                        fd: newProgram[10].fixedDays,
                        fp: newProgram[10].fixedPositions,
                        sh: newProgram[10].shift,
                        st: newProgram[10].startTime,
                        et: newProgram[10].endTime,
                        m: newProgram[10].modality,
                        as: schedules[10],
                    },
                };

                await editDocument({
                    collectionName: 'programs',
                    collectionAbbreviation: COLLECTION_ABBREVIATION.PROGRAMS,
                    userName: currentUser?.username || 'unknown user',
                    itemName: 'an item',
                    docId: program_id,
                    entryData: updatedData,
                });
            } else {
                console.log('no changes');
            }
        }

        if (Object.keys(sections).length === 0) return;

        // Update subject dependencies in SECTIONS
        for (const [id, section] of Object.entries(sections)) {
            const originalSection = JSON.parse(JSON.stringify(section));
            const newSection = JSON.parse(JSON.stringify(section));

            const section_id = sections[id]?.id || '';

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
                const section_schedules = newSection.additionalScheds.map((sched) => ({
                    n: sched.name,
                    su: sched.subject,
                    d: sched.duration,
                    f: sched.frequency,
                    sh: sched.shown,
                }));

                const updatedData = {
                    t: newSection.teacher,
                    p: newSection.program,
                    s: newSection.section,
                    ss: newSection.subjects,
                    fd: newSection.fixedDays,
                    fp: newSection.fixedPositions,
                    y: newSection.year,
                    sh: newSection.shift,
                    st: newSection.startTime,
                    et: newSection.endTime,
                    as: section_schedules,
                };

                await editDocument({
                    collectionName: 'sections',
                    collectionAbbreviation: COLLECTION_ABBREVIATION.SECTIONS,
                    userName: currentUser?.username || 'unknown user',
                    itemName: 'an item',
                    docId: section_id,
                    entryData: updatedData,
                });
            }
        }
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
                            type='text'
                            className={`input input-bordered w-full ${errorField === 'name' ? 'border-red-500' : ''}`}
                            value={editSubjectValue}
                            onChange={(e) => setEditSubjectValue(e.target.value)}
                            placeholder='Enter subject name'
                            ref={inputNameRef}
                        />
                    </div>

                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-2'>Class Duration (minutes):</label>
                        <input
                            type='number'
                            className={`input input-bordered w-full ${errorField === 'duration' ? 'border-red-500' : ''}`}
                            value={editClassDuration}
                            onChange={(e) => setEditClassDuration(Number(e.target.value))}
                            placeholder='Enter class duration'
                            step={5}
                            min={10}
                        />
                    </div>

                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-2'>Weekly Time Requirement (minutes):</label>
                        <input
                            type='number'
                            className={`input input-bordered w-full ${errorField === 'weeklyMinutes' ? 'border-red-500' : ''}`}
                            value={editSubjectWeeklyMinutes}
                            onChange={(e) => setEditSubjectWeeklyMinutes(Number(e.target.value))}
                            placeholder='Enter weekly minutes'
                            step={5}
                        />
                    </div>

                    {errorMessage && <p className='flex justify-center text-red-500 text-sm my-4 font-medium'>{errorMessage}</p>}

                    <div className='flex justify-center gap-2'>
                        <LoadingButton
                            onClick={handleEditSubject}
                            disabled={isEditLoading}
                            isLoading={isEditLoading}
                            loadingText='Updating Subject...'
                            className='btn btn-primary'
                        >
                            Update Subject
                        </LoadingButton>

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
