import React, { useState ,useRef } from 'react';
import { Reorder, useDragControls } from "framer-motion";
import Cells from './Cells.jsx';
import { convertToTime } from '../../utils/convertToTime';

const Row = ({ row, tableID ,updateColValues, rowIndex, tableIndex,dragStartFunc,dragOverFunc,hoveredCol,setHoveredCol,type}) => {
    let columnField = [];
    if (type === 'section') {
        columnField = ['teacher', 'subject'];
    } else if (type === 'teacher') {
        columnField = ['subject', 'section'];
    }
    // console.log("row: ",row)
    const wholeDay = "0" in row;
    const controls = useDragControls();
    const [elementRect, setElementRect] = useState(null); // State to track the element's rect
    function getStartAndEnd(row) {
        let start, end;
        Object.values(row).some((value) => {
            if (value && value.start != null && value.start != null) {
                start = value.start;
                end = value.end;

                return true; // Exit the loop early once found
            }
            return false; // Continue checking
        });
    
        return { start, end };
    }
    const handleMouseDown = (event) => {
        const clickedElement = event.target.closest(".row");
        if (!clickedElement) return; // Ensure clicked element exists
      
        const rect = clickedElement.getBoundingClientRect();
      
        // Update the state only if the rect value has changed
        setElementRect((prevRect) => {
          if (
            !prevRect || // Initial set
            prevRect.x !== rect.x ||
            prevRect.y !== rect.y ||
            prevRect.width !== rect.width ||
            prevRect.height !== rect.height
          ) {
            // console.log("Position and Dimensions Updated:", rect);
            return rect; // Update the state
          }
          return prevRect; // Return the previous state if no change
        });
      };

    const renderTimeColumn = (start, end) => {
        const startTime = convertToTime(start);
        const endTime = convertToTime(end);

        return (
            <div className="w-1/12 text-center text-xs border-r border-primary-content p-2">
                {startTime} - {endTime}
            </div>
        );
    };

    if (wholeDay) {
        const { start, end } = getStartAndEnd(row);


        return (
            <div className="flex w-full h-full items-center">
                {renderTimeColumn(start, end)}
                <Reorder.Item
                    value={row}
                    id={row.id}
                    dragListener={false}
                    dragControls={controls}
                    className="w-11/12 flex items-center border border-primary-content h-full"
                >
                    <div className="w-11/12 flex items-center justify-center space-x-4 h-full p-3">
                        {row[0][columnField[0]] && row[0][columnField[1]] ? (
                            <>
                                <div className="font-medium">{row[0][columnField[1]]
                                }</div>
                                <div className="text-sm text-gray-500">{row[0][columnField[0]]}</div> 
                            </>
                        ) : (
                            <div className="opacity-60">Break Time</div>
                        )}
                    </div>
                    <div
                        onPointerDown={(e) => controls.start(e)}
                        className="w-1/12 text-center cursor-move border-l border-primary-content select-none"
                    >
                        :::
                    </div>
                </Reorder.Item>
            </div>
        );
    } else {
        const dayKeys = ["1", "2", "3", "4", "5"];
        const { start, end } = getStartAndEnd(row);

        const deepCopy = structuredClone(row);
        // for (let i = 1; i <= 5; i++) {
        //     const key = i.toString(); // Convert number to string for comparison
        //     if (!deepCopy.hasOwnProperty(key)) {
        //         deepCopy[key] = undefined;
        //     }
        // }
        for (const key in deepCopy) {
            if (deepCopy.hasOwnProperty(key) && typeof deepCopy[key] === 'object' && deepCopy[key] !== null) {
                deepCopy[key].day = key;
            }
        }

        let copyFlat = Object.values(deepCopy).flat();

        copyFlat = copyFlat.filter(item => typeof item !== 'string');

        console.log("copyflat: ",copyFlat)


        return (
            <div className="flex w-full items-center" onMouseDown={handleMouseDown}
>
                {renderTimeColumn(start,end)}
                <Reorder.Item
                    value={row}
                    id={row.id}
                    dragControls={controls}
                    dragListener={false}
                    className="w-11/12 flex items-center border border-primary-content row"
                >
                    <Reorder.Group
                        axis="x"
                        values={copyFlat}
                        onReorder={(newRows) => {
                            updateColValues(tableIndex, rowIndex, newRows, row.id, elementRect, type);
                        }}
                        className="flex w-full"
                        key={rowIndex}
                    >  
                        {copyFlat.map((col, index) => (
                            <Cells 
                                col={col} 
                                key={col.id} 
                                rowID={row.id}
                                tableID={tableID}
                                dragOverFunc={dragOverFunc}
                                hoveredCol={hoveredCol}
                                tableIndex={tableIndex}
                                columnField={columnField}
                            />
                        ))}

                    </Reorder.Group>
                    <div
                        onPointerDown={(e) => controls.start(e)}
                        className="w-1/12 text-center cursor-move select-none"
                    >
                        :::
                    </div>
                </Reorder.Item>
            </div>
        );
    }
};

export default Row;
