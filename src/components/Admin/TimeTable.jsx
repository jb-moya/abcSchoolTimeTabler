import React, { useState, useEffect, useMemo, useRef  } from 'react';
import { convertToTime } from '../../utils/convertToTime';
import { motion, Reorder,useDragControls,useMotionValue } from "framer-motion";
import Row from './Row.jsx'
import Item from './Item.jsx'

const GeneratedTimetable = ({ sectionTimetables,teacherTimetables, onUpdateTimetables }) => {
    if (!sectionTimetables || !teacherTimetables) return null;
  console.log("section: ",sectionTimetables)
  console.log("teacherTimetables: ",teacherTimetables)

    const draggedRow = React.useRef(null);
    const draggedCol = React.useRef(null);
    const [hoveredCol, setHoveredCol] = React.useState(null);
    const highlightPosition = React.useRef(null);
    const mousePositionRef = useRef({ x: 0, y: 0 });
    const [field, setField] = useState(null)
    const [mode, setMode] = useState(null)

  // console.log(field)
    const [currentTableIndex, setCurrentTableIndex] = useState(null);

    // const [timetableData, setTimetableData] = useState(timetables);
    // console.log(timetableData);

    // useEffect(() => {
    //     console.log("fieldparam up ")

    //     // setField(fieldparam);
    // }, [fieldparam]);

  //   useEffect(() => {
  //     console.log("sectionTimetables up ")
  //     console.log("field: ",fieldparam)

  //     // setField(fieldparam);
  // }, [sectionTimetables]);

    // if(fieldparam){
    //   setField(fieldparam);
    // }

    // useEffect(() => {
    //     console.log("new: ",timetableData)
    // }, [timetableData]);

    const getIdFromRespectiveTable = (col,day) => {
      console.log("col STARTTTTTTTTTTTTTTTTT: ", col);
      
      let value = null;
    
      // Add IDs to top-level and nested objects
      Object.keys(teacherTimetables).some((key) => {
        if (typeof teacherTimetables[key] === "object" && !Array.isArray(teacherTimetables[key])) {
          return Object.keys(teacherTimetables[key]).some((nestedKey) => {
            if (typeof teacherTimetables[key][nestedKey] === "object") {
              return Object.keys(teacherTimetables[key][nestedKey]).some((innerKey) => {
                let currentCol = teacherTimetables[key][nestedKey][innerKey];


                if (typeof currentCol === "object" && col) {
                  if (innerKey === '0') {
                    if (
                      currentCol.teacherID === col.teacherID &&
                      currentCol.subjectID === col.subjectID &&
                      currentCol.sectionID === col.sectionID &&
                      currentCol.start === col.start &&
                      currentCol.end === col.end
                    ) {
                      console.log("currentCol: ", currentCol);
  
                      value = currentCol.origId;
                      return true; // Break the loop
                    }
                  } else {
                    console.log("currentCol: ", currentCol);
                    console.log("innerKey: ",innerKey);
                    console.log("day: ",day);
                    if (
                      currentCol.teacherID === col.teacherID &&
                      currentCol.subjectID === col.subjectID &&
                      currentCol.sectionID === col.sectionID &&
                      currentCol.start === col.start &&
                      currentCol.end === col.end &&
                      innerKey === String(day)
                    ) {
                      console.log("inside currentCol: ", currentCol);
  
                      value = currentCol.origId;
                      return true; // Break the loop
                    }
                  }
                }
                return false;
              });
            }
            return false;
          });
        }
        return false;
      });
    
      return value;
    };
    

    const addIdsToData = (obj,type) => {
        const updatedData = { ...obj };
      
        // Add IDs to top-level and nested objects
        Object.keys(updatedData).forEach((key) => {
          if (typeof updatedData[key] === 'object' && !Array.isArray(updatedData[key])) {
            // Add table-level ID
            if (!updatedData[key].id) {
              updatedData[key].id = `table-${type}-${key}`;
            }
            // Add row-level IDs
            Object.keys(updatedData[key]).forEach((nestedKey) => {
              if (typeof updatedData[key][nestedKey] === 'object') {
                const containerName = updatedData[key].containerName || 'default';
                updatedData[key][nestedKey] = {
                  ...updatedData[key][nestedKey],
                  id: `row-${type}-${containerName}-${nestedKey}`,


                };
                 // get id
                 let typeID = null;
                 let typeStart = null;
                 let typeEnd = null;
                 for (let innerKey = 1; innerKey <= 5; innerKey++) {
                  if (typeof updatedData[key][nestedKey][innerKey] === 'object') {
                    // If innerKey exists and is an object, add or update the id
                    if (type === 'section'){
                      typeID = updatedData[key][nestedKey][innerKey].sectionID;
                    } else if (type === 'teacher'){
                      typeID = updatedData[key][nestedKey][innerKey].teacherID;
                    }
                      typeStart = updatedData[key][nestedKey][innerKey].start;
                      typeEnd = updatedData[key][nestedKey][innerKey].end;

                  }
              }
                
                // Add col level of IDs
                
                if (typeof updatedData[key][nestedKey][0] === 'object') {
                  let origID = `teacher-${updatedData[key][nestedKey][0]?.teacherID}-section-${updatedData[key][nestedKey][0]?.sectionID}-subject-${updatedData[key][nestedKey][0]?.subjectID}-start-${updatedData[key][nestedKey][0]?.start}-end-${updatedData[key][nestedKey][0]?.end}`;
                  updatedData[key][nestedKey][0] = {
                    ...updatedData[key][nestedKey][0],
                    id: `row-${type}-${containerName}-${nestedKey}-col-0`,
                    origId: type === 'section' ? getIdFromRespectiveTable( updatedData[key][nestedKey][0]) : origID,
                  };
                }
                for (let innerKey = 1; innerKey <= 5; innerKey++) {
                  

                    if (!updatedData[key][nestedKey][innerKey] && !updatedData[key][nestedKey][0]) {
                      console.log("check: ",updatedData[key][nestedKey][innerKey])
                      let origID = `teacher-${updatedData[key][nestedKey][innerKey]?.teacherID}-section-${updatedData[key][nestedKey][innerKey]?.sectionID}-subject-${updatedData[key][nestedKey][innerKey]?.subjectID}-day-${innerKey}-start-${updatedData[key][nestedKey][innerKey]?.start}-end-${updatedData[key][nestedKey][innerKey]?.end}`;
                      updatedData[key][nestedKey][innerKey] = {
                        id: `row-${type}-${containerName}-${nestedKey}-col-${innerKey}`,
                        start: typeStart,
                        end: typeEnd,
                        day: innerKey,
                        origId: type === 'section' ? getIdFromRespectiveTable( updatedData[key][nestedKey][innerKey],innerKey) : origID,
                        ...(type === 'section' && { sectionID:  typeID, section: containerName }),
                        ...(type === 'teacher' && { teacherID:  typeID, teacher: containerName }),
                      };
                    } else if (typeof updatedData[key][nestedKey][innerKey] === 'object') {
                      console.log("check: ",updatedData[key][nestedKey][innerKey])
                      let origID = `teacher-${updatedData[key][nestedKey][innerKey]?.teacherID}-section-${updatedData[key][nestedKey][innerKey]?.sectionID}-subject-${updatedData[key][nestedKey][innerKey]?.subjectID}-day-${innerKey}-start-${updatedData[key][nestedKey][innerKey]?.start}-end-${updatedData[key][nestedKey][innerKey]?.end}`;
                      // If innerKey exists and is an object, add or update the id
                      updatedData[key][nestedKey][innerKey] = {
                        ...updatedData[key][nestedKey][innerKey],
                        id: `row-${type}-${containerName}-${nestedKey}-col-${innerKey}`,
                        origId: type === 'section' ? getIdFromRespectiveTable( updatedData[key][nestedKey][innerKey],innerKey) : origID,
                        ...(type === 'section' && { section: containerName }),
                        ...(type === 'teacher' && { teacher: containerName }),
                      };
                    }
                }
                  
              }
            });
          }
        });
      
        return updatedData;
      };
    



    const handleDragStart = (e, tableID, rowID, colID) => {
        if (colID){
            draggedCol.current = { tableID, rowID, colID };
            draggedRow.current = null;
        } 
    };

    const getStartTime = (tableIndex,type) => {
      let startTime = Infinity;
      const timetables = type === 'section' ? sectionTimetables : teacherTimetables;

      Object.values(timetables).map((table,i)=>{
        if (i===tableIndex){
          Object.values(table).map((row)=> {
            Object.values(row).map((col)=> {
              if (col && col.start != null && col.end != null){
                  if (col.start < startTime) {
                    startTime = col.start
                  }
              }
            });
          });
        }
      });
      return startTime;
    }

    const getOriginalTime = (tableIndex, type) => {
      const originalTimes = []; // Array to store all matching values
      const rowValues = type === 'section' ? sectionRowValues : teacherRowValues;

      Object.values(rowValues).forEach((table, i) => {
        if (i === tableIndex) {
          Object.values(table).forEach((row) => {
            Object.entries(row).forEach(([colKey, col]) => {
              if (col && col.start != null && col.end != null) {
                // Check if the column has already been pushed
                const isAlreadyAdded = originalTimes.some(
                  (time) => time.start === col.start && time.end === col.end
                );
                if (!isAlreadyAdded) {
                  originalTimes.push({ start: col.start, end: col.end });
                }
              }
            });
          });
        }
      });
    
      return originalTimes; // Return all matching values
    };


    const updateTable = (tableIndex,type) => {
      const rowValues = type === 'section' ? sectionRowValues : teacherRowValues;
      const setRowValues = type === 'section' ? setTeacherRowValues : setSectionRowValues;

      console.log("type: ",type)
      let tableIndexObjects = []; 
      console.log("tableIndex: ",tableIndex)
      // iterate the edited table
      // get table index array of affected rows
      Object.values(rowValues).forEach((table, i) => {
        if (i === tableIndex) {
          console.log("table: ",table)
          Object.values(table).forEach((row) => {
            let skip = false;
          Object.entries(row).forEach(([colKey, col]) => {
            console.log("col: ",col)
            console.log("COLKEY: ",colKey)
            
            if (colKey === '0') {
              console.log("inside key 0: ")
              if (col && col.subjectID && col.teacherID && col.sectionID) {
                console.log("in key 0: ",col)
                const tableIndexObject = {
                  subjectID: col.subjectID,
                  teacherID: col.teacherID,
                  sectionID: col.sectionID,
                  start: col.start,
                  end: col.end
                };
                skip = true
                tableIndexObjects.push(tableIndexObject);     
              } 
            } else {
              console.log("inside key NOT 0: ")
              if (col.id && !skip) {
                console.log("in key NOT 0: ",col)
                let rowID = null

                console.log("rowID : ",rowID)
                const tableIndexObject = {
                  origId: col.origId,
                  subjectID: col.subjectID, 
                  sectionID: col.sectionID, 
                  teacherID: col.teacherID, 
                  start: col.start,
                  end: col.end,
                  subject: col.subject,
                  day: colKey,
                  section: col.section,
                  teacher: col.teacher
                };
                console.log("tableIndexObject: ",tableIndexObject)
                tableIndexObjects.push(tableIndexObject);     
              } 
            }
            
          });
        });
      }
     });
    //  console.log("field: ",type)
     console.log("tableIndexObjects: ",tableIndexObjects)

     console.log("setRowValues: ",setRowValues)

     const isColEmpty = (day, tableID) => {
      for (const obj of tableIndexObjects) {
        if (type === 'section') {
          if (tableID === obj.teacherID && obj.day === day) {
            console.log("func false");
            return false; // Stops the loop and function execution
          }
        } else if (type === 'teacher') {
          if (tableID === obj.sectionID && obj.day === day) {
            console.log("func false");
            return false; // Stops the loop and function execution
          }
        }
      }
      console.log("func true");
      return true; // No match found, return true
    };
    

     setRowValues((prev) => {
      const updatedRows = prev.map((rows) => {
        let conditionMet = false;
    
        // Create a new reference for the row if an update is made
        console.log("table: ",rows)
        const newRows = Object.entries(rows).reduce((acc, [key, value]) => {
          if (typeof value === "object" && value !== null && !conditionMet) {
            const updatedValue = { ...value }; // Clone the object to avoid mutation
            let tableID = null;
            for (const [colKey, col] of Object.entries(updatedValue)) {
              if (colKey !== '0') {
                if (type === 'section' && col.teacherID) {
                  tableID = col.teacherID;
                  break; // Stops the loop entirely
                } else if (type === 'teacher' && col.sectionID) {
                  tableID = col.sectionID;
                  break; // Stops the loop entirely
                }
              }
            }
            console.log("tableID :",tableID)
            console.log("row :",updatedValue)
            Object.keys(updatedValue).forEach((innerKey) => {
              const col = updatedValue[innerKey];
              console.log("innerkey: ",innerKey)
              console.log("col: ",col)
              tableIndexObjects.forEach((obj) => {
                if (innerKey === '0'){
                  if (
                    col &&
                    col.subjectID === obj.subjectID &&
                    col.teacherID === obj.teacherID &&
                    col.sectionID === obj.sectionID
                  ) {
                    // Update the column values
                    col.start = obj.start;
                    col.end = obj.end;
                    conditionMet = true;
                  }
                } else {
                  if (type ==='section') {
                    if (col && col.id && tableID === obj.teacherID) {
                      console.log("inside section col: ",col)
                      console.log("inside section obj: ",obj)

                      if (obj.day === innerKey && obj.origId === col.origId ) {
                        console.log("inside section col before: ",col)

                        col.subjectID = obj.subjectID,
                        col.sectionID = obj.sectionID,
                        col.section = obj.section,
                        col.subject = obj.subject,
                        col.start = obj.start,
                        col.end = obj.end
                        console.log("inside section col before: ",col)

                      }
                      else if (isColEmpty(innerKey,tableID)){
                        console.log("innerKey: ",innerKey)
                        console.log("obj.day: ",obj.day)
                        console.log("typeof(innerKey): ",typeof(innerKey))
                        console.log("typeof(obj.day): ",typeof(obj.day))

                        console.log("inside delete col before: ",col)
                        delete col.subject;
                        delete col.subjectID;
                        delete col.section;
                        delete col.sectionID;
                        console.log("inside delete after before: ",col)

                      }
                    } 
                  } else if (type === 'teacher'){
                    if (col && col.id && tableID === obj.sectionID) {
                      if (obj.day === innerKey && obj.start === col.start && obj.end == col.end) {
                        console.log("inside type teacher: ",col)
                        col.subjectID = obj.subjectID,
                        col.teacherID = obj.teacherID,
                        col.section = obj.section,
                        col.subject = obj.subject,
                        col.start = obj.start,
                        col.end = obj.end
                      } else if (isColEmpty(innerKey,tableID)) {
                        delete col.subject;
                        delete col.subjectID;
                        delete col.teacher;
                        delete col.teacherID;

                      }
                    } 
                  }
                }
              });
            });
            acc[key] = updatedValue; // Add the updated value to the new row
          } else {
            acc[key] = value; // Keep other properties as-is
          }
          return acc;
        }, []);
    
        return conditionMet ? newRows : rows; // Return the updated or original row
      });
    console.log("updatedRows in updateTable: ",updatedRows)
      return updatedRows; // Return a new array with updated rows
    });
    
    setRowValues((prev) => {
      const updatedRows = prev.map((rows) => {
        let conditionMet = false;
    
        const newRows = Object.entries(rows).reduce((acc, [key, value]) => {
          if (typeof value === "object" && value !== null && !conditionMet) {
            const updatedValue = { ...value }; // Clone the object to avoid mutation
            let tableID = null;
            for (const [colKey, col] of Object.entries(updatedValue)) {
              if (colKey !== '0') {
                if (type === 'section' && col.teacherID) {
                  tableID = col.teacherID;
                  break; // Stops the loop entirely
                } else if (type === 'teacher' && col.sectionID) {
                  tableID = col.sectionID;
                  break; // Stops the loop entirely
                }
              }
            }
            console.log("tableID :",tableID)
            console.log("row :",updatedValue)
            Object.keys(updatedValue).forEach((innerKey) => {
              const col = updatedValue[innerKey];
              console.log("innerkey: ",innerKey)
              console.log("col: ",col)
              tableIndexObjects.forEach((obj) => {
                if (innerKey === '0'){
                  if (
                    col &&
                    col.subjectID === obj.subjectID &&
                    col.teacherID === obj.teacherID &&
                    col.sectionID === obj.sectionID
                  ) {
                    // Update the column values
                    col.start = obj.start;
                    col.end = obj.end;
                    conditionMet = true;
                  }
                } else {
                  if (type ==='section') {
                    if (col && col.id && tableID === obj.teacherID) {
                      console.log("inside section col: ",col)
                      console.log("inside section obj: ",obj)

                      if (obj.day === innerKey && obj.origId === col.origId ) {
                        console.log("inside section col before: ",col)

                        col.subjectID = obj.subjectID,
                        col.sectionID = obj.sectionID,
                        col.section = obj.section,
                        col.subject = obj.subject,
                        col.start = obj.start,
                        col.end = obj.end
                        console.log("inside section col before: ",col)

                      }
                      else if (isColEmpty(innerKey,tableID)){
                        console.log("innerKey: ",innerKey)
                        console.log("obj.day: ",obj.day)
                        console.log("typeof(innerKey): ",typeof(innerKey))
                        console.log("typeof(obj.day): ",typeof(obj.day))

                        console.log("inside delete col before: ",col)
                        delete col.subject;
                        delete col.subjectID;
                        delete col.section;
                        delete col.sectionID;
                        console.log("inside delete after before: ",col)

                      }
                    } 
                  } else if (type === 'teacher'){
                    if (col && col.id && tableID === obj.sectionID) {
                      if (obj.day === innerKey && obj.start === col.start && obj.end == col.end) {
                        console.log("inside type teacher: ",col)
                        col.subjectID = obj.subjectID,
                        col.teacherID = obj.teacherID,
                        col.section = obj.section,
                        col.subject = obj.subject,
                        col.start = obj.start,
                        col.end = obj.end
                      } else if (isColEmpty(innerKey,tableID)) {
                        delete col.subject;
                        delete col.subjectID;
                        delete col.teacher;
                        delete col.teacherID;

                      }
                    } 
                  }
                }
              });
            });
            acc[key] = updatedValue; // Add the updated value to the new row
          } else {
            acc[key] = value; // Keep other properties as-is
          }
          return acc;
        }, []);
    
        return conditionMet ? newRows : rows; // Return the updated or original row
      });
    console.log("updatedRows in updateTable: ",updatedRows)
      return updatedRows; // Return a new array with updated rows
    });

    //update the empty rows to match 
    setRowValues((prev) => {
      const updatedRows = prev.map((rows) => {
        let conditionMet = false;
        let arrayOfNewRows = []
        const newRows = Object.entries(rows).reduce((acc, [key, value]) => {
          if (typeof value === "object" && value !== null && !conditionMet) {
            const updatedValue = { ...value }; // Clone the object to avoid mutation
            let tableID = null;
            for (const [colKey, col] of Object.entries(updatedValue)) {
              if (colKey !== '0') {
                if (type === 'section' && col.teacherID) {
                  tableID = col.teacherID;
                  break; // Stops the loop entirely
                } else if (type === 'teacher' && col.sectionID) {
                  tableID = col.sectionID;
                  break; // Stops the loop entirely
                }
              }
            }
            let start_end = [];
            Object.keys(updatedValue).forEach((innerKey) => {
              const col = updatedValue[innerKey];
              if (innerKey !== '0') {
                if (!isColEmpty(innerKey, tableID)) {
                  start_end.push(col.start);
                  start_end.push(col.end);
                }
              }
            });
            
            // Separate start and end values
            const startValues = start_end.filter((_, index) => index % 2 === 0); // Even indices
            const endValues = start_end.filter((_, index) => index % 2 !== 0); // Odd indices
            
            // Check if all start values are the same
            const allStartSame = new Set(startValues).size === 1;
            
            // Check if all end values are the same
            const allEndSame = new Set(endValues).size === 1;
            
            console.log("start end values: ",start_end)

            for (const obj of start_end) {
              console.log(`ID: ${obj.id}, Name: ${obj.name}, Age: ${obj.age}`);
              Object.keys(updatedValue).forEach((innerKey) => {
                const col = updatedValue[innerKey];
                
                  if(innerKey !== '0' && typeof col === 'object') {
                    if ((!allStartSame || !allEndSame) && isColEmpty(innerKey, tableID)) {
                      col.start = obj.start;
                      col.end = obj.end;
                      conditionMet = true;
                    } else if (isColEmpty(innerKey, tableID) && (col.start !== obj.start || obj.end !== col.end)) {
                      // add a new row with its key
                      arrayOfNewRows.push(col);  // Change `append` to `push`
                    }
                  }
              });
            }
            //add the new row here
            acc[key] = updatedValue; // Add the updated value to the new row
          } else {
            acc[key] = value; // Keep other properties as-is
          }
          return acc;
        }, []);
    
        if (arrayOfNewRows.length > 0) {
          newRows.push(...arrayOfNewRows);
        }
        return conditionMet ? newRows : rows; // Return the updated or original row
      });
      return updatedRows; // Return a new array with updated rows
    });
    

    }

                  // if (col && col.subjectID === subjectID && col.teacherID === teacherID && col.sectionID === sectionID) {

              //   col.start = updatedStart
              //   col.end = updatedEnd

              // }

      // Object.values(rowValues).forEach((table, i) => {
      //   if (tableIndexArray.includes(i)) {
      //     Object.values(table).forEach((row) => {
      //       if (typeof value === "object" && value !== null) {
      //         Object.entries(row).forEach(([colKey, col]) => {
      //           //find the affected teacher fields
      //             if (col && col.subjectID && col.teacherID && col.sectionID) {
      //               updateAffectedTables(tableIndex,col.subjectID,col.teacherID, col.sectionID, col.start , col.end)
      //             }
      //         });
      //       }
      //     });
      //   }
      // });
    // const updateAffectedTables = (tableIndex, subjectID , teacherID, sectionID,updatedStart,updatedEnd) => {

    //   setRowValues((prev) =>
    //     prev.map((rows, i) => {
    //       if (i === tableIndex) {
    //         // Create a copy of the row to avoid mutating state directly
    //       const updatedRow = [ ...rows ];
          
    //       Object.entries(updatedRow).forEach(([key, value]) => {
    //         if (typeof value === "object" && value !== null) {
    //           Object.keys(value).forEach((innerKey) => {
    //             const col = value[innerKey];

    //             if (col && col.subjectID === subjectID && col.teacherID === teacherID && col.sectionID === sectionID) {

    //               col.start = updatedStart
    //               col.end = updatedEnd

    //             }
    //           });
    //         }
    //       });
    //         return updatedRow;
    //       } else {
    //         return rows;

    //       }
    
    //     })
    //   );

    // }
    

    const handleDragOver = (tableID, rowID, colID, tableIndex) => {
      const setRowValues = field === 'section' ? setSectionRowValues : setTeacherRowValues;

      if (hoveredCol?.tableID === tableID && hoveredCol?.rowID === rowID) {
        // Reset hoveredCol if dragging over the same row
        setHoveredCol(null);
      } else if (hoveredCol?.tableID === tableID && hoveredCol?.rowID !== rowID) {
      
        setRowValues((prevTableValues) => {
          const updatedTableValues = [...prevTableValues]; // Create a copy of the data
    
          // Find the target table
          const targetTable = updatedTableValues.find((table) => table[table.length - 1] === tableID);
    
          if (targetTable) {
            // Find the target row and column
            const targetRow = Object.values(targetTable).find((row) => row?.id === rowID);
            const hoveredRow = Object.values(targetTable).find((row) => row?.id === hoveredCol.rowID);
    
            if (targetRow && hoveredRow) {
              // Swap the values of the target and hovered columns
              const targetCol = Object.values(targetRow).find((col) => col?.id === colID);
              const hoveredColData = Object.values(hoveredRow).find((col) => col?.id === hoveredCol.colID);
    
              if (targetCol && hoveredColData) {
                // Perform the swap by swapping the column data
                const targetColIndex = Object.values(targetRow).findIndex((col) => col?.id === colID) + 1;
                const hoveredColIndex = Object.values(hoveredRow).findIndex((col) => col?.id === hoveredCol.colID) + 1;
                
                // Swap the columns' values
                [targetRow[targetColIndex], hoveredRow[hoveredColIndex]] = [hoveredRow[hoveredColIndex], targetRow[targetColIndex]];
              }
            }
          }
          // Object.values(updatedTableValues).map((row) => console.log);
          // console.log("updatedTableValues time: ", updatedTableValues);

          return updatedTableValues; // Return the updated data
        });


        // update time slots
        if (field === 'section') {
          let currentStart = getStartTime(tableIndex,type); 

          setRowValues((prev) =>
            prev.map((rows, i) => {
              if (i === tableIndex) {
                // Create a copy of the row to avoid mutating state directly
              const updatedRow = [ ...rows ];
              
              Object.entries(updatedRow).forEach(([key, value]) => {
                if (typeof value === "object" && value !== null) {
                  let isIncremented = false;
                  let updatedStart;
                  let updatedEnd;
                  Object.keys(value).forEach((innerKey) => {
                    const slot = value[innerKey];
    
                    if (slot && slot.start != null && slot.end != null) {

                      if (!isIncremented){
                        const duration = slot.end - slot.start;
                        slot.start = currentStart;
                        updatedStart = slot.start;
                        slot.end = currentStart + duration;
                        updatedEnd = slot.end;
                        currentStart = slot.end;
    
                        isIncremented = true
                      } else {
                        slot.start = updatedStart
                        slot.end = updatedEnd
                      }

                      // Update the variable to point to the next "start" time
                    }
                  });
                }
              });
                return updatedRow;
              } else {
                return rows;
    
              }
        
            })
          );
        }

        setHoveredCol(null); // Reset hoveredCol after swapping
      } else {
        // Set hoveredCol when dragging starts
        setHoveredCol({ tableID, rowID, colID });
      }
    };

    const Column = ({tableID}) => {
        const days = ["Mon", "Tue", "Wed", "Thur", "Fri"];
    
        return (
            <div className="flex w-full">
                <div className="w-1/12 border border-primary-content text-center font-bold">
                    Time
                </div>
                <div className="w-10/12 flex border border-primary-content">
                    {days.map((day, index) => (
                        <div
                            key={`header-${index}-${tableID}`}
                            className="flex-1 border-r border-primary-content text-center font-bold"
                        >
                            {day}
                        </div>
                    ))}
                </div>
                <div className="w-1/12 border border-primary-content text-center font-bold">
                    Drag
                </div>
            </div>
        );
    };

    const teacherTimetableData = useMemo(() => addIdsToData(teacherTimetables,'teacher'), [teacherTimetables]);
    const sectionTimetableData = useMemo(() => addIdsToData(sectionTimetables,'section'), [sectionTimetables]);

    const teacherTableValues = useMemo(() => {
        const processed = Object.values(teacherTimetableData).flat().map((item) => {
            return Object.values(item).flat();
        });

        return processed;
    }, [teacherTimetableData]);

    const sectionTableValues = useMemo(() => {
      const processed = Object.values(sectionTimetableData).flat().map((item) => {
          return Object.values(item).flat();
      });

      return processed;
  }, [sectionTimetableData]);

  const [teacherRowValues, setTeacherRowValues] = useState(() =>
    teacherTableValues.map((timetable) => [...timetable])
  );
  
  const [sectionRowValues, setSectionRowValues] = useState(() =>
    sectionTableValues.map((timetable) => [...timetable])
  );


    useEffect(() => {
      setSectionRowValues(
        sectionTableValues.map((timetable) =>
          Array.isArray(timetable) && timetable[timetable.length - 1] !== 'section'
            ? [...timetable, 'section']
            : [...timetable]
        )
      );
    }, [teacherTableValues]);

    useEffect(() => {
      setTeacherRowValues(
        teacherTableValues.map((timetable) =>
          Array.isArray(timetable) && timetable[timetable.length - 1] !== 'teacher'
            ? [...timetable, 'teacher']
            : [...timetable]
        )
      );
    }, [teacherTableValues]);

    const updateRowValues = (tableIndex, newValues, tableID, containerName, type) => {
      const setRowValues = type === 'section' ? setSectionRowValues : setTeacherRowValues;
      console.log("type: ",type)
      console.log("newValues: ",newValues)
      console.log("tableIndex: ",tableIndex)
      console.log(sectionRowValues.length);
      if (type === 'teacher'){
        tableIndex = tableIndex - sectionRowValues.length
      }
      setRowValues((prev) => {
          return prev.map((rows, i) => {

              if (i === tableIndex) {
                console.log("rows targeted: ",rows)
                  return [
                      ...newValues,     
                      containerName,         
                      tableID,
                      type
                  ];
              } else {
                  return rows;
              }
          });
      });


      // update time slots
      if (type === 'section') {
        let currentStart = getStartTime(tableIndex,type); 

        setRowValues((prev) =>
          prev.map((rows, i) => {
            if (i === tableIndex) {
              // Create a copy of the row to avoid mutating state directly
            const updatedRow = [ ...rows ];
            
            Object.entries(updatedRow).forEach(([key, value]) => {
              if (typeof value === "object" && value !== null) {
                let isIncremented = false;
                let updatedStart;
                let updatedEnd;
                Object.keys(value).forEach((innerKey) => {
                  const slot = value[innerKey];
  
                  if (slot && slot.start != null && slot.end != null) {

  
                    if (!isIncremented){
                      const duration = slot.end - slot.start;
                      slot.start = currentStart;
                      updatedStart = slot.start;
                      slot.end = currentStart + duration;
                      updatedEnd = slot.end;
                      currentStart = slot.end;
  
                      isIncremented = true
                    } else {
                      slot.start = updatedStart
                      slot.end = updatedEnd
                    }
  
                    // Update the variable to point to the next "start" time
                  }
                });
              }
            });
            console.log("updatedRow in updateRowvalues: ",updatedRow)

              return updatedRow;
            } else {
              return rows;
  
            }
      
          })
        );
      } else if (type === 'teacher') {
        let originalTime = getOriginalTime(tableIndex, type); 
        setRowValues((prev) =>
          prev.map((rows, i) => {
            if (i === tableIndex) {
              // Create a copy of the row to avoid mutating state directly
            const updatedRow = [ ...rows ];
            
            Object.entries(updatedRow).forEach(([key, value]) => {
              if (typeof value === "object" && value !== null) {
                Object.keys(value).forEach((innerKey) => {
                  const slot = value[innerKey];

                  if (slot && slot.start != null && slot.end != null) {
                    slot.start = originalTime[key].start
                    slot.end = originalTime[key].end
  
                    // Update the variable to point to the next "start" time
                  }
                });
              }
            });
              return updatedRow;
            } else {
              return rows;
  
            }
      
          })
        );
      }
      console.log("sectionRowValues: ",sectionRowValues)

      setCurrentTableIndex(tableIndex);
      setMode("ROW");
    };
    

    useEffect(() => {
      console.log("sectionRowValues: ",sectionRowValues)
      setField('section');

      if (currentTableIndex !== null) {
        console.log("section edited: ")
          updateTable(currentTableIndex,'section');
          setCurrentTableIndex(null);
          setMode(null);
      }
  }, [sectionRowValues]); 

  useEffect(() => {
    // console.log("teacherRowValues: ",teacherRowValues)
    setField('teacher');
    if (currentTableIndex !== null) {
      console.log("teacher edited: ")
        updateTable(currentTableIndex,'teacher');
        setCurrentTableIndex(null);
        setMode(null);
    }
}, [teacherRowValues]); 

    const updateColValues = (tableIndex, rowIndex, newValue, rowId, elementRect, type) => {
      const setRowValues = type === 'section' ? setSectionRowValues : setTeacherRowValues;

      console.log("type: ",type)
        
        //   console.log("colRef is inside the elementRect bounds.");
          const incrementKeysAndSetDay = (obj) => {
            const keys = Object.keys(obj);
            if (keys[0] !== "0") return obj; // If the first key is not "0", return the object as is
      
            const updatedObj = {};
            Object.entries(obj).forEach(([key, value]) => {
              const newKey = parseInt(key, 10) + 1;
              updatedObj[newKey] = {
                ...value,
                day: String(newKey),
              };
            });
      
            return updatedObj;
          };
      
          setRowValues((prevRowValues) =>
            prevRowValues.map((table, i) => {
              if (i === tableIndex) {
                // console.log("Target table: ", table);
                // console.log("Target row: ", table[rowIndex]);
      
                const updatedRow = {
                  ...incrementKeysAndSetDay(newValue),
                  id: rowId,
                };
      
                // console.log("Updated row: ", updatedRow);
      
                table[rowIndex] = updatedRow;
                // console.log("Updated table row: ", table[rowIndex]);
              }
            //   console.log("New table: ", table);
              return table;
            })
          );
        //   console.log("New values: ", rowValues);
        setTimeout(() => {

            mousePositionRef.current = { x: 0, y: 0 };
        }, 50);

        setCurrentTableIndex(tableIndex);

    };
  
    const combinedArray = [...sectionRowValues, ...teacherRowValues];

    // Set combinedArray as the initial state

    console.log("combinedArray: ",combinedArray);
      return (
        <div className="overflow-x-auto">
            {
                (combinedArray).map((timetable, tableIndex) => {
                    const tableID = timetable[timetable.length - 2];
                    const containerName = timetable[timetable.length - 3];
                    const type = timetable[timetable.length - 1];
                    console.log("table: ",timetable)
                    console.log("type: ",type)
                    return (
                        <React.StrictMode key={tableIndex}>
                            <div className="flex gap-4 font-bold items-center text-center mt-10">
                                <div>{type}:</div>
                                <div className="text-lg text-accent">{containerName}</div>
                            </div>
                            <div className="border border-gray-300">
                                <Column tableID={tableID} />
                                <Reorder.Group
                                    axis="y"
                                    values={timetable}
                                    onReorder={(newRows) => updateRowValues(tableIndex, newRows, tableID, containerName, type)}
                                    className="w-full"
                                >
                                    {timetable.slice(0, -3).map((row, index) => (
                                        <Row
                                            key={row.id}
                                            row={row}
                                            tableID={tableID}
                                            updateColValues={updateColValues}
                                            rowIndex={index}
                                            tableIndex={tableIndex}
                                            dragStartFunc={handleDragStart}
                                            dragOverFunc={handleDragOver}
                                            hoveredCol={hoveredCol}
                                            setHoveredCol={setHoveredCol}
                                            type={type}
                                        />
                                    ))}
                                </Reorder.Group>
                            </div>
                        </React.StrictMode>
                    );
                })
            }
        </div>
    );
    
};


                    // console.log("containerName: ",containerName);

                // const rowsArray = Object.entries(rowTimetable).map(([key, value]) => {
                //     const { id, ...rest } = value; // Extract `id` but do not include it in the result
                //     return {
                //         ...rest, // Include only the remaining properties
                //     };
                // });
                // console.log(`Rendering timetable with containerName: ${containerName}`);

