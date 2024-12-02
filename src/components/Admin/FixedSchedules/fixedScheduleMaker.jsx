import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { DndContext } from '@dnd-kit/core';
import { produce } from "immer";

import ContainerSpawn  from './containerSpawn';
import DroppableSchedCell from './droppableSchedCell';
import { ReserveDay, ReservePosition } from './reservation';
import { darkColors } from './bgColors';

const FixedScheduleMaker = ({
    addingMode,

    isForSection = false,

    selectedSubjects,
    fixedDays, setFixedDays,
    fixedPositions, setFixedPositions,
    grade,
    numOfSchoolDays,
}) => {

    const subjects = useSelector((state) => state.subject.subjects);

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const [editMode, setEditMode] = useState(false);

    const [subs, setSubs] = useState([]);
    const [days, setDays] =  useState({});
    const [positions, setPositions] =  useState({}); 

    const [subjectsPerPosition, setSubjectsPerPosition] = useState([]);
    const [mergeData, setMergeData] = useState({});

    // Initialize days and positions when fixedDays or fixedPositions change
    useEffect(() => {
        const subjects = getSubjectsPerPosition();
        setSubjectsPerPosition(subjects);
    
        const ranges = findConsecutiveRanges(subjects);
        setMergeData(ranges);
    }, [subs, days, positions]);

    useEffect(() => {
        setSubs(produce(selectedSubjects, (draft) => draft));
        setDays(produce(fixedDays, (draft) => draft));
        setPositions(produce(fixedPositions, (draft) => draft));
    }, [selectedSubjects, fixedDays, fixedPositions]);

    const getSubjectsPerPosition = () => {
        const subjs = subs || [];

        const subjectPositionArray = subs.map(() => {
            return Array(parseInt(numOfSchoolDays, 10)).fill(0);
        });

        for (let i = 0; i < subjs.length; i++) {
            const subject = subjs[i];
            // console.log('subject',  subject);
            const fixedDay = days[subject] || [];
            const fixedPos = positions[subject] || [];

            for (let j = 0; j < fixedDay.length; j++) {
                const day = fixedDay[j];
                const pos = fixedPos[j];

                if (day !== 0 && pos !== 0) {
                    subjectPositionArray[pos - 1][day - 1] = subject;
                }
            };
        };

        return subjectPositionArray;
    };

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
                            subject: currentSubject
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
                            subject: currentSubject
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
                    subject: currentSubject
                });
            }
    
            return ranges;
        });
    
        return mergeData;
    };

    const handleSave = () => {
        setFixedDays((prev) =>
            produce(prev, (draft) => {
                if (isForSection) {
                    draft = days; // Save only the days directly
                } else {
                    draft[grade] = days; // Save the days for the specific grade
                }
            })
        );
        setFixedPositions((prev) =>
            produce(prev, (draft) => {
                if (isForSection) {
                    draft = positions; // Save only the positions directly
                } else {
                    draft[grade] = positions; // Save the positions for the specific grade
                }
            })
        );

        setEditMode(false);
        document.getElementById(`assign_fixed_sched_modal_${grade}`).close();
    };

    const handleCancel = () => {
        setSubs(produce(selectedSubjects, (draft) => draft));
        setDays(produce(fixedDays, (draft) => draft));
        setPositions(produce(fixedPositions, (draft) => draft));

        setEditMode(false);
        document.getElementById(`assign_fixed_sched_modal_${grade}`).close();
    };

    const handleClose = () => {
        setSubs(produce(selectedSubjects, (draft) => draft));
        setDays(produce(fixedDays, (draft) => draft));
        setPositions(produce(fixedPositions, (draft) => draft));

        setEditMode(false);
        document.getElementById(`assign_fixed_sched_modal_${grade}`).close();
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
    
        // Helper function to count slots
        const countSlots = (subs, key, targetValue, excludedValue) =>
            subs.reduce((count, subID) => {
                const items = key === 'days' ? days[subID] : positions[subID];
                return (
                    count +
                    items.filter(
                        (item, idx) =>
                            item === targetValue && targetValue !== excludedValue && targetValue !== 0
                    ).length
                );
            }, 0);

        // Calculate slots with your conditions
        const daySlots = countSlots(
            subs,
            'days',
            targetDay,
            days[draggedSubjectID]?.[draggedDay]
        );
        const positionSlots = countSlots(
            subs,
            'positions',
            targetPos,
            positions[draggedSubjectID]?.[draggedDay]
        );
    
        // Validate slots
        if (daySlots === subs.length && positionSlots >= numOfSchoolDays) {
            alert(`No spots left in ${dayNames[targetDay - 1]} and position ${targetPos}.`);
            return;
        }
        if (daySlots === subs.length) {
            alert(`No spots left in ${dayNames[targetDay - 1]}.`);
            return;
        }
        if (positionSlots >= numOfSchoolDays) {
            alert(`No spots left in position ${targetPos}.`);
            return;
        }
    
        // Check if the target spot is occupied
        const isOccupied = subs.some((subID) =>
            days[subID]?.some((day, idx) => day === targetDay && positions[subID]?.[idx] === targetPos && targetDay !== 0 && targetPos !== 0)
        );
    
        if (isOccupied) {
            alert('This spot is already taken!');
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

    const toggleViewMode = () => {
        setEditMode(!editMode);
    };

    return (
        <dialog id={`assign_fixed_sched_modal_${grade}`}  className="modal modal-bottom sm:modal-middle">
            <div 
                className="modal-box" 
                style={{
                    width: '80%', 
                    maxWidth: 'none',
                }}  
            >
                <div 
                    className="p-3"
                    >
                    <div className='pt-2 pb-4 text-2xl font-bold'>
                        Fixed Schedules
                    </div>
                    
                    {
                        addingMode === 0 &&

                        <div className="flex justify-center items-center space-x-2 m-3 text-base">
                            <div className={``}>
                                View
                            </div>
                            <input 
                                type="checkbox" 
                                className="toggle" 
                                checked={editMode} 
                                onChange={toggleViewMode} 
                            />
                            <div>
                                Edit
                            </div>
                        </div>
                    }

                    
                    <div className="text-sm flex flex-col space-y-4">
                        <DndContext 
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex">
                                { editMode &&
                                    <div className="flex flex-col w-4/12">
                                        {/* Spawn point(s) for subject blocks */}
                                        {subs?.map((subject, index) => (
                                            <div className='flex flex-wrap' key={`g${grade}-s${subject}`}>
                                                <div 
                                                    key={`spawn_label-g${grade}-s${subject}`}
                                                    className='w-3/12 flex justify-center items-center border border-gray rounded-tl-lg rounded-bl-lg truncate'
                                                    style={{
                                                        backgroundColor: darkColors[index % darkColors.length], // Background color
                                                        color: 'white',
                                                    }}
                                                >
                                                    {subjects[subject]?.subject}
                                                </div>
                                                <div className='w-8/12'>
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
                                }
                                <div className={`p-4 ${editMode ? 'w-8/12' : 'w-full'}`}>
                                    <div className='p-2'>

                                        {/* Header */}
                                        {subs?.length > 0 && (
                                            <div className="flex flex-wrap justify-center items-center">
                                            {/* Empty cell */}
                                                <div className="w-20 h-16 bg-transparent border border-transparent"></div>

                                                {/* Days */}
                                                <div className="flex flex-wrap">
                                                    {Array.from({ length: numOfSchoolDays }).map((_, i) => {
                                                    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                                                    const dayName = daysOfWeek[i % 7]; // Handle wrap-around for more than 7 days

                                                    return (
                                                        <div
                                                            key={i}
                                                            className="w-20 h-16 bg-blue-900 border flex items-center justify-center text-white font-bold"
                                                        >
                                                            {dayName}
                                                        </div>
                                                    );
                                                    })}
                                                </div>
                                                    
                                                <div className='w-10 h-16 bg-transparent border border-transparent'>
                                                </div>
                                            </div>
                                        )}

                                        {/* Schedule */}
                                        {subs?.map((subject, subIndex) => (
                                            <div key={subIndex} className="flex flex-wrap justify-center items-center">

                                                <div className="w-20 h-20 bg-blue-700 text-white font-bold border flex items-center justify-center">
                                                    {subIndex + 1}
                                                </div>

                                                {/* Droppable cells for schedule */}
                                                {Array.from({ length:numOfSchoolDays }).map((_, index) => (
                                                    <DroppableSchedCell
                                                        key={`drop-g${grade}-d${index}-p${subIndex}`}

                                                        editMode={editMode}

                                                        subjectID={-1}
                                                        day={index + 1}
                                                        position={subIndex + 1}
                                                        grade={grade}

                                                        mergeData={mergeData[subIndex]}

                                                        selectedSubjects={subs}
                                                        fixedDays={days}
                                                        fixedPositions={positions}
                                                    />
                                                ))}

                                                {/* Reserve position */}
                                                <ReservePosition 
                                                    key={`reservePos-g${grade}-p${subIndex + 1}`}
                                                    editMode={editMode}

                                                    grade={grade}
                                                    subjectID={-1}
                                                    day={0}
                                                    position={subIndex + 1}

                                                    subs={subs}
                                                    days={days} setDays={setDays}
                                                    positions={positions} setPositions={setPositions}
                                                />
                                            </div>
                                        ))}

                                        {/* Reserve day */}
                                        <div key="reserveDay" className="flex flex-wrap justify-center items-center">

                                            <div className="w-20 h-10 bg-transparent border border-transparent">
                                            </div>

                                            {Array.from({ length:numOfSchoolDays }).map((_, index) => (
                                                <ReserveDay
                                                    key={`reserveDay-g${grade}-d${index + 1}`}
                                                    editMode={editMode}

                                                    grade={grade}
                                                    subjectID={-1}
                                                    day={index + 1}
                                                    position={0}

                                                    subs={subs}
                                                    days={days} setDays={setDays}
                                                    positions={positions}  setPositions={setPositions}
                                                />
                                            ))}

                                            <div className="w-10 h-10 bg-transparent border border-transparent">
                                            </div>

                                        </div>
                                        
                                    </div>
                                </div>
                            </div>
                        </DndContext>
                    </div>
                    
                    { editMode && 
                        <div className='m-2 p-2 flex gap-3 justify-center'>
                        <button 
                            className='btn btn-primary'
                            onClick={handleSave}
                        >
                            Save
                        </button>
                        <button 
                            className='btn'
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        </div>
                    }
                    
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

export default FixedScheduleMaker;