import React, { useState } from 'react';
import { convertToTime } from '../../utils/convertToTime';

const GeneratedTimetable = ({ timetables, field, columnField, onUpdateTimetables }) => {
    if (!timetables) return null;

    const [draggedRow, setDraggedRow] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);
    const [highlightPosition, setHighlightPosition] = useState(null);

    const handleDragStart = (e, tableID, rowIndex) => {
        setDraggedRow({ tableID, rowIndex });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, tableID, rowIndex) => {
        e.preventDefault();

        // Determine the drop position based on mouse position
        const rect = e.currentTarget.getBoundingClientRect();
        const dropPosition = (e.clientY - rect.top) / rect.height;

        if (dropPosition <= 0.17) {
            setHighlightPosition('top');
        } else if (dropPosition >= 0.83) {
            setHighlightPosition('bottom');
        } else {
            setHighlightPosition('middle');
        }

        setHoveredRow({ tableID, rowIndex });
    };

    const handleDrop = (e, tableID, rowIndex) => {
        e.preventDefault();
    
        if (draggedRow && draggedRow.tableID === tableID) {
            const rows = { ...timetables[tableID] };
            console.log("rows: ", rows);
            console.log("orig: ",timetables[tableID])
            // Get the row keys (indexes)
            const rowKeys = Object.keys(rows);
            console.log("Row index:", rowIndex);
            console.log("Row keys:", rowKeys);
            
            // Find the dragged row by index
            const draggedRowKey = rowKeys[draggedRow.rowIndex];
            const movedRow = rows[draggedRowKey];
            console.log("Moved row:", movedRow);
    
            // Remove the dragged row from the rows
            delete rows[draggedRowKey];
    
            if (highlightPosition === 'top' || highlightPosition === 'bottom') {
                console.log(`moved ${highlightPosition}`);
            
                // Get the target row key
                const targetRowKey = rowKeys[rowIndex];
            
                // Determine insert index based on position
                var insertIndex = highlightPosition === 'top' ? rowIndex : rowIndex;
                console.log("rows before : ",rows)

                // Remove dragged row and insert it at the new position
                if (draggedRow.rowIndex < rowIndex && highlightPosition === 'top') {
                    insertIndex = insertIndex - 1;
                }

                if (draggedRow.rowIndex > rowIndex && highlightPosition === 'bottom') {
                    insertIndex = insertIndex + 1;
                }
                rowKeys.splice(draggedRow.rowIndex, 1); // Remove dragged row key
                rowKeys.splice(insertIndex, 0, draggedRowKey); // Insert dragged row key
            
                console.log("newRowKeys: ", rowKeys);
                console.log("rows: ",rows)
                // Rebuild the updatedRows object without including 'containerName'
                console.log("moved row: ",movedRow);
                console.log("insertIndex: ",insertIndex);

                const updatedRows = {};  // Initialize as an object
                let index = 0;  // This will track the "position" where to add in updatedRows
                
                rowKeys.forEach(key => {
                    if (key === 'containerName') {
                        updatedRows[key] = rows[key];  // Add the row at the current key to the object
                    } else {
                        if (index === insertIndex) {  
                            updatedRows[index] = movedRow;  // Add movedRow to the object at the current index
                            console.log("inside updatedRow: ", updatedRows[index]);  // Log the added movedRow
                        } else {
                            updatedRows[index] = rows[key];  // Add the row at the current key to the object
                        }
                    }

                    index++;  // Increment the index to maintain order

                });
                
            
                console.log("updatedRows: ", updatedRows);
            
                // Update the timetable state with the updated rows
                onUpdateTimetables(prevTimetables => ({
                    ...prevTimetables,
                    [tableID]: updatedRows,
                }));
            }
            
            
             else {
                // Default: Swap rows
                const targetRowKey = rowKeys[rowIndex];
                const targetRow = rows[targetRowKey];
                
                rows[draggedRowKey] = targetRow;
                rows[targetRowKey] = movedRow;
                
                console.log("rows: ",rows);
                onUpdateTimetables(prevTimetables => ({
                    ...prevTimetables,
                    [tableID]: rows
                }));
            }
    
            console.log("Updated rows:", rows);
    
            // Reset states
            setDraggedRow(null);
            setHoveredRow(null);
            setHighlightPosition(null);
        }
    };

    return (
        <div className="overflow-x-auto">
            {Object.entries(timetables).map(([tableID, timetable]) => {
                const { containerName, ...rowTimetable } = timetable;

                return (
                    <React.Fragment key={tableID}>
                        <div className="flex gap-4 font-bold items-center text-center mt-10">
                            <div>{field}: </div>
                            <div className="text-lg text-accent">
                                {containerName}
                            </div>
                        </div>
                        <div className="flex bg-base-100">
                            <div className="w-1/12">
                                <div className="border border-primary-content">
                                    Time
                                </div>
                            </div>
                            <div className="w-11/12">
                                <div className="flex text-center w-full border border-primary-content">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(
                                        (day, index) => (
                                            <div
                                                key={index}
                                                className="flex-1 border-r border-primary-content"
                                            >
                                                {day}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {Object.entries(rowTimetable).map(
                            ([timeslot, row], index) => {
                                const consistent = '0' in row;

                                const isDragging =
                                    draggedRow &&
                                    draggedRow.tableID === tableID &&
                                    draggedRow.rowIndex === index;
                                const isHovered =
                                    hoveredRow &&
                                    hoveredRow.tableID === tableID &&
                                    hoveredRow.rowIndex === index;

                                const rowStyles = {
                                    cursor: 'move',
                                    backgroundColor: isDragging
                                        ? '#f0f0f0'
                                        : '#fff',
                                    borderTop:
                                        isHovered && highlightPosition === 'top'
                                            ? '2px solid blue'
                                            : isHovered && highlightPosition === 'middle'
                                            ? '2px solid blue'
                                            : '2px solid transparent',
                                    borderBottom:
                                        isHovered && highlightPosition === 'bottom'
                                            ? '2px solid blue'
                                            : isHovered && highlightPosition === 'middle'
                                            ? '2px solid blue'
                                            : '2px solid transparent',
                                    borderLeft:
                                        isHovered && highlightPosition === 'middle'
                                            ? '2px solid blue'
                                            : '2px solid transparent',
                                    borderRight:
                                        isHovered && highlightPosition === 'middle'
                                            ? '2px solid blue'
                                            : '2px solid transparent',
                                };

                                if (consistent) {
                                    const startTime = convertToTime(
                                        row[0].start
                                    );
                                    const endTime = convertToTime(
                                        row[0].end
                                    );
                                    const teacher =
                                        row[0][columnField[0]];
                                    const subject =
                                        row[0][columnField[1]];

                                    return (
                                        <div
                                            key={timeslot}
                                            draggable
                                            onDragStart={(e) =>
                                                handleDragStart(
                                                    e,
                                                    tableID,
                                                    index
                                                )
                                            }
                                            onDragOver={(e) =>
                                                handleDragOver(
                                                    e,
                                                    tableID,
                                                    index
                                                )
                                            }
                                            onDrop={(e) =>
                                                handleDrop(
                                                    e,
                                                    tableID,
                                                    index
                                                )
                                            }
                                            style={rowStyles}
                                            className="flex bg-base-100 items-center"
                                        >
                                            <div className="w-1/12 text-sm text-center">
                                                {startTime} - {endTime}
                                            </div>

                                            <div className="w-11/12 flex justify-center space-x-3">
                                                {teacher && subject ? (
                                                    <>
                                                        <div>{subject}</div>
                                                        <div>{teacher}</div>
                                                    </>
                                                ) : (
                                                    <div className="opacity-60">
                                                        Break Time
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    let startTime;
                                    let endTime;
                                    const keys = Object.keys(row);

                                    if (keys.length > 0) {
                                        const anyKey = keys[0];
                                        startTime = convertToTime(
                                            row[anyKey].start
                                        );
                                        endTime = convertToTime(
                                            row[anyKey].end
                                        );
                                    } else {
                                        console.error('No keys found.');
                                    }

                                    const days = ['1', '2', '3', '4', '5'];

                                    return (
                                        <div
                                            key={timeslot}
                                            draggable
                                            onDragStart={(e) =>
                                                handleDragStart(
                                                    e,
                                                    tableID,
                                                    index
                                                )
                                            }
                                            onDragOver={(e) =>
                                                handleDragOver(
                                                    e,
                                                    tableID,
                                                    index
                                                )
                                            }
                                            onDrop={(e) =>
                                                handleDrop(
                                                    e,
                                                    tableID,
                                                    index
                                                )
                                            }
                                            style={rowStyles}
                                            className="flex bg-base-100 items-center"
                                        >
                                            <div className="w-1/12 text-sm text-center">
                                                {startTime} - {endTime}
                                            </div>

                                            <div className="w-11/12">
                                                <div className="flex text-center w-full items-center">
                                                    {days.map((day) => {
                                                        if (day in row) {
                                                            return (
                                                                <div
                                                                    className="w-1/5"
                                                                    key={day}
                                                                >
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
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div
                                                                    className="w-1/5 opacity-60"
                                                                    key={day}
                                                                >
                                                                    - - - - - -
                                                                    -
                                                                </div>
                                                            );
                                                        }
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            }
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default GeneratedTimetable;