//     <div>
//     {items.map((group, index) => {
//         // Log the group for each iteration
//         console.log('Group:', group);
//         const [rowItems, setRowItems] = useState(group);
//         console.log('rowItems:', rowItems);

//         return (
//             <Reorder.Group axis="y" onReorder={setRowItems} values={rowItems} className='border border-gray-300' key={index}>
//                 {rowItems.map((item) => (
//                     <Item key={item.id} item={item} />
//                 ))}
//             </Reorder.Group>
//         );
//     })}
// </div>
    
    // const initialItems = {
    //   set1: ["🍅 Tomato", "🥒 Cucumber", "🧀 Cheese", "🥬 Lettuce"],
    //   set2: ["🍎 Apple", "🥔 Potato", "🥩 Steak", "🌽 Corn"]
    // };
    
    // // Convert the object values into an array of items, flatten it, and then group every 4 items into a new sub-array.
    // const itemsArray = Object.values(initialItems).flat().map((item, index) => {
    //   return { id: index + 1, name: item };
    // });
    
    // // Function to chunk the items into groups of 4
    // const chunkItems = (array, chunkSize) => {
    //   const result = [];
    //   for (let i = 0; i < array.length; i += chunkSize) {
    //     result.push(array.slice(i, i + chunkSize));
    //   }
    //   return result;
    // };
    
    // // Group items into sub-arrays of 4
    // const groupedItems = chunkItems(itemsArray, 4);
    
    // console.log(groupedItems);
    
    // const [items, setItems] = useState(groupedItems);
    // console.log(items);

    // return (
    //     <div>
    //         {items.map((group, index) => {
    //             // Log the group for each iteration
    //             console.log('Group:', group);
    //             const [rowItems, setRowItems] = useState(group);
    //             console.log('rowItems:', rowItems);

    //             return (
    //                 <Reorder.Group axis="y" onReorder={setRowItems} values={rowItems} className='border border-gray-300' key={index}>
    //                     {rowItems.map((item) => (
    //                         <Item key={item.id} item={item} />
    //                     ))}
    //                 </Reorder.Group>
    //             );
    //         })}
    //     </div>
    // );
    
    

export default GeneratedTimetable;