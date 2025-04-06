import React, { useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';

import DraggableSchedules from './draggableSchedules';

const DroppableSchedCell = ({
    // STORES
    subjects,
    // STORES

    editMode,

    subjectID,
    day,
    position,
    grade,

    mergeData,
    totalTimeslot = 0,
    selectedSubjects,
    fixedDays,
    fixedPositions,
}) => {

// ===============================================================================

    const numOfSchoolDays = parseInt(
        localStorage.getItem('numOfSchoolDays'),
        10
    );

// ===============================================================================

    const [isFull, setIsFull] = useState(false);

    useEffect(() => {
        checkIfFull();
    }, [selectedSubjects, fixedDays, fixedPositions]);

    const checkIfFull = () => {
        let daySlots = 0;
        let positionSlots = 0;

        {
            selectedSubjects?.map((subID, index) => {
                const subjectDays = fixedDays[subID] || [];
                const subjectPositions = fixedPositions[subID] || [];

                for (let i = 0; i < subjectDays.length; i++) {
                    if (subjectDays[i] === day) {
                        daySlots += 1;
                    }

                    if (subjectPositions[i] === position) {
                        positionSlots += 1;
                    }
                }
            });
        }

        if (
            // daySlots === selectedSubjects.length ||
            daySlots === totalTimeslot ||
            positionSlots >= numOfSchoolDays
        ) {
            setIsFull(true);
            return;
        }

        setIsFull(false);
    };

// ===============================================================================

    const { setNodeRef } = useDroppable({
        id: `drop-g${grade}-d${day}-p${position}`,
        data: { subjectID, day, position },
    });

// ===============================================================================

    return (
        <div
            ref={editMode ? setNodeRef : null}
            className={`w-20 h-14 flex justify-center items-center border border-gray-400 border-opacity-20 ${
                isFull ? 'bg-gray-200 bg-opacity-30' : ''
            }
                ${editMode ? 'hover:bg-slate-300' : ''}
                    `}
        >
            {/* {Array.from(
                { length: totalTimeslot },
                (_, index) => index + 1
            )?.map((subject, index) => { */}
            {selectedSubjects?.map((subject, index) => {
                const arrayLength = fixedDays?.[subject]?.length || 0;

                return Array.from({ length: arrayLength }).map((_, idx) => {
                    if (
                        fixedDays?.[subject]?.[idx] === day &&
                        fixedPositions?.[subject]?.[idx] === position
                    ) {
                        return (
                            <DraggableSchedules
                                editMode={editMode}
                                key={idx}
                                subjectID={subject}
                                grade={grade}
                                dayIdx={idx}
                                posIdx={idx}
                                // Visuals only
                                day={day}
                                pos={position}
                                mergeData={mergeData}
                                colorIdx={index}
                                subjectName={
                                    subjects[subject]?.subject || 'Unknown'
                                }
                            />
                        );
                    }

                    // Optionally return null if no match is found
                    return null;
                });
            })}
        </div>
    );
};

export default DroppableSchedCell;
