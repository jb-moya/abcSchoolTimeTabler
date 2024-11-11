import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { convertToTime } from '../../utils/convertToTime';

const GeneratedTimetable = ({
    timetables,
    field,
    columnField,
    onUpdateTimetables,
    errors,
}) => {
    if (!timetables) return null;

    const handleDragEnd = (result) => {
        const { source, destination } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const updatedTimetables = JSON.parse(JSON.stringify(timetables));
        const timetableID = source.droppableId;
        const timetable = updatedTimetables[timetableID];

        const startEndValues = Object.entries(timetable)
            .filter(([key]) => key !== 'containerName')
            .sort((a, b) => a[0] - b[0])
            .map(([key, value]) => {
                const innerValue = value['0'];
                return {
                    start: innerValue?.start,
                    end: innerValue?.end,
                };
            });

        const rows = Object.entries(timetable).filter(
            ([key]) => key !== 'containerName'
        );

        const [movedRow] = rows.splice(source.index, 1);
        rows.splice(destination.index, 0, movedRow);

        // Extract start and end values

        // Update reorderedTimetable with startEndValues
        const reorderedTimetable = rows.reduce(
            (acc, [key, value], index) => {
                const innerValue = value['0'];
                const updatedEntry = innerValue
                    ? { ...innerValue }
                    : { ...value };
                console.log('log here po no index', startEndValues);

                console.log('log here po', startEndValues[index]);
                console.log('log here next', updatedEntry);

                // Set updated start and end values from startEndValues
                updatedEntry.start = startEndValues[index].start;
                updatedEntry.end = startEndValues[index].end;

                acc[index] = innerValue ? { 0: updatedEntry } : updatedEntry;
                return acc;
            },
            { containerName: timetable.containerName }
        );

        updatedTimetables[timetableID] = reorderedTimetable;
        onUpdateTimetables(updatedTimetables);
        console.log('updated log', updatedTimetables);
        // Example errors for testing
        // Remove this later when passing errors as a prop
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="overflow-hidden">
                {Object.entries(timetables).map(([timetableID, timetable]) => {
                    const { containerName, ...rowTimetable } = timetable;
                    console.log(timetable);
                    return (
                        <React.Fragment key={timetableID}>
                            <div className="flex gap-4 font-bold items-center text-center mt-20">
                                <div>{field}: </div>
                                <div className="text-lg text-accent">
                                    {containerName}
                                </div>
                            </div>

                            <div className="flex bg-base-100 h-full">
                                {/* Time Table */}
                                <div className="w-2/12 items-center">
                                    <div className="border border-primary-content ">
                                        Time
                                    </div>
                                    {Object.entries(rowTimetable).map(
                                        ([_, row], index) => (
                                            <div
                                                key={index}
                                                className="flex-col items-center  border-b border-primary-content h-11"
                                            >
                                                {convertToTime(row[0]?.start)} -{' '}
                                                {convertToTime(row[0]?.end)}
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Content Table */}
                                <div className="w-10/12">
                                    <div className="flex text-center w-full border border-primary-content">
                                        {[
                                            'Mon',
                                            'Tue',
                                            'Wed',
                                            'Thu',
                                            'Fri',
                                        ].map((day, index) => (
                                            <div
                                                key={index}
                                                className="flex-1 border-r border-primary-content"
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <Droppable
                                        droppableId={timetableID}
                                        type="ROW"
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="flex flex-col h-full"
                                            >
                                                {Object.entries(
                                                    rowTimetable
                                                ).map(
                                                    (
                                                        [timeslot, row],
                                                        index
                                                    ) => {
                                                        const consistent =
                                                            '0' in row;

                                                        const draggableId = `${timetableID}-${timeslot}`;

                                                        // Check if this row has an error
                                                        const hasError =
                                                            errors?.containerName ===
                                                                containerName &&
                                                            errors?.sectionID?.includes(
                                                                row[0]
                                                                    ?.sectionID
                                                            ) &&
                                                            (errors?.subjectID?.includes(
                                                                row[0]
                                                                    ?.subjectID
                                                            ) ||
                                                                errors?.teacherID?.includes(
                                                                    row[0]
                                                                        ?.teacherID
                                                                ));

                                                        return (
                                                            <Draggable
                                                                key={
                                                                    draggableId
                                                                }
                                                                draggableId={
                                                                    draggableId
                                                                }
                                                                index={index}
                                                            >
                                                                {(provided) => (
                                                                    <div
                                                                        ref={
                                                                            provided.innerRef
                                                                        }
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className={`flex items-center border-b border-primary-content h-11 ${
                                                                            hasError
                                                                                ? 'bg-red-500'
                                                                                : 'bg-base-100'
                                                                        }`}
                                                                    >
                                                                        <div className="w-full flex justify-center space-x-3">
                                                                            {consistent ? (
                                                                                <>
                                                                                    {row[0][
                                                                                        columnField[1]
                                                                                    ] ||
                                                                                    row[0][
                                                                                        columnField[0]
                                                                                    ] ? (
                                                                                        <>
                                                                                            <div>
                                                                                                {
                                                                                                    row[0][
                                                                                                        columnField[1]
                                                                                                    ]
                                                                                                }
                                                                                            </div>
                                                                                            <div>
                                                                                                {
                                                                                                    row[0][
                                                                                                        columnField[0]
                                                                                                    ]
                                                                                                }
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <div className="opacity-60">
                                                                                            Break
                                                                                            Time
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    {[
                                                                                        '1',
                                                                                        '2',
                                                                                        '3',
                                                                                        '4',
                                                                                        '5',
                                                                                    ].map(
                                                                                        (
                                                                                            day
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    day
                                                                                                }
                                                                                                className="w-1/5 text-center"
                                                                                            >
                                                                                                {row[
                                                                                                    day
                                                                                                ] ? (
                                                                                                    <>
                                                                                                        <div>
                                                                                                            {
                                                                                                                row[
                                                                                                                    day
                                                                                                                ][
                                                                                                                    columnField[0]
                                                                                                                ]
                                                                                                            }
                                                                                                        </div>
                                                                                                        <div>
                                                                                                            {
                                                                                                                row[
                                                                                                                    day
                                                                                                                ][
                                                                                                                    columnField[1]
                                                                                                                ]
                                                                                                            }
                                                                                                        </div>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <div className="opacity-60">
                                                                                                        ----
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        )
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        );
                                                    }
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </DragDropContext>
    );
};

export default GeneratedTimetable;
