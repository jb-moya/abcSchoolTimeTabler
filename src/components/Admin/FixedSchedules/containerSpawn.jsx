import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDroppable } from '@dnd-kit/core';

import DraggableSchedules from './draggableSchedules';

import { subscribeToSubjects } from '@features/slice/subject_slice';

const ContainerSpawn = ({
    editMode,

    subjectID,
    position,
    day,
    grade,

    colorIndex,

    selectedSubjects,
    fixedDays,
    fixedPositions,
}) => {

// ===============================================================================

    const dispatch = useDispatch();

    // const { documents: subjects, loading1, error1 } = fetchDocuments('subjects');
    const { data: subjects, loading1, error1 } = useSelector((state) => state.subjects);

    useEffect(() => {
        dispatch(subscribeToSubjects());
    }, [dispatch]);

// ===============================================================================

    const { setNodeRef } = useDroppable({
        id: `spawn-g${grade}-s${subjectID}`,
        data: { subjectID, day, position },
    });

    return (
        <div ref={setNodeRef} className={'w-full min-h-13 flex flex-col justify-start'}>
            {/* <div className='px-2 flex max-w-fit text-lg rounded-br-lg rounded-tl-sm'>subjectID</div> */}
            <div className='flex flex-wrap p-2 gap-2'>
                {selectedSubjects?.map((subject, index) => {
                    const arrayLength = fixedDays?.[subject]?.length || 0;

                    return Array.from({ length: arrayLength }).map((_, idx) => {
                        if (
                            fixedDays?.[subject]?.[idx] === day &&
                            fixedPositions?.[subject]?.[idx] === position &&
                            subject === subjectID
                        ) {
                            return (
                                <DraggableSchedules
                                    key={idx}
                                    editMode={editMode}
                                    subjectID={subjectID}
                                    grade={grade}
                                    dayIdx={idx}
                                    posIdx={idx}
                                    // Visuals only
                                    day={day}
                                    pos={position}
                                    colorIdx={colorIndex}
                                    subjectName={subjects[subjectID]?.subject || 'Unknown'}
                                />
                            );
                        }
                        return null;
                    });
                })}
            </div>
        </div>
    );
};

export default ContainerSpawn;
