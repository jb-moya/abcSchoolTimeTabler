import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext } from '@dnd-kit/core';
import { produce } from 'immer';

import ContainerSpawn from './containerSpawn';
import DroppableSchedCell from './droppableSchedCell';
import { spawnColors } from './bgColors';
import calculateTotalClass from '../../../utils/calculateTotalClass';
import isEqual from 'lodash.isequal';

import { subscribeToSubjects } from '@features/slice/subject_slice';

const hexToRgba = (hex, alpha) => {
    const [r, g, b] = hex
        .replace(/^#/, '')
        .match(/.{2}/g)
        .map((x) => parseInt(x, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getSubjectsPerPosition = (subs, subjectsStore, numOfSchoolDays, additionalSchedules, days, positions) => {
    const subjs = subs || [];

    let totalNumOfClasses = calculateTotalClass(subjectsStore, subs, numOfSchoolDays);

    let additionalScheduleTotalNumOfClasses = additionalSchedules.reduce((acc, schedule) => {
        let frequency = schedule?.frequency || 0;
        return acc + frequency;
    }, 0);

    let subjectPositionArrayLength = Math.ceil((totalNumOfClasses + additionalScheduleTotalNumOfClasses) / numOfSchoolDays);

    subjectPositionArrayLength += subjectPositionArrayLength >= 10 ? 2 : 1;

    const subjectPositionArray = Array.from({ length: subjectPositionArrayLength }, () => {
        return Array(numOfSchoolDays).fill(0);
    });

    for (let i = 0; i < subjs.length; i++) {
        const subject = subjs[i];

        const fixedDay = days[subject] || [];
        const fixedPos = positions[subject] || [];

        for (let j = 0; j < fixedDay.length; j++) {
            const day = fixedDay[j];
            const pos = fixedPos[j];

            // console.log('🚀 ~ getSubjectsPerPosition ~ day:', day);
            // console.log('🚀 ~ getSubjectsPerPosition ~ pos:', pos);

            if (day === 0 || pos === 0) {
                continue;
            }

            if (subjectPositionArray[pos - 1]?.[day - 1] === undefined) {
                continue;
            }

            subjectPositionArray[pos - 1][day - 1] = subject;
        }
    }

    return subjectPositionArray;
};

const FixedScheduleMaker = ({
    viewingMode = 0,
    pvs = 0,
    program = 0,
    grade = 0,
    section = 0,
    isForSection = false,
    selectedSubjects = [],
    additionalSchedules = [],
    fixedDays = [],
    setFixedDays = () => {},
    fixedPositions = {},
    setFixedPositions = () => {},
    numOfSchoolDays = 0,
}) => {

    const dispatch = useDispatch();

// ==============================================================================

    // const { documents: subjectsStore, loading1, error1 } = fetchDocuments('subjects');
    const { data: subjectsStore, loading1, error1 } = useSelector((state) => state.subjects);

    useEffect(() => {
        dispatch(subscribeToSubjects());
    }, [dispatch]);

// ==============================================================================

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const [editMode, setEditMode] = useState(false);

    const [subs, setSubs] = useState(selectedSubjects);
    const [days, setDays] = useState(fixedDays);
    const [positions, setPositions] = useState(fixedPositions);

    const [subjectsPerPosition, setSubjectsPerPosition] = useState([]);
    const [mergeData, setMergeData] = useState({});

    const [totalTimeslot, setTotalTimeslot] = useState(-1);

    useEffect(() => {
        setSubs(produce(selectedSubjects, (draft) => draft));
        setDays(produce(fixedDays, (draft) => draft));
        setPositions(produce(fixedPositions, (draft) => draft));
    }, [selectedSubjects, fixedDays, fixedPositions]);

    // console.log("🚀 ~ useEffect ~ subjects:", subjects)
    // setSubjectsPerPosition(subjects);

    useEffect(() => {
        const subjects = getSubjectsPerPosition(subs, subjectsStore, numOfSchoolDays, additionalSchedules, days, positions);

        const ranges = findConsecutiveRanges(subjects);

        if (!isEqual(ranges, mergeData)) {
            setMergeData(ranges);
        }
    }, [subs, days, positions, subjectsStore, numOfSchoolDays, additionalSchedules, mergeData]);

    // Initialize days and positions when fixedDays or fixedPositions change
    useEffect(() => {
        if (!subs || subs.length === 0) return;
        let totalNumOfClasses = calculateTotalClass(subjectsStore, subs, numOfSchoolDays);

        let additionalScheduleTotalNumOfClasses = additionalSchedules.reduce((acc, schedule) => {
            let frequency = schedule?.frequency || 0;
            return acc + frequency;
        }, 0);

        let totalTimeRow = Math.ceil((totalNumOfClasses + additionalScheduleTotalNumOfClasses) / numOfSchoolDays);

        totalTimeRow += totalTimeRow >= 10 ? 2 : 1;

        if (totalTimeRow !== totalTimeslot) {
            setTotalTimeslot(totalTimeRow);
        }
    }, [subs, numOfSchoolDays, subjectsStore, additionalSchedules, totalTimeslot]);

    useEffect(() => {
        if (!positions || Object.keys(positions).length === 0) return;
        if (!days || Object.keys(days).length === 0) return;
        if (totalTimeslot === -1) return;

        console.log('total timeslot', totalTimeslot);

        const updatedData = produce({ days: days, positions: positions }, (draft) => {
            Object.entries(draft.positions).forEach(([subjectID, positions]) => {
                positions.forEach((pos, idx) => {
                    if (pos > totalTimeslot) {
                        console.log('AAAAAAAAAAAAAAAAAAAAAA');
                        draft.positions[subjectID][idx] = 0; // Update positions
                        draft.days[subjectID][idx] = 0; // Update days
                    }
                });
            });
        });

        setPositions(updatedData.positions);
        setDays(updatedData.days);

        // setFixedDays(updatedData.days);
        // setFixedPositions(updatedData.positions);
    }, [totalTimeslot, days, positions]);
    // }, [totalTimeslot, days, positions, setFixedDays, setFixedPositions]);

    useEffect(() => {
        console.log('is updating positions', positions);
    }, [positions]);

    // Initialize days and positions when fixedDays or fixedPositions change

    const findConsecutiveRanges = (schedule) => {
        const mergeData = schedule.map((days, idx) => {
            const ranges = [];
            let start = null;
            let currentSubject = null;

            for (let i = 0; i < days.length; i++) {
                if (days[i] !== 0) {
                    if (start === null) {
                        // Start of a new range
                        start = i;
                        currentSubject = days[i];
                    } else if (days[i] !== currentSubject) {
                        // Subject changed, close the current range
                        ranges.push({
                            start: { dayIndex: start, positionIndex: idx },
                            end: { dayIndex: i - 1, positionIndex: idx },
                            subject: currentSubject,
                        });
                        start = i; // Start a new range
                        currentSubject = days[i];
                    }
                } else {
                    if (start !== null) {
                        // End of the current range
                        ranges.push({
                            start: { dayIndex: start, positionIndex: idx },
                            end: { dayIndex: i - 1, positionIndex: idx },
                            subject: currentSubject,
                        });
                        start = null;
                        currentSubject = null;
                    }
                }
            }

            // Add the final range if still open
            if (start !== null) {
                ranges.push({
                    start: { dayIndex: start, positionIndex: idx },
                    end: { dayIndex: days.length - 1, positionIndex: idx },
                    subject: currentSubject,
                });
            }

            return ranges;
        });

        // console.log('mergeData', mergeData);

        return mergeData;
    };

    const handleSave = () => {
        setFixedDays((prev) =>
            produce(prev, (draft) => {
                if (isForSection) {
                    Object.assign(draft, days); // Save only the days directly
                } else {
                    draft[grade] = days; // Save the days for the specific grade
                }
            })
        );
        setFixedPositions((prev) =>
            produce(prev, (draft) => {
                if (isForSection) {
                    Object.assign(draft, positions); // Save only the positions directly
                } else {
                    draft[grade] = positions; // Save the positions for the specific grade
                }
            })
        );

        setEditMode(false);
        document
            .getElementById(
                pvs === 0
                    ? `assign_fixed_sched_modal_prog(${program})-grade(${grade})-view(${viewingMode})`
                    : `assign_fixed_sched_modal_section(${section})-grade(${grade})-view(${viewingMode})`
            )
            .close();
    };

    const handleReset = () => {
        setDays(produce(fixedDays, (draft) => Object.entries(draft).forEach(([subjectID, days]) => days.fill(0))));

        setPositions(
            produce(fixedPositions, (draft) => Object.entries(draft).forEach(([subjectID, positions]) => positions.fill(0)))
        );
    };

    const handleCancel = () => {
        setSubs(produce(selectedSubjects, (draft) => draft));
        setDays(produce(fixedDays, (draft) => draft));
        setPositions(produce(fixedPositions, (draft) => draft));
    };

    const handleClose = () => {
        setEditMode(false);
        document
            .getElementById(
                pvs === 0
                    ? `assign_fixed_sched_modal_prog(${program})-grade(${grade})-view(${viewingMode})`
                    : `assign_fixed_sched_modal_section(${section})-grade(${grade})-view(${viewingMode})`
            )
            .close();
    };

    const toggleViewMode = () => {
        setEditMode(!editMode);
    };

    // DRAG AND DROP
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const draggedSubjectID = active.data.current.subjectID;
        const targetContainerID = over.data.current.subjectID;

        // Dragged and target container details
        const { grade: draggedGrade, dayIdx: draggedDay, posIdx: draggedPos } = active.data.current;
        const { day: targetDay, position: targetPos } = over.data.current;

        // Skip if dragged item is being dropped on itself or an invalid container
        if (draggedSubjectID !== targetContainerID && targetContainerID !== -1) return;

        // console.log('subjectsPerPosition', subjectsPerPosition);

        // Helper function to count slots
        const countSlots = (subs, key, otherKey, targetValue, excludedValue) =>
            subs.reduce((count, subID) => {
                const items = key === 'days' ? days[subID] : positions[subID];
                return (
                    count +
                    items.filter((item, idx) => item === targetValue && targetValue !== excludedValue && targetValue !== 0).length
                );
            }, 0);

        // Calculate slots with your conditions
        const daySlots = countSlots(subs, 'days', 'positions', targetDay, days[draggedSubjectID]?.[draggedDay]);
        const positionSlots = countSlots(subs, 'positions', 'days', targetPos, positions[draggedSubjectID]?.[draggedDay]);

        // Validate slots
        if (daySlots === totalTimeslot && positionSlots >= numOfSchoolDays) {
            alert(`No spots left in ${dayNames[targetDay - 1]} and position ${targetPos}.`);
            return;
        }
        if (daySlots === totalTimeslot) {
            alert(`No spots left in ${dayNames[targetDay - 1]}.`);
            return;
        }
        if (positionSlots >= numOfSchoolDays) {
            alert(`No spots left in position ${targetPos}.`);
            return;
        }

        // Check if the target spot is occupied
        const isOccupied = subs.some((subID) =>
            days[subID]?.some(
                (day, idx) => day === targetDay && positions[subID]?.[idx] === targetPos && targetDay !== 0 && targetPos !== 0
            )
        );

        // console.log('targetPos', targetPos);
        // console.log('targetDay', targetDay);

        if (isOccupied) {
            // alert('This spot is already taken!');
            return;
        }

        // Update state
        setDays((prev) => {
            const updatedDays = { ...prev };

            updatedDays[draggedSubjectID] = [...(prev[draggedSubjectID] || [])];

            updatedDays[draggedSubjectID][draggedDay] = targetDay;
            return updatedDays;
        });

        setPositions((prev) => {
            const updatedPositions = { ...prev };

            updatedPositions[draggedSubjectID] = [...(prev[draggedSubjectID] || [])];

            updatedPositions[draggedSubjectID][draggedDay] = targetPos;
            return updatedPositions;
        });
    };

    return (
        <dialog
            id={
                pvs === 0
                    ? `assign_fixed_sched_modal_prog(${program})-grade(${grade})-view(${viewingMode})`
                    : `assign_fixed_sched_modal_section(${section})-grade(${grade})-view(${viewingMode})`
            }
            className='modal sm:modal-middle '
            onClose={() => {
                handleCancel();
                handleClose();
            }}
        >
            <div
                className='modal-box relative overflow-hidden'
                style={{
                    width: '80%',
                    maxWidth: 'none',
                }}
            >
                <div className='px-3 flex items-center mb-10'>
                    <div className='text-2xl font-bold'>Fixed Schedules</div>

                    {viewingMode === 0 && (
                        <div className='pl-4 flex items-center justify-center space-x-2 m-3 text-base'>
                            <div>View</div>
                            <input
                                type='checkbox'
                                className='toggle toggle-success toggle-lg'
                                checked={editMode}
                                onChange={toggleViewMode}
                            />
                            <div>Edit</div>
                        </div>
                    )}

                    {editMode && (
                        <div className='ml-auto pr-10 flex gap-3 justify-center'>
                            <button className='btn btn-accent' onClick={handleReset}>
                                Reset
                            </button>
                            <button className='btn btn-primary' onClick={handleSave}>
                                Save
                            </button>
                            <button
                                className='btn'
                                onClick={() => {
                                    handleCancel();
                                    handleClose();
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className=' max-h-[60vh] max-w-full text-sm  overflow-auto'>
                    <DndContext onDragEnd={handleDragEnd}>
                        <div className='flex gap-10 justify-center'>
                            <div className='flex flex-col w-6/12'>
                                {/* Spawn point(s) for subject blocks */}
                                <div className='font-bold'>Subjects</div>
                                {subs?.map((subject, index) => (
                                    <div
                                        className='my-2 rounded-lg '
                                        key={`g${grade}-s${subject}`}
                                        style={{
                                            backgroundColor: hexToRgba(spawnColors[index % spawnColors.length], 0.1),
                                            borderWidth: '2px', // Width of the left border
                                            borderLeftStyle: 'solid', // Style of the border (solid, dashed, dotted, etc.)
                                            borderColor: spawnColors[index % spawnColors.length],
                                        }}
                                    >
                                        <div className='w-12/12'>
                                            
                                            <ContainerSpawn
                                                key={`spawn-g${grade}-s${subject}`}
                                                editMode={editMode}
                                                subjectID={subject}
                                                position={0}
                                                day={0}
                                                grade={grade}
                                                colorIndex={index}
                                                selectedSubjects={subs}
                                                fixedDays={days}
                                                fixedPositions={positions}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={`min-w-max ${editMode ? '' : ''}`}>
                                <div>
                                    {/* Header */}
                                    {subs?.length > 0 && (
                                        <div className='grid grid-cols-6 gap-0'>
                                            <div className='w-20 h-7 font-bold'></div>
                                            {Array.from({
                                                length: numOfSchoolDays,
                                            }).map((_, i) => {
                                                const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                                const dayName = daysOfWeek[i % 7]; // Handle wrap-around for more than 7 days

                                                return (
                                                    <div
                                                        key={i}
                                                        className='w-20 bg-blue-900 border border-gray-400 border-opacity-50 flex items-center justify-center text-white font-bold'
                                                    >
                                                        {dayName}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {/* Schedule */}
                                    {Array.from({
                                        length: totalTimeslot,
                                    }).map((_, subIndex) => (
                                        <div key={subIndex} className='grid grid-cols-6 gap-0'>
                                            <div className='w-20 h-14 bg-blue-700 text-white font-bold border border-gray-400 border-opacity-50 flex items-center justify-center'>
                                                {subIndex + 1}
                                            </div>

                                            {/* Droppable cells for schedule */}
                                            {Array.from({
                                                length: numOfSchoolDays,
                                            }).map((_, index) => (
                                                <DroppableSchedCell
                                                    key={`drop-g${grade}-d${index}-p${subIndex}`}
                                                    editMode={editMode}
                                                    subjectID={-1}
                                                    day={index + 1}
                                                    position={subIndex + 1}
                                                    grade={grade}
                                                    mergeData={mergeData[subIndex]}
                                                    totalTimeslot={totalTimeslot}
                                                    selectedSubjects={subs}
                                                    fixedDays={days}
                                                    fixedPositions={positions}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DndContext>
                </div>

                <div className='modal-action w-full'>
                    <button className='btn btn-lg btn-circle btn-ghost absolute right-2 top-2' onClick={handleClose}>
                        ✕
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default FixedScheduleMaker;
