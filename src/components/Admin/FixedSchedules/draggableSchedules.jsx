import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDraggable } from '@dnd-kit/core';

import { dragColors } from './bgColors';

const DraggableSchedules = ({
    editMode,

    subjectID,
    grade,
    dayIdx,
    posIdx,

    // Visuals only
    day,
    pos,
    mergeData,
    colorIdx,

    subjectName,
}) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `draggable-${grade}-${subjectID}-${dayIdx}-${posIdx}`, // Include subjectID in the draggable ID
        data: { subjectID, grade, dayIdx, posIdx },
    });

    const style = transform
        ? {
              transform: `translate(${transform.x}px, ${transform.y}px)`,
          }
        : undefined;

    const colorClass = dragColors[colorIdx % dragColors.length];

    const checkPosition = () => {
        if (mergeData === undefined || mergeData === null) return 'rounded';

        let result = 'rounded';

        for (let merges of mergeData) {
            if (
                merges.start.dayIndex === merges.end.dayIndex &&
                merges.start.positionIndex === merges.end.positionIndex
            ) {
                result = 'rounded';
            } else if (
                merges.start.dayIndex === day - 1 &&
                merges.start.positionIndex === pos - 1
            ) {
                result = 'rounded-tl-lg rounded-bl-lg';
            } else if (
                merges.end.dayIndex === day - 1 &&
                merges.end.positionIndex === pos - 1
            ) {
                result = 'rounded-tr-lg rounded-br-lg';
            } else if (
                merges.start.dayIndex < day - 1 &&
                merges.end.dayIndex > day - 1 &&
                merges.start.positionIndex === pos - 1 &&
                merges.end.positionIndex === pos - 1
            ) {
                result = '';
            }
        }
        return result;
    };

    const compBorder = checkPosition();

    return (
        <div
            ref={editMode ? setNodeRef : null}
            {...(editMode ? listeners : {})}
            {...(editMode ? attributes : {})}
            className={`w-20 h-16 p-4 ${colorClass} ${compBorder} ${
                editMode ? 'cursor-grab shadow-sm hover:shadow-md' : ''
            }`}
            style={editMode ? style : undefined}
        >
            <h3 className="font-medium text-black text-xs">
                <div className="truncate">{subjectName}</div>
            </h3>
        </div>
    );
};

export default DraggableSchedules;
