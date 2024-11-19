import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPrograms,
  addProgram,
  editProgram,
  removeProgram,
  updateSectionsForProgramYear,
} from '@features/programSlice';
import debounce from 'debounce';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import SearchableDropdownToggler from './searchableDropdown';
import { getTimeSlotIndex, getTimeSlotString } from './timeSlotMapper';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';

const AddProgramContainer = ({
  close,
  reduxField,
  reduxFunction,
  morningStartTime,
  afternoonStartTime,
}) => {
  const inputNameRef = useRef();
  const subjects = useSelector((state) => state.subject.subjects);
  const programs = useSelector((state) => state.program.programs);
  const dispatch = useDispatch();

  const numOfSchoolDays = localStorage.getItem('numOfSchoolDays');

  const [inputValue, setInputValue] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState({
    7: [],
    8: [],
    9: [],
    10: [],
  });
  const [fixedDays, setFixedDays] = useState({
    7: {},
    8: {},
    9: {},
    10: {},
  });
  const [fixedPositions, setFixedPositions] = useState({
    7: {},
    8: {},
    9: {},
    10: {},
  });
  const [selectedShifts, setSelectedShifts] = useState({
    7: 0, // 0 for AM, 1 for PM
    8: 0,
    9: 0,
    10: 0,
  });
  const [startTimes, setStartTimes] = useState({
    7: morningStartTime,
    8: morningStartTime,
    9: morningStartTime,
    10: morningStartTime,
  });

  const handleStartTimeChange = (grade, time) => {
    setStartTimes((prevTimes) => ({
      ...prevTimes,
      [grade]: time,
    }));
  };

  const renderTimeOptions = (shift) => {
    const times =
      shift === 0
        ? Array.from({ length: 36 }, (_, i) => {
          const hours = 6 + Math.floor(i / 6);
          const minutes = (i % 6) * 10;
          return `${String(hours).padStart(2, '0')}:${String(
            minutes
          ).padStart(2, '0')} AM`;
        })
        : ['01:00 PM'];
  
    return times.map((time) => (
      <option key={time} value={time}>
        {time}
      </option>
    ));
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubjectSelection = (grade, selectedList) => {
    setSelectedSubjects((prevState) => ({
      ...prevState,
      [grade]: selectedList, // Update selected subjects for the grade
    }));
  
    setFixedDays((prevState) => ({
      ...prevState,
      [grade]: selectedList.reduce((acc, subjectID) => {
        acc[subjectID] = prevState[grade]?.[subjectID] || {
          0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, // Sequence is Monday to Sunday
      };
        return acc;
      }, {}),
    }));

    setFixedPositions((prevState) => ({
      ...prevState,
      [grade]: selectedList.reduce((acc, subjectID) => {
        acc[subjectID] = prevState[grade]?.[subjectID] ?? 0;
        return acc;
      }, {}),
    }));
  };

  const handleShiftSelection = (grade, shift) => {
    setSelectedShifts((prevState) => ({
      ...prevState,
      [grade]: shift,
    }));

    const defaultTime = shift === 0 ? morningStartTime : afternoonStartTime;
    setStartTimes((prevTimes) => ({
      ...prevTimes,
      [grade]: defaultTime,
    }));
  };

  const handleFixedDaysSelection = (grade, subjectID, dayIndex) => {
    setFixedDays((prevState) => ({
      ...prevState,
      [grade]: {
        ...prevState[grade],
        [subjectID]: {
          ...prevState[grade][subjectID],
          [dayIndex]: prevState[grade]?.[subjectID]?.[dayIndex] === 1 ? 0 : 1,
        },
      },
    }));
  };

  const handleAddEntry = () => {
    if (!inputValue.trim()) {
      alert('Program name cannot be empty');
      return;
    } else if (selectedSubjects[7].length === 0) {
      alert('Select at least one subject for grade 7');
      return;
    } else if (selectedShifts[7] === undefined || !startTimes[7]) {
      alert('Select shift and start time for grade 7');
      return;
    } else if (selectedSubjects[8].length === 0) {  
      alert('Select at least one subject for grade 8'); 
      return;
    } else if (selectedShifts[8] === undefined || !startTimes[8]) {
      alert('Select shift and start time for grade 8');
      return;
    } else if (selectedSubjects[9].length === 0) {  
      alert('Select at least one subject for grade 9'); 
      return;
    } else if (selectedShifts[9] === undefined || !startTimes[9]) {
      alert('Select shift and start time for grade 9');
      return;
    } else if (selectedSubjects[10].length === 0) {  
      alert('Select at least one subject for grade 10'); 
      return;
    } else if (selectedShifts[10] === undefined || !startTimes[10]) {
      alert('Select shift and start time for grade 10');
      return;
    }

    const duplicateProgram = Object.values(programs).find(
      (program) => program.program.trim().toLowerCase() === inputValue.trim().toLowerCase()
    );

    if (duplicateProgram) {
      alert('A program with this name already exists.');
    } else {
      dispatch(
        reduxFunction({
          [reduxField[0]]: inputValue,
          7: {
            subjects: selectedSubjects[7],
            fixedDays: fixedDays[7],
            fixedPositions: fixedPositions[7],
            shift: selectedShifts[7],
            startTime: getTimeSlotIndex(startTimes[7]),
          },
          8: {
            subjects: selectedSubjects[8],
            fixedDays: fixedDays[8],
            fixedPositions: fixedPositions[8],
            shift: selectedShifts[8],
            startTime: getTimeSlotIndex(startTimes[8]),
          },
          9: {
            subjects: selectedSubjects[9],
            fixedDays: fixedDays[9],
            fixedPositions: fixedPositions[9],
            shift: selectedShifts[9],
            startTime: getTimeSlotIndex(startTimes[9]),
          },
          10: {
            subjects: selectedSubjects[10],
            fixedDays: fixedDays[10],
            fixedPositions: fixedPositions[10],
            shift: selectedShifts[10],
            startTime: getTimeSlotIndex(startTimes[10]),
          },
        })
      );
      // Set success message and show the modal
      //  setModalMessage('Program added successfully!');
      //  setShowSuccessModal(true);
      // close();
    }
  };

  const handleReset = () => {
    setInputValue('');
    setSelectedSubjects({
      7: [],
      8: [],
      9: [],
      10: [],
    });
    setSelectedShifts({
      7: 0,
      8: 0,
      9: 0,
      10: 0,
    });
    setStartTimes({
      7: morningStartTime,
      8: morningStartTime,
      9: morningStartTime,
      10: morningStartTime,
    });
  };

  useEffect(() => {
    if (inputNameRef.current) {
      inputNameRef.current.focus();
    }
  }, []);

  // useEffect(() => {
  //   console.log('fixedDays:', fixedDays);
  // }, [fixedDays]);

  // useEffect(() => {
  //   console.log('fixedPositions:', fixedPositions);
  // }, [fixedPositions]);

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="p-6">
      {/* Header section with centered "Add {reduxField}" */}
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-bold text-center w-full">
          Add New {reduxField[0].charAt(0).toUpperCase() + reduxField[0].slice(1).toLowerCase()}
        </h3>
      </div>
    
      {/* Input field for program name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Program Name:</label>
        <input
          type="text"
          ref={inputNameRef}
          className="input input-bordered w-full"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter Program name"
        />
      </div>
    
      {/* Subject and shift management */}
      <div className="text-sm flex flex-col space-y-4">
        {[7, 8, 9, 10].map((grade) => (
          <div key={grade} className="bg-white shadow-md rounded-lg p-4">
            <h3 className="font-bold mb-2">{`Grade ${grade}`}</h3>
    
            {/* Shift selection */}
            <div className="mt-2 mb-2">
              <label className="mr-2">Shift:</label>
              <label className="mr-2">
                <input
                  type="radio"
                  value={selectedShifts[grade]}
                  checked={selectedShifts[grade] === 0}
                  onChange={() => handleShiftSelection(grade, 0)}
                />
                AM
              </label>
              <label>
                <input
                  type="radio"
                  value={selectedShifts[grade]}
                  checked={selectedShifts[grade] === 1}
                  onChange={() => handleShiftSelection(grade, 1)}
                />
                PM
              </label>
            </div>
    
            {/* Start time selection */}
            <div className="mt-2">
              <label className="mr-2">Start Time:</label>
              <select
                className="input input-bordered"
                value={startTimes[grade]}
                onChange={(e) => handleStartTimeChange(grade, e.target.value)}
              >
                {renderTimeOptions(selectedShifts[grade])}
              </select>
            </div>

            {/* Subject selection */}
            <div className="flex items-center mb-2 py-4 flex-wrap">
              <div className="m-1">
                <SearchableDropdownToggler
                  selectedList={selectedSubjects[grade]}
                  setSelectedList={(list) => handleSubjectSelection(grade, list)}
                />
              </div>
            </div>
            <div>
              <table className="min-w-full bg-white font-normal border border-gray-300">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">Subject</th>
                    <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">Duration (min)</th>
                    <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">Weekly Minutes</th>
                    <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">Fixed Days</th>
                    <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">Fixed Position</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubjects[grade] && Array.isArray(selectedSubjects[grade]) ? (
                    selectedSubjects[grade].map((subjectID) => (
                      <tr key={subjectID}>
                        {/* Subject */}
                        <td className='p-2'> 
                          {subjects[subjectID]?.subject || 'Unknown Subject, ID: ' + subjectID}
                        </td>
                        {/* Duration */}
                        <td className='p-2'>
                          {subjects[subjectID]?.classDuration || 'N/A'}
                        </td>
                        {/* Weekly Minutes */}
                        <td className='p-2'>
                          {subjects[subjectID]?.weeklyMinutes || 'N/A'}
                        </td>
                        {/* Fixed Days */}
                        <td className="p-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                            .slice(0, numOfSchoolDays)
                            .map((day, index) => {
                              const weeklyMinutes = subjects[subjectID]?.weeklyMinutes || 0;
                              const classDuration = subjects[subjectID]?.classDuration || 1;
                              const requiredClasses = Math.ceil(weeklyMinutes / classDuration);

                              const disabledDays = requiredClasses >= numOfSchoolDays;
                              const selectedDaysCount = Object.values(fixedDays[grade]?.[subjectID] || {}).filter(Boolean).length;

                              return (
                                <label key={index} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="mr-1"
                                    checked={fixedDays[grade]?.[subjectID]?.[index] || false}
                                    onChange={() => handleFixedDaysSelection(grade, subjectID, index)}
                                    disabled={disabledDays ||selectedDaysCount >= requiredClasses && !fixedDays[grade]?.[subjectID]?.[index]} // Disable if the condition is met
                                  />
                                  {day}
                                </label>
                              );
                            })}
                        </td>
                        {/* Fixed Position */}
                        <td className='p-2'>
                          <input
                            type="number"
                            className="input input-bordered w-full"
                            min={0}
                            max={selectedSubjects[grade]?.length || 0}
                            value={fixedPositions[grade]?.[subjectID] || 0}
                            onChange={(e) => {
                              const value = Math.min(
                                Math.max(0, parseInt(e.target.value) || 0),
                                selectedSubjects[grade]?.length || 0
                              );
                              setFixedPositions((prevState) => ({
                                ...prevState,
                                [grade]: {
                                  ...prevState[grade],
                                  [subjectID]: value,
                                },
                              }));
                            }}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <div>No subjects selected</div>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    
      {/* Add button centered at the bottom */}
      <div className="flex mt-6 justify-center gap-2">
        <button className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary flex items-center" onClick={handleAddEntry}>
            <div>Add {reduxField[0]}</div>
            <IoAdd size={20} className="ml-2" />
          </button>
        </div>
      </div>

        {/* Render SuccessModal if showSuccessModal is true */}
        {/* {showSuccessModal && (
          <SuccessModal
            message={modalMessage}
            onClose={handleCloseModal}
          />
        )} */}
    </div>
  
  );  
};

const ProgramListContainer = ({ editable = false }) => {
  const dispatch = useDispatch();

  const { programs, status: programStatus } = useSelector(
    (state) => state.program
  );

  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );

  const numOfSchoolDays = localStorage.getItem('numOfSchoolDays');
  const morningStartTime =
    localStorage.getItem('morningStartTime') || '06:00 AM';
  const afternoonStartTime =
    localStorage.getItem('afternoonStartTime') || '01:00 PM';

  const [editProgramId, setEditProgramId] = useState(null);
  const [editProgramValue, setEditProgramValue] = useState('');
  const [editProgramCurr, setEditProgramCurr] = useState([]);
  const [searchProgramResult, setSearchProgramResult] = useState(programs);
  const [searchProgramValue, setSearchProgramValue] = useState('');
  const [openAddProgramContainer, setOpenAddProgramContainer] = useState(false);

  const [selectedShifts, setSelectedShifts] = useState({
    7: 0,
    8: 0,
    9: 0,
    10: 0,
  });
  const [startTimes, setStartTimes] = useState({
    7: '06:00 AM',
    8: '06:00 AM',
    9: '06:00 AM',
    10: '06:00 AM',
  });

  const [editFixedDays, setEditFixedDays] = useState({
    7: {},
    8: {},
    9: {},
    10: {},
  });
  const [editFixedPositions, setEditFixedPositions] = useState({ 
    7: {},
    8: {},
    9: {},  
    10: {},
  });

  const renderTimeOptions = (shift) => {
    const times =
      shift === 0
        ? Array.from({ length: 36 }, (_, i) => {
          const hours = 6 + Math.floor(i / 6);
          const minutes = (i % 6) * 10;
          return `${String(hours).padStart(2, '0')}:${String(
            minutes
          ).padStart(2, '0')} AM`;
        })
        : ['01:00 PM'];
  
    return times.map((time) => (
      <option key={time} value={time}>
        {time}
      </option>
    ));
  };

  const handleSubjectSelection = (grade, selectedList) => {
    console.log('grade', grade);
    console.log('selectedList', selectedList);

    setEditProgramCurr((prevState) => ({
      ...prevState,
      [grade]: selectedList, // Update selected subjects for the grade
    }));
  
    setEditFixedDays((prevState) => ({
      ...prevState,
      [grade]: selectedList.reduce((acc, subjectID) => {
        acc[subjectID] = prevState[grade]?.[subjectID] || {
          0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, // Sequence is Monday to Sunday
      };
        return acc;
      }, {}),
    }));

    setEditFixedPositions((prevState) => ({
      ...prevState,
      [grade]: selectedList.reduce((acc, subjectID) => {
        acc[subjectID] = prevState[grade]?.[subjectID] ?? 0;
        return acc;
      }, {}),
    }));
  };

  const handleFixedDaysSelection = (grade, subjectID, dayIndex) => {
    setEditFixedDays((prevState) => ({
      ...prevState,
      [grade]: {
        ...prevState[grade],
        [subjectID]: {
          ...prevState[grade][subjectID],
          [dayIndex]: prevState[grade]?.[subjectID]?.[dayIndex] === 1 ? 0 : 1,
        },
      },
    }));
  };

  const handleShiftSelection = (grade, shift) => {
    setSelectedShifts((prevState) => ({
      ...prevState,
      [grade]: shift,
    }));

    const defaultTime = shift === 0 ? morningStartTime : afternoonStartTime;
    setStartTimes((prevState) => ({
      ...prevState,
      [grade]: defaultTime,
    }));
  };

  const handleEditProgramClick = (program) => {
    setEditProgramId(program.id);
    setEditProgramValue(program.program);
    setEditProgramCurr({
      7: program[7]?.subjects || [],
      8: program[8]?.subjects || [],
      9: program[9]?.subjects || [],
      10: program[10]?.subjects || [],
    });
    setStartTimes({
      7: getTimeSlotString(program[7]?.startTime || 0),
      8: getTimeSlotString(program[8]?.startTime || 0),
      9: getTimeSlotString(program[9]?.startTime || 0),
      10: getTimeSlotString(program[10]?.startTime || 0),
    });
    setSelectedShifts({
      7: program[7]?.shift || 0,
      8: program[8]?.shift || 0,
      9: program[9]?.shift || 0,
      10: program[10]?.shift || 0,
    });
    setEditFixedDays({
      7: program[7]?.fixedDays || {},
      8: program[8]?.fixedDays || {},
      9: program[9]?.fixedDays || {},
      10: program[10]?.fixedDays || {},
    });
    setEditFixedPositions({
      7: program[7]?.fixedPositions || {},
      8: program[8]?.fixedPositions || {},
      9: program[9]?.fixedPositions || {},
      10: program[10]?.fixedPositions || {},
    });
  };

  const handleSaveProgramEditClick = (programId) => {

    if (!editProgramValue.trim()) {
      alert('Program name cannot be empty');
      return;
    } else if (editProgramCurr[7].length === 0) {
      alert('Select at least one subject for grade 7');
      return;
    } else if (selectedShifts[7] === undefined || !startTimes[7]) {
      alert('Select shift and start time for grade 7');
      return;
    } else if (editProgramCurr[8].length === 0) {  
      alert('Select at least one subject for grade 8'); 
      return;
    } else if (selectedShifts[8] === undefined || !startTimes[8]) {
      alert('Select shift and start time for grade 8');
      return;
    } else if (editProgramCurr[9].length === 0) {  
      alert('Select at least one subject for grade 9'); 
      return;
    } else if (selectedShifts[9] === undefined || !startTimes[9]) {
      alert('Select shift and start time for grade 9');
      return;
    } else if (editProgramCurr[10].length === 0) {  
      alert('Select at least one subject for grade 10'); 
      return;
    } else if (selectedShifts[10] === undefined || !startTimes[10]) {
      alert('Select shift and start time for grade 10');
      return;
    }

    const currentProgram = programs[programId]?.program || '';
    
    if (editProgramValue.trim().toLowerCase() === currentProgram.trim().toLowerCase()) {
      dispatch(
        editProgram({
          programId,
          updatedProgram: {
            program: editProgramValue,
            7: {
              subjects: editProgramCurr[7],
              fixedDays: editFixedDays[7],
              fixedPositions: editFixedPositions[7],
              shift: selectedShifts[7],
              startTime: getTimeSlotIndex(startTimes[7] || '06:00 AM'),
            },
            8: {
              subjects: editProgramCurr[8],
              fixedDays: editFixedDays[8],
              fixedPositions: editFixedPositions[8],
              shift: selectedShifts[8],
              startTime: getTimeSlotIndex(startTimes[8] || '06:00 AM'),
            },
            9: {
              subjects: editProgramCurr[9],
              fixedDays: editFixedDays[9],
              fixedPositions: editFixedPositions[9],
              shift: selectedShifts[9],
              startTime: getTimeSlotIndex(startTimes[9] || '06:00 AM'),
            },
            10: {
              subjects: editProgramCurr[10],
              fixedDays: editFixedDays[10],
              fixedPositions: editFixedPositions[10],
              shift: selectedShifts[10],
              startTime: getTimeSlotIndex(startTimes[10] || '06:00 AM'),
            },
          },
        })
      );
      // dispatch(
      //   updateSectionsForProgramYear({
      //     programId,
      //     yearLevel: 7,
      //     newSubjects: editProgramCurr[7], // Subjects for Grade 7
      //   })
      // );
      // dispatch(
      //   updateSectionsForProgramYear({
      //     programId,
      //     yearLevel: 8,
      //     newSubjects: editProgramCurr[8], // Subjects for Grade 8
      //   })
      // );
      // dispatch(
      //   updateSectionsForProgramYear({
      //     programId,
      //     yearLevel: 9,
      //     newSubjects: editProgramCurr[9], // Subjects for Grade 9
      //   })
      // );
      // dispatch(
      //   updateSectionsForProgramYear({
      //     programId,
      //     yearLevel: 10,
      //     newSubjects: editProgramCurr[10], // Subjects for Grade 10
      //   })
      // );
  
      setEditProgramId(null);
      setEditProgramValue('');
      setEditProgramCurr([]);
      setStartTimes({
        7: '06:00 AM',
        8: '06:00 AM',
        9: '06:00 AM',
        10: '06:00 AM',
      });
      setSelectedShifts({
        7: 0,
        8: 0,
        9: 0,
        10: 0,
      });
      setEditFixedDays({
        7: {},
        8: {},
        9: {},
        10: {},
      });
      setEditFixedPositions({
        7: {},
        8: {},
        9: {},
        10: {},
      });
    } else {
      const duplicateProgram = Object.values(programs).find(
        (program) => program.program.trim().toLowerCase() === editProgramValue.trim().toLowerCase()
      );

      if (duplicateProgram) {
        alert('A program with this name already exists!');
      } else if (editProgramValue.trim()) {
        dispatch(
          editProgram({
            programId,
            updatedProgram: {
              program: editProgramValue,
              7: {
                subjects: editProgramCurr[7],
                fixedDays: editFixedDays[7],
                fixedPositions: editFixedPositions[7],
                shift: selectedShifts[7],
                startTime: getTimeSlotIndex(startTimes[7] || '06:00 AM'),
              },
              8: {
                subjects: editProgramCurr[8],
                fixedDays: editFixedDays[8],
                fixedPositions: editFixedPositions[8],
                shift: selectedShifts[8],
                startTime: getTimeSlotIndex(startTimes[8] || '06:00 AM'),
              },
              9: {
                subjects: editProgramCurr[9],
                fixedDays: editFixedDays[9],
                fixedPositions: editFixedPositions[9],
                shift: selectedShifts[9],
                startTime: getTimeSlotIndex(startTimes[9] || '06:00 AM'),
              },
              10: {
                subjects: editProgramCurr[10],
                fixedDays: editFixedDays[10],
                fixedPositions: editFixedPositions[10],
                shift: selectedShifts[10],
                startTime: getTimeSlotIndex(startTimes[10] || '06:00 AM'),
              },
            },
          })
        );
        // dispatch(
        //   updateSectionsForProgramYear({
        //     programId,
        //     yearLevel: 7,
        //     newSubjects: editProgramCurr[7], // Subjects for Grade 7
        //   })
        // );
        // dispatch(
        //   updateSectionsForProgramYear({
        //     programId,
        //     yearLevel: 8,
        //     newSubjects: editProgramCurr[8], // Subjects for Grade 8
        //   })
        // );
        // dispatch(
        //   updateSectionsForProgramYear({
        //     programId,
        //     yearLevel: 9,
        //     newSubjects: editProgramCurr[9], // Subjects for Grade 9
        //   })
        // );
        // dispatch(
        //   updateSectionsForProgramYear({
        //     programId,
        //     yearLevel: 10,
        //     newSubjects: editProgramCurr[10], // Subjects for Grade 10
        //   })
        // );
    
        setEditProgramId(null);
        setEditProgramValue('');
        setEditProgramCurr([]);
        setStartTimes({
          7: '06:00 AM',
          8: '06:00 AM',
          9: '06:00 AM',
          10: '06:00 AM',
        });
        setSelectedShifts({
          7: 0,
          8: 0,
          9: 0,
          10: 0,
        });
        setEditFixedDays({
          7: {},
          8: {},
          9: {},
          10: {},
        });
        setEditFixedPositions({
          7: {},
          8: {},
          9: {},
          10: {},
        });
      }
    }

  };

  const handleCancelProgramEditClick = () => {
    setEditProgramId(null);
    setEditProgramValue('');
    setEditProgramCurr([]);
    setStartTimes({
      7: '06:00 AM',
      8: '06:00 AM',
      9: '06:00 AM',
      10: '06:00 AM',
    });
    setSelectedShifts({
      7: 0,
      8: 0,
      9: 0,
      10: 0,
    });
    setEditFixedDays({
      7: {},
      8: {},
      9: {},
      10: {},
    });
    setEditFixedPositions({
      7: {},
      8: {},
      9: {},
      10: {},
    });
  };

  const debouncedSearch = useCallback(
    debounce((searchValue, programs, subjects) => {
      setSearchProgramResult(
        filterObject(programs, ([, program]) => {
          if (!searchValue) return true;

          const programsSubjectsName = Object.values(program)
            .filter((gradeData) => Array.isArray(gradeData.subjects)) // Ensure we're working with subjects array for each grade
            .flatMap((gradeData) =>
              gradeData.subjects.map(
                (subjectID) => subjects[subjectID]?.subject || ''
              )
            )
            .join(' ');

          const escapedSearchValue = escapeRegExp(searchValue)
            .split('\\*')
            .join('.*');

          const pattern = new RegExp(escapedSearchValue, 'i');

          return (
            pattern.test(program.program) || pattern.test(programsSubjectsName)
          );
        })
      );
    }, 200),
    []
  );

  useEffect(() => {
    console.log('editFixedDays', editFixedDays, 'editFixedPositions', editFixedPositions);
  }, [editFixedDays, editFixedPositions]);

  useEffect(() => {
    debouncedSearch(searchProgramValue, programs, subjects);
  }, [searchProgramValue, programs, debouncedSearch, subjects]);

  useEffect(() => {
    if (programStatus === 'idle') {
      dispatch(fetchPrograms());
    }
  }, [programStatus, dispatch]);

  const itemsPerPage = 3; // Change this to adjust the number of items per page
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate total pages
  const totalPages = Math.ceil(Object.values(searchProgramResult).length / itemsPerPage);
  
  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Object.entries(searchProgramResult).slice(indexOfFirstItem, indexOfLastItem);
  
  return (
    <React.Fragment>
    <div className="">

    <div className="flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5">
      {/* Pagination */}
      {currentItems.length > 0 && (
        <div className="join flex justify-center mb-4 md:mb-0">
          <button
            className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
              }
              handleCancelProgramEditClick();
            }}
            disabled={currentPage === 1}
          >
            «
          </button>
          <button className="join-item btn">
            Page {currentPage} of {totalPages}
          </button>
          <button
            className={`join-item btn ${currentPage === totalPages ? 'btn-disabled' : ''}`}
            onClick={() => {
              if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
              }
              handleCancelProgramEditClick();
            }}
            disabled={currentPage === totalPages}
          >
            »
          </button>
        </div>
      )}

      {currentItems.length === 0 && currentPage > 1 && (
        <div className="hidden">
          {setCurrentPage(currentPage - 1)}
        </div>
      )}
        {/* Search Program */}
        <div className="flex-grow w-full md:w-1/3 lg:w-1/4">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <input
              type="text"
              className="grow p-3 text-sm w-full"
              placeholder="Search Program"
              value={searchProgramValue}
              onChange={(e) => setSearchProgramValue(e.target.value)}
            />
            <IoSearch className="text-xl" />
          </label>
        </div>

        {editable && (
          <div className="w-full mt-4 md:mt-0 md:w-auto">
            <button
              className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
              onClick={() => document.getElementById('add_program_modal').showModal()}
            >
              Add Program <IoAdd size={20} className="ml-2" />
            </button>

            <dialog id="add_program_modal" className="modal modal-bottom sm:modal-middle">
              <div className="modal-box" style={{ width: '50%', maxWidth: 'none' }}>
                <AddProgramContainer
                  close={() => document.getElementById('add_program_modal').close()}
                  reduxField={['program', 'subjects']}
                  reduxFunction={addProgram}
                  morningStartTime={morningStartTime}
                  afternoonStartTime={afternoonStartTime}
                />
                <div className="modal-action w-full">
                  <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => document.getElementById('add_program_modal').close()}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </dialog>
          </div>
        )}
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="table table-sm table-zebra w-full">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th className="w-20">Program ID</th>
              <th className="w-48">Program</th>
              <th>Subjects</th>
              {editable && <th className="w-32">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {Object.values(searchProgramResult).length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No Programs Found
                </td>
              </tr>
            ) : (
              currentItems.map(([, program], index) => (
                <tr key={program.id} className="group hover">
                  <td>{index + 1 + indexOfFirstItem}</td>
                  <th>{program.id}</th>
                  <td className='max-w-28'>
                    {editProgramId === program.id ? (
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        value={editProgramValue}
                        onChange={(e) => setEditProgramValue(e.target.value)}
                      />
                    ) : (
                      program.program
                    )}
                  </td>
                  <td className=''> {/* This can remain as is for additional styling */}
                    {editProgramId === program.id ? (
                      <>
                        {[7, 8, 9, 10].map((grade) => (
                          <div key={grade} className="my-2">
                            <h3 className="font-bold">{`Grade ${grade}`}</h3>
                            <div className="mt-2">
                              <label className="mr-2">Shift:</label>
                              <label className="mr-2">
                                <input
                                  type="radio"
                                  value={selectedShifts[grade]}
                                  checked={selectedShifts[grade] === 0}
                                  onChange={() =>
                                    handleShiftSelection(grade, 0)
                                  }
                                />
                                AM
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  value={selectedShifts[grade]}
                                  checked={selectedShifts[grade] === 1}
                                  onChange={() =>
                                    handleShiftSelection(grade, 1)
                                  }
                                />
                                PM
                              </label>
                            </div>
                            <div>
                              <label>Start Time:</label>
                              <select
                                value={startTimes[grade]}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setStartTimes((prevState) => ({
                                    ...prevState,
                                    [grade]: newValue,
                                  }));
                                }}
                              >
                                {renderTimeOptions(selectedShifts[grade])}
                              </select>
                            </div>

                            <SearchableDropdownToggler
                              selectedList={editProgramCurr[grade]}
                              setSelectedList={(list) => handleSubjectSelection(grade, list)}
                            />

                            <div className="overflow-x-auto mt-2">
                              <table className="min-w-full bg-white border border-gray-300">
                                <thead>
                                  <tr>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Subject</th>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Duration</th>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Weekly Minutes</th>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Fixed Days</th>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Fixed Position</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.isArray(editProgramCurr[grade]) && editProgramCurr[grade].length > 0 ? (
                                    editProgramCurr[grade].map((subjectID) => {
                                      const fixedDaysForSubject = editFixedDays?.[grade]?.[subjectID];
                                      const fixedPositionForSubject = editFixedPositions?.[grade]?.[subjectID];

                                      return (
                                        <tr key={subjectID}>
                                          {/* Subject ID */}
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {subjects[subjectID]?.subject || 'Unknown Subject, ID: ' + subjectID}
                                          </td>

                                          {/* Duration */}
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {subjects[subjectID]?.classDuration || ''}
                                          </td>

                                          {/* Weekly Minutes */}
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {subjects[subjectID]?.weeklyMinutes || ''} 
                                          </td>

                                          {/* Fixed Days */}
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                                            .slice(0, numOfSchoolDays)
                                            .map((day, index) => {
                                              const weeklyMinutes = subjects[subjectID]?.weeklyMinutes || 0;
                                              const classDuration = subjects[subjectID]?.classDuration || 1;
                                              const requiredClasses = Math.ceil(weeklyMinutes / classDuration);

                                              const disabledDays = requiredClasses >= numOfSchoolDays;
                                              const selectedDaysCount = Object.values(editFixedDays[grade]?.[subjectID] || {}).filter(Boolean).length;

                                              return (
                                                <label key={index} className="flex items-center">
                                                  <input
                                                    type="checkbox"
                                                    className="mr-1"
                                                    checked={editFixedDays[grade]?.[subjectID]?.[index] || false}
                                                    onChange={() => handleFixedDaysSelection(grade, subjectID, index)}
                                                    disabled={disabledDays ||selectedDaysCount >= requiredClasses && !editFixedDays[grade]?.[subjectID]?.[index]} // Disable if the condition is met
                                                  />
                                                  {day}
                                                </label>
                                              );
                                            })}
                                          </td>
                                          
                                          {/* Fixed Position */}
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {/* {fixedPositionForSubject || ''} */}
                                            <input
                                              type="number"
                                              className="input input-bordered w-full"
                                              min={0}
                                              max={editProgramCurr[grade]?.length || 0}
                                              value={editFixedPositions[grade]?.[subjectID] || 0}
                                              onChange={(e) => {
                                                const value = Math.min(
                                                  Math.max(0, parseInt(e.target.value) || 0),
                                                  editProgramCurr[grade]?.length || 0
                                                );
                                                setEditFixedPositions((prevState) => ({
                                                  ...prevState,
                                                  [grade]: {
                                                    ...prevState[grade],
                                                    [subjectID]: value,
                                                  },
                                                }));
                                              }}
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan="4" className="py-2 px-4 text-center border-b border-gray-200">
                                        No subjects selected
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            
                            
                          </div>
                        ))}
                      </>
                    ) : (
                      <div>
                        {[7, 8, 9, 10].map((grade) => (
                          <div key={grade} className="my-4">
                            <h3 className="font-bold">{`Grade ${grade}`}</h3>
                            <div className="flex items-center mt-2">
                              <span className="inline-block bg-blue-500 text-white text-xs font-semibold py-1 px-3 rounded-lg">
                                {program[`${grade}`]?.shift === 0 ? 'AM' : 'PM'}
                              </span>
                              <span className="ml-2 text-sm font-medium">
                                {getTimeSlotString(
                                  program[`${grade}`]?.startTime || 0
                                )}
                              </span>
                            </div>

                            {/* Table for Subjects */}
                            <div className="overflow-x-auto mt-2">
                              <table className="min-w-full bg-white border border-gray-300">
                                <thead>
                                  <tr>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Subject</th>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Duration</th>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Weekly Minutes</th>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Fixed Days</th>
                                    <th className="py-2 px-4 border-b border-gray-200 text-left">Fixed Position</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.isArray(program[`${grade}`]?.subjects) && program[`${grade}`].subjects.length > 0 ? (
                                    program[`${grade}`].subjects.map((subjectID) => {

                                      const fixedDaysForSubject = program[`${grade}`]?.fixedDays?.[subjectID];
                                      const fixedPositionForSubject = program[`${grade}`]?.fixedPositions?.[subjectID];

                                      return (
                                        <tr key={subjectID}>
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {subjects[subjectID]?.subject || 'Unknown Subject, ID: ' + subjectID}
                                          </td>
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {subjects[subjectID]?.classDuration || ''}
                                          </td>
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {subjects[subjectID]?.weeklyMinutes || ''} 
                                          </td>
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                              return fixedDaysForSubject[index] === 1 ? <div key={day}>• {day}</div> : null;
                                            })}
                                          </td>
                                          <td className="py-2 px-4 border-b border-gray-200">
                                            {fixedPositionForSubject || ''}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan="4" className="py-2 px-4 text-center border-b border-gray-200">
                                        No subjects selected
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  {editable && (
                    <td>
                      {editProgramId === program.id ? (
                        <>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleSaveProgramEditClick(program.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={handleCancelProgramEditClick}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-xs btn-ghost text-blue-500"
                            onClick={() => handleEditProgramClick(program)}
                          >
                            <RiEdit2Fill size={20} />
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => dispatch(removeProgram(program.id))}
                          >
                            <RiDeleteBin7Line size={20} />
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  </React.Fragment>
  );
};

export default ProgramListContainer;
