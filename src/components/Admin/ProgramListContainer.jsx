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
  const dispatch = useDispatch();

  const [inputValue, setInputValue] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState({
    7: [],
    8: [],
    9: [],
    10: [],
  });
  const [selectedShifts, setSelectedShifts] = useState({
    7: 'AM',
    8: 'AM',
    9: 'AM',
    10: 'AM',
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
      shift === 'AM'
        ? Array.from({ length: 30 }, (_, i) => {
            const hours = 6 + Math.floor(i / 6);
            const minutes = (i % 6) * 10;
            return `${String(hours).padStart(2, '0')}:${String(
              minutes
            ).padStart(2, '0')} AM`;
          })
        : Array.from({ length: 8 }, (_, i) => {
            const hours = 1 + i;
            return `${String(hours).padStart(2, '0')}:00 PM`;
          });

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
      [grade]: selectedList,
    }));
  };

  const handleShiftSelection = (grade, shift) => {
    setSelectedShifts((prevState) => ({
      ...prevState,
      [grade]: shift,
    }));

    const defaultTime = shift === 'AM' ? morningStartTime : afternoonStartTime;
    setStartTimes((prevTimes) => ({
      ...prevTimes,
      [grade]: defaultTime,
    }));
  };

  const handleAddEntry = () => {
    dispatch(
      reduxFunction({
        [reduxField[0]]: inputValue,
        7: {
          subjects: selectedSubjects[7],
          shift: selectedShifts[7] === 'AM' ? 0 : 1,
          startTime: getTimeSlotIndex(startTimes[7]),
        },
        8: {
          subjects: selectedSubjects[8],
          shift: selectedShifts[8] === 'AM' ? 0 : 1,
          startTime: getTimeSlotIndex(startTimes[8]),
        },
        9: {
          subjects: selectedSubjects[9],
          shift: selectedShifts[9] === 'AM' ? 0 : 1,
          startTime: getTimeSlotIndex(startTimes[9]),
        },
        10: {
          subjects: selectedSubjects[10],
          shift: selectedShifts[10] === 'AM' ? 0 : 1,
          startTime: getTimeSlotIndex(startTimes[10]),
        },
      })
    );
    close();
  };

  useEffect(() => {
    if (inputNameRef.current) {
      inputNameRef.current.focus();
    }
  }, []);

  return (
    <div className="card bg-base-200 p-4 my-5">
      <div className="flex justify-between">
        <h1>Add {reduxField[0].toUpperCase()}</h1>
        <button className="btn btn-xs btn-circle btn-outline" onClick={close}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-4 h-4 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
      <input
        type="text"
        ref={inputNameRef}
        placeholder={`${reduxField[0]} Name`}
        required
        className="input input-bordered input-sm w-full max-w-xs"
        value={inputValue}
        onChange={handleInputChange}
      />

      <div className="flex flex-col">
        {[7, 8, 9, 10].map((grade) => (
          <div key={grade} className="my-3">
            <h2>{`Grade ${grade}`}</h2>
            <div className="flex items-center">
              <div className="m-1">Selected Subjects: </div>
              {selectedSubjects[grade] &&
              Array.isArray(selectedSubjects[grade]) ? (
                selectedSubjects[grade].map((subjectID) => (
                  <div key={subjectID} className="badge badge-secondary m-1">
                    {subjects[subjectID]?.subject || subjectID}
                  </div>
                ))
              ) : (
                <div>No subjects selected</div>
              )}
            </div>

            <SearchableDropdownToggler
              selectedList={selectedSubjects[grade]}
              setSelectedList={(list) => handleSubjectSelection(grade, list)}
            />

            <div className="mt-2">
              <label className="mr-2">Shift:</label>
              <label className="mr-2">
                <input
                  type="radio"
                  name={`shift-${grade}`}
                  value="AM"
                  checked={selectedShifts[grade] === 'AM'}
                  onChange={() => handleShiftSelection(grade, 'AM')}
                />
                AM
              </label>
              <label>
                <input
                  type="radio"
                  name={`shift-${grade}`}
                  value="PM"
                  checked={selectedShifts[grade] === 'PM'}
                  onChange={() => handleShiftSelection(grade, 'PM')}
                />
                PM
              </label>
            </div>
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
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={handleAddEntry}>
        <div>Add {reduxField[0]}</div>
        <IoAdd size={20} />
      </button>
    </div>
  );
};

const ProgramListContainer = () => {
  const dispatch = useDispatch();

  const { programs, status: programStatus } = useSelector(
    (state) => state.program
  );

  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );

  const morningStartTime = localStorage.getItem('morningStartTime') || '06:00 AM';
  const afternoonStartTime = localStorage.getItem('afternoonStartTime') || '01:00 PM';

  const [editProgramId, setEditProgramId] = useState(null);
  const [editProgramValue, setEditProgramValue] = useState('');
  const [editProgramCurr, setEditProgramCurr] = useState([]);
  const [searchProgramResult, setSearchProgramResult] = useState(programs);
  const [searchProgramValue, setSearchProgramValue] = useState('');
  const [openAddProgramContainer, setOpenAddProgramContainer] = useState(false);

  const [selectedShifts, setSelectedShifts] = useState({
    7: 'AM',
    8: 'AM',
    9: 'AM',
    10: 'AM',
  });

  const [startTimes, setStartTimes] = useState({
    7: '06:00 AM',
    8: '06:00 AM',
    9: '06:00 AM',
    10: '06:00 AM',
  });

  const renderTimeOptions = (shift) => {
    const times =
      shift === 'AM'
        ? Array.from({ length: 30 }, (_, i) => {
            const hours = 6 + Math.floor(i / 6);
            const minutes = (i % 6) * 10;
            return `${String(hours).padStart(2, '0')}:${String(
              minutes
            ).padStart(2, '0')} AM`;
          })
        : Array.from({ length: 8 }, (_, i) => {
            const hours = 1 + i;
            return `${String(hours).padStart(2, '0')}:00 PM`;
          });

    return times.map((time) => (
      <option key={time} value={time}>
        {time}
      </option>
    ));
  };

  const handleShiftSelection = (grade, shift) => {
    setSelectedShifts((prevState) => ({
      ...prevState,
      [grade]: shift,
    }));

    const defaultTime = shift === 'AM' ? morningStartTime : afternoonStartTime;
    setStartTimes((prevState) => ({
      ...prevState,
      [grade]: defaultTime,
    }));
  };

  const handleEditProgramClick = (program) => {
    // console.log(program);
    setEditProgramId(program.id);
    setEditProgramValue(program.program);
    setEditProgramCurr({
      7: program[7]?.subjects || [],
      8: program[8]?.subjects || [],
      9: program[9]?.subjects || [],
      10: program[10]?.subjects || [],
    });
    setStartTimes({
      7: getTimeSlotString(program[7]?.startTime),
      8: getTimeSlotString(program[8]?.startTime),
      9: getTimeSlotString(program[9]?.startTime),
      10: getTimeSlotString(program[10]?.startTime),
    });
    setSelectedShifts({
      7: program[7]?.shift === 0 ? 'AM' : 'PM',
      8: program[8]?.shift === 0 ? 'AM' : 'PM',
      9: program[9]?.shift === 0 ? 'AM' : 'PM',
      10: program[10]?.shift === 0 ? 'AM' : 'PM',
    });
  };

  const handleSaveProgramEditClick = (programId) => {
    dispatch(
      editProgram({
        programId,
        updatedProgram: {
          program: editProgramValue,
          7: {
            subjects: editProgramCurr[7],
            shift: selectedShifts[7] === 'AM' ? 0 : 1,
            startTime: getTimeSlotIndex(startTimes[7] || 0),
          },
          8: {
            subjects: editProgramCurr[8],
            shift: selectedShifts[8] === 'AM' ? 0 : 1,
            startTime: getTimeSlotIndex(startTimes[8] || 0),
          },
          9: {
            subjects: editProgramCurr[9],
            shift: selectedShifts[9] === 'AM' ? 0 : 1,
            startTime: getTimeSlotIndex(startTimes[9] || 0),
          },
          10: {
            subjects: editProgramCurr[10],
            shift: selectedShifts[10] === 'AM' ? 0 : 1,
            startTime: getTimeSlotIndex(startTimes[10] || 0),
          },
        },
      })
    );

    // Dispatch updateSectionsForProgramYear for each year level (7 to 10)
    dispatch(
      updateSectionsForProgramYear({
          programId,
          yearLevel: 7,
          newSubjects: editProgramCurr[7], // Subjects for Grade 7
      })
    );
    dispatch(
        updateSectionsForProgramYear({
            programId,
            yearLevel: 8,
            newSubjects: editProgramCurr[8], // Subjects for Grade 8
        })
    );
    dispatch(
        updateSectionsForProgramYear({
            programId,
            yearLevel: 9,
            newSubjects: editProgramCurr[9], // Subjects for Grade 9
        })
    );
    dispatch(
        updateSectionsForProgramYear({
            programId,
            yearLevel: 10,
            newSubjects: editProgramCurr[10], // Subjects for Grade 10
        })
    );

    setEditProgramId(null);
    setEditProgramValue('');
    setEditProgramCurr([]);
  };

  const handleCancelProgramEditClick = () => {
    setEditProgramId(null);
    setEditProgramValue('');
    setEditProgramCurr([]);
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
    debouncedSearch(searchProgramValue, programs, subjects);
  }, [searchProgramValue, programs, debouncedSearch, subjects]);

  useEffect(() => {
    if (programStatus === 'idle') {
      dispatch(fetchPrograms());
    }
  }, [programStatus, dispatch]);

  // useEffect(() => {
  //     console.log("afternoonStartTime: ", afternoonStartTime);
  // }, [afternoonStartTime]);

  // useEffect(() => {
  //     console.log("editProgramId: ", editProgramId);
  // }, [editProgramId]);

  // useEffect(() => {
  //     console.log("editProgramValue: ", editProgramValue);
  // }, [editProgramValue]);

  // useEffect(() => {
  //     console.log("editProgramCurr: ", editProgramCurr);
  // }, [editProgramCurr]);

  // useEffect(() => {
  //     console.log("startTimes: ", startTimes);
  // }, [startTimes]);

  // useEffect(() => {
  //     console.log("selectedShifts: ", selectedShifts);
  // }, [selectedShifts]);

  return (
    <React.Fragment>
      <div className="">
        {/* Search Filter */}
        <label className="input input-sm input-bordered flex items-center gap-2">
          <input
            type="text"
            className="grow"
            placeholder="Search Program by Name or Subjects"
            value={searchProgramValue}
            onChange={(e) => setSearchProgramValue(e.target.value)}
          />
          <IoSearch />
        </label>
        {/* Table */}
        <table className="table table-sm table-zebra">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Program ID</th>
              <th>Program</th>
              <th>Subjects</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(searchProgramResult).length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No programs found
                </td>
              </tr>
            ) : (
              Object.entries(searchProgramResult).map(([, program], index) => (
                <tr key={program.id} className="group hover">
                  <td>{index + 1}</td>
                  <th>{program.id}</th>
                  <td>
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

                  <td>
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
                                  name={`shift-${grade}`}
                                  value="AM"
                                  checked={selectedShifts[grade] === 'AM'}
                                  onChange={() =>
                                    handleShiftSelection(grade, 'AM')
                                  }
                                />
                                AM
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  name={`shift-${grade}`}
                                  value="PM"
                                  checked={selectedShifts[grade] === 'PM'}
                                  onChange={() =>
                                    handleShiftSelection(grade, 'PM')
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

                            <div className="m-1">Selected Subjects:</div>
                            {editProgramCurr[grade] &&
                            Array.isArray(editProgramCurr[grade]) &&
                            subjects ? (
                              editProgramCurr[grade].map((subjectID) => (
                                <div
                                  key={subjectID}
                                  className="badge badge-secondary m-1"
                                >
                                  {subjects[subjectID]?.subject || subjectID}
                                </div>
                              ))
                            ) : (
                              <div>No subjects selected</div>
                            )}

                            <SearchableDropdownToggler
                              selectedList={editProgramCurr[grade]}
                              setSelectedList={(list) =>
                                setEditProgramCurr((prevState) => ({
                                  ...prevState,
                                  [grade]: list,
                                }))
                              }
                            />
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

                            <div className="mt-2">
                              {Array.isArray(program[`${grade}`]?.subjects) &&
                              program[`${grade}`].subjects.length > 0 ? (
                                program[`${grade}`].subjects.map(
                                  (subjectID) => (
                                    <div
                                      key={subjectID}
                                      className="badge badge-secondary m-1"
                                    >
                                      {subjects[subjectID]?.subject ||
                                        subjectID}
                                    </div>
                                  )
                                )
                              ) : (
                                <div>No subjects selected</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="flex justify-end gap-2">
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
                          className="btn btn-sm btn-outline"
                          onClick={() => handleEditProgramClick(program)}
                        >
                          <RiEdit2Fill />
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => dispatch(removeProgram(program.id))}
                        >
                          <RiDeleteBin7Line />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div>
        {openAddProgramContainer ? (
          <AddProgramContainer
            close={() => setOpenAddProgramContainer(false)}
            reduxField={['program', 'subjects']}
            reduxFunction={addProgram}
            morningStartTime={morningStartTime}
            afternoonStartTime={afternoonStartTime}
          />
        ) : (
          <div className="flex justify-end mt-3">
            <button
              className="btn btn-secondary my-5"
              onClick={() => setOpenAddProgramContainer(true)}
            >
              Add Program
              <IoAdd size={26} />
            </button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default ProgramListContainer;
