import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import {
  fetchSections,
  addSection,
  editSection,
  removeSection,
} from '@features/sectionSlice';
import { fetchPrograms } from '@features/programSlice';
import { fetchSubjects } from '@features/subjectSlice';
import SearchableDropdownToggler from './searchableDropdown';
import { getTimeSlotString, getTimeSlotIndex } from './timeSlotMapper';
import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

const AddSectionContainer = ({ close, reduxField, reduxFunction }) => {
  const inputNameRef = useRef();
  const dispatch = useDispatch();

  const { programs, status: programStatus } = useSelector(
    (state) => state.program
  );

  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );
  
  const [inputValue, setInputValue] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYearLevel, setSelectedYearLevel] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedShift, setSelectedShift] = useState(0);
  const [selectedStartTime, setSelectedStartTime] = useState(0);
  const [subjectUnits, setSubjectUnits] = useState({});

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleAddEntry = () => {
    const formattedSubjectUnits = {};

    selectedSubjects.forEach((subjectID) => {
      formattedSubjectUnits[subjectID] = subjectUnits[subjectID] || 0;
    });

    dispatch(
      reduxFunction({
        [reduxField[0]]: inputValue,
        program: selectedProgram,
        year: parseInt(selectedYearLevel, 10),
        subjects: formattedSubjectUnits,
        shift: selectedShift,
        startTime: selectedStartTime,
      })
    );

    close();
  };

  useEffect(() => {
    if (inputNameRef.current) {
      inputNameRef.current.focus();
    }
  }, []);

  useEffect(() => {
    console.log('Selected Program:', selectedProgram);
    console.log('Selected Year Level:', selectedYearLevel);

    if (selectedProgram && selectedYearLevel) {
      const program = Object.values(programs).find(
        (p) => p.id === selectedProgram
      );

      // console.log('program[selectedYearLevel].subjects:', program[selectedYearLevel].subjects);

      if (program) {
        setSelectedSubjects(program[selectedYearLevel].subjects || []); // Ensure it accesses the subjects correctly
        setSelectedShift(program[selectedYearLevel].shift || 0);
        setSelectedStartTime(program[selectedYearLevel].startTime || 0);
      } else {
        setSelectedSubjects([]);
      }
    }
  }, [selectedProgram, selectedYearLevel, programs]);

  useEffect(() => {
    const newSubjectUnits = {};
    selectedSubjects.forEach((subject) => {
      if (!subjectUnits.hasOwnProperty(subject)) {
        newSubjectUnits[subject] = 5;
      } else {
        newSubjectUnits[subject] = subjectUnits[subject];
      }
    });
    if (JSON.stringify(newSubjectUnits) !== JSON.stringify(subjectUnits)) {
      setSubjectUnits(newSubjectUnits);
    }
  }, [selectedSubjects]);


  useEffect(() => {
    if (programStatus === 'idle') {
      dispatch(fetchPrograms());
    }
  }, [programStatus, dispatch]);

  useEffect(() => {
    if (subjectStatus === 'idle') {
      dispatch(fetchSubjects());
    }
  }, [subjectStatus, dispatch]);

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

      <div className="mt-3">
        <label className="label">
          <span className="label-text">Select Program</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(parseInt(e.target.value, 10))}
        >
          <option value="" disabled>
            Select a Program
          </option>
          {Object.keys(programs).map((key) => (
            <option key={programs[key].id} value={programs[key].id}>
              {programs[key].program}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label className="label">
          <span className="label-text">Select Year Level</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={selectedYearLevel}
          onChange={(e) => setSelectedYearLevel(e.target.value)}
        >
          <option value="" disabled>
            Select a Year Level
          </option>
          {[7, 8, 9, 10].map((level) => (
            <option key={level} value={level}>
              Grade {level}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <div className="m-1">Selected Subjects: </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {selectedSubjects.map((subjectID) => (
            <div key={subjectID} className="join">
              <div className="join-item w-72 bg-primary text-primary-content px-2 text-center content-center text-xs md:text-base leading-3">
                {subjects[subjectID]?.subject || 'Unknown Subject'}
              </div>
              <input
                type="text"
                placeholder="Units"
                className="input w-full join-item"
                value={subjectUnits[subjectID] ?? 0}
                onChange={(e) => {
                  setSubjectUnits({
                    ...subjectUnits,
                    [subjectID]: parseInt(e.target.value, 10),
                  });
                }}
              />

              <div className="join join-item join-vertical flex w-20 items-center border-y border-r border-primary">
                <button
                  className="join-item h-1/2 w-full bg-secondary hover:brightness-110 flex justify-center"
                  onClick={() => {
                    setSubjectUnits({
                      ...subjectUnits,
                      [subjectID]: subjectUnits[subjectID] + 1,
                    });
                  }}
                >
                  <BiChevronUp size={24} />
                </button>
                <button
                  className="join-item h-1/2 w-full bg-secondary hover:brightness-110 flex justify-center"
                  onClick={() => {
                    setSubjectUnits({
                      ...subjectUnits,
                      [subjectID]: subjectUnits[subjectID] - 1,
                    });
                  }}
                >
                  <BiChevronDown size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary mt-4" onClick={handleAddEntry}>
        <div>Add {reduxField[0]}</div>
        <IoAdd size={20} />
      </button>
    </div>
  );
};

const SectionListContainer = ({ editable = false }) => {
  const dispatch = useDispatch();
  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );
  const { sections, status: sectionStatus } = useSelector(
    (state) => state.section
  );
  const { programs, status: programStatus } = useSelector(
    (state) => state.program
  );

  const [openAddSectionContainer, setOpenAddSectionContainer] = useState(false);

  const [editSectionProg, setEditSectionProg] = useState('');
  const [editSectionYear, setEditSectionYear] = useState('');

  const [editSectionId, setEditSectionId] = useState('');
  const [editSectionValue, setEditSectionValue] = useState('');
  const [editSectionSubjects, setEditSectionSubjects] = useState([]);
  const [editSectionUnits, setEditSectionUnits] = useState({});
  const [editSectionShift, setEditSectionShift] = useState(0);
  const [editSectionStartTime, setEditSectionStartTime] = useState("");

  const [searchSectionResult, setSearchSectionResult] = useState(sections);
  const [searchSectionValue, setSearchSectionValue] = useState('');

  const handleEditSectionClick = (section) => {
    setEditSectionId(section.id);
    setEditSectionValue(section.section);

    setEditSectionProg(section.program);
    setEditSectionYear(section.year);

    setEditSectionShift(section.shift);
    setEditSectionStartTime(getTimeSlotString(section.startTime));

    // console.log("Section ID:", section.id);

    // Convert section.subjects object keys to an array
    const subjectsArray = Object.keys(section.subjects); // Get the subject IDs from the object

    const subjectsWithUnits = subjectsArray.map((subjectId) => ({
      id: subjectId,
      name: subjects[subjectId]?.subject || 'Unknown Subject',
      units: section.subjects[subjectId] || 0,
    }));

    setEditSectionSubjects(subjectsWithUnits.map(({ id }) => id));
    // console.log('Subjects with units for section:', subjectsWithUnits);

    setEditSectionUnits(
      subjectsWithUnits.reduce((acc, { id, units }) => {
        acc[id] = units;
        return acc;
      }, {})
    );
  };

  const handleSaveSectionEditClick = (sectionId) => {
    const updatedUnits = {};
    editSectionSubjects.forEach((subjectId) => {
      updatedUnits[subjectId] = editSectionUnits[subjectId] || 0;
    });

    dispatch(
      editSection({
        sectionId,
        updatedSection: {
          id: sectionId,
          program: editSectionProg,
          section: editSectionValue,
          subjects: updatedUnits,
          year: editSectionYear,
          shift: editSectionShift,
          startTime: getTimeSlotIndex(editSectionStartTime),
        },
      })
    );

    // Reset the editing state
    setEditSectionId('');
    setEditSectionValue('');
    setEditSectionProg('');
    setEditSectionYear('');
    setEditSectionSubjects([]);
    setEditSectionUnits({});
  };

  const handleCancelSectionEditClick = () => {
    setEditSectionId(null);
    setEditSectionValue('');
    setEditSectionSubjects([]);
    setEditSectionUnits({});
  };

  const renderTimeOptions = () => {
    const times =
      editSectionShift === 0
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

  const debouncedSearch = useCallback(
    debounce((searchValue, sections, subjects) => {
      setSearchSectionResult(
        filterObject(sections, ([, section]) => {
          const escapedSearchValue = escapeRegExp(searchValue)
            .split('\\*')
            .join('.*');

          const sectionSubjectsName = Object.keys(section.subjects)
            .map((subjectID) => subjects[subjectID]?.subject || '')
            .join(' ');

          const pattern = new RegExp(escapedSearchValue, 'i');

          // Check if program or year level matches the search value
          const programMatches = pattern.test(section.program);
          const yearLevelMatches = pattern.test(section.year); // Ensure `year` is the correct property name

          return (
            pattern.test(section.section) ||
            programMatches ||
            yearLevelMatches ||
            pattern.test(sectionSubjectsName)
          );
        })
      );
    }, 200),
    []
  );

  useEffect(() => {
    debouncedSearch(searchSectionValue, sections, subjects);
  }, [searchSectionValue, sections, debouncedSearch, subjects]);

  useEffect(() => {
    if (sectionStatus === 'idle') {
      dispatch(fetchSections());
    }
  }, [sectionStatus, dispatch]);

  useEffect(() => {
    if (programStatus === 'idle') {
      dispatch(fetchPrograms());
    }
  }, [programStatus, dispatch]);

  useEffect(() => {
    if (subjectStatus === 'idle') {
      dispatch(fetchSubjects());
    }
  }, [subjectStatus, dispatch]);

  // useEffect(() => {
  //   if (sectionStatus === 'succeeded') {
  //     console.log('Fetched sections:', sections);
  //   }
  // }, [sectionStatus, sections]);

  // useEffect(() => {
  //   if (programStatus === 'succeeded') {
  //     console.log('Fetched programs:', programs);
  //   }
  // }, [programStatus, programs]);

  return (
    <React.Fragment>
      <div>
        {/* Search Filter */}
        <label className="input input-sm input-bordered flex items-center mt-5">
          <input
            type="text"
            className="grow"
            placeholder="Search Section by Name, Program, Year Level or Subject List"
            value={searchSectionValue}
            onChange={(e) => setSearchSectionValue(e.target.value)}
          />
          <IoSearch />
        </label>

        {/* Table */}
        <table className="table table-sm table-zebra">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Section ID</th>
              <th>Section</th>
              <th>Program</th>
              <th>Year</th>
              <th>Subjects</th>
              {editable && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {Object.values(searchSectionResult).length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  No sections found
                </td>
              </tr>
            ) : (
              Object.entries(searchSectionResult).map(([_, section], index) => (
                <tr key={section.id} className="group hover">
                  <td>{index + 1}</td>
                  <th>{section.id}</th>
                  <td>
                    {editSectionId === section.id ? (
                      <>
                        <input
                          type="text"
                          value={editSectionValue}
                          onChange={(e) => setEditSectionValue(e.target.value)}
                          className="input input-bordered input-sm w-full"
                        />
                        hahaha
                        <div className="mt-2">
                          <label className="mr-2">Shift:</label>
                          <label className="mr-2">
                            <input
                              type="radio"
                              value={editSectionShift}
                              checked={editSectionShift === 0}
                              onChange={() =>
                                setEditSectionShift(0)
                              }
                            />
                            AM
                          </label>
                          <label>
                            <input
                              type="radio"
                              value={editSectionShift}
                              checked={editSectionShift === 1}
                              onChange={() =>
                                setEditSectionShift(1)
                              }
                            />
                            PM
                          </label>
                        </div>
                        <div>
                          <label>Start Time:</label>
                          <select
                            value={editSectionStartTime}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setEditSectionStartTime(newValue);
                            }}
                          >
                            {renderTimeOptions()}
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-base font-bold">
                          {section.section}
                        </div>
                        <div className="flex items-center mt-2">
                          <span className="inline-block bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-lg">
                            {section.shift === 0
                              ? 'AM'
                              : 'PM'}{' '}
                            {/* Display SHIFT */}
                          </span>
                          <span className="ml-2 text-sm font-medium">
                            {getTimeSlotString(
                              section.startTime
                            )}{' '}
                            {/* Display SECTION STARTING TIME */}
                          </span>
                        </div>
                      </>
                    )}
                  </td>
                  <td>
                    {editSectionId === section.id ? (
                      <select
                        value={editSectionProg}
                        onChange={(e) => {
                          const newProgram = parseInt(e.target.value, 10);
                          setEditSectionProg(newProgram);

                          const subjectsForProgramAndYear =
                            programs[newProgram]?.[section.year]?.subjects ||
                            [];
                          setEditSectionSubjects(subjectsForProgramAndYear);

                          const updatedUnits = {};
                          subjectsForProgramAndYear.forEach((subjectId) => {
                            updatedUnits[subjectId] = 0;
                          });
                          setEditSectionUnits(updatedUnits);
                        }}
                        className="select select-bordered"
                      >
                        {Object.entries(programs).map(([key, program]) => (
                          <option key={key} value={key}>
                            {program.program}
                          </option>
                        ))}
                      </select>
                    ) : (
                      programs[section.program]?.program || 'Unknown Program'
                    )}
                  </td>
                  <td>
                    {editSectionId === section.id ? (
                      <select
                        value={editSectionYear}
                        onChange={(e) => {
                          const newYear = parseInt(e.target.value, 10);
                          setEditSectionYear(newYear);

                          const subjectsForProgramAndYear =
                            programs[editSectionProg]?.[newYear]?.subjects ||
                            [];
                          setEditSectionSubjects(subjectsForProgramAndYear);

                          const updatedUnits = {};
                          subjectsForProgramAndYear.forEach((subjectId) => {
                            updatedUnits[subjectId] = 0;
                          });
                          setEditSectionUnits(updatedUnits);
                        }}
                        className="select select-bordered"
                      >
                        {[7, 8, 9, 10].map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    ) : (
                      section.year
                    )}
                  </td>
                  <td className="flex gap-1 flex-wrap">
                    {editSectionId === section.id ? (
                      <div>
                        {editSectionSubjects.map((subjectId) => (
                          <div
                            key={subjectId}
                            className="px-2 flex items-center border border-gray-500 border-opacity-30"
                          >
                            <div className="mr-2">
                              {subjects[subjectId]?.subject ||
                                'Unknown Subject'}
                            </div>
                            <input
                              type="number"
                              value={editSectionUnits[subjectId] || 0}
                              onChange={(e) =>
                                setEditSectionUnits({
                                  ...editSectionUnits,
                                  [subjectId]: parseInt(e.target.value, 10),
                                })
                              }
                              className="input input-xs w-16"
                            />
                            <span className="text-xs ml-1">unit(s)</span>
                            <button
                              className="btn btn-xs btn-outline ml-2"
                              onClick={() => {
                                setEditSectionSubjects(
                                  editSectionSubjects.filter(
                                    (id) => id !== subjectId
                                  )
                                );
                                const updatedUnits = {
                                  ...editSectionUnits,
                                };
                                delete updatedUnits[subjectId];
                                setEditSectionUnits(updatedUnits);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      subjectStatus === 'succeeded' &&
                      Object.keys(section.subjects).map((subjectID) => (
                        <div
                          key={subjectID}
                          className="px-2 flex items-center border border-gray-500 border-opacity-30"
                        >
                          <div className="mr-2">
                            {subjects[subjectID]?.subject || 'Unknown Subject'}
                          </div>
                          <div className="text-xs opacity-75">
                            <span className="mr-1">
                              {section.subjects[subjectID]}
                            </span>
                            <span>unit(s)</span>
                          </div>
                        </div>
                      ))
                    )}
                  </td>
                  
                  {editable
                    &&
                    <td className="w-28 text-right">
                      {editSectionId === section.id ? (
                        <>
                          <button
                            className="btn btn-xs btn-ghost text-green-500"
                            onClick={() => handleSaveSectionEditClick(section.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={handleCancelSectionEditClick}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => handleEditSectionClick(section)}
                          >
                            <RiEdit2Fill size={20} />
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => dispatch(removeSection(section.id))}
                          >
                            <RiDeleteBin7Line size={20} />
                          </button>
                        </>
                      )}
                    </td>
                  }
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add button */}
      {editable 
        &&
        <div>
          {openAddSectionContainer ? (
            <AddSectionContainer
              close={() => setOpenAddSectionContainer(false)}
              reduxField={['section', 'subjects', 'units']}
              reduxFunction={addSection}
            />
          ) : (
            <div className="flex justify-end mt-3">
              <button
                className="btn btn-secondary my-5"
                onClick={() => {
                  setOpenAddSectionContainer(true);
                }}
              >
                Add Section
                <IoAdd size={26} />
              </button>
            </div>
          )}
        </div>
      }
      
    </React.Fragment>
  );
};

export default SectionListContainer;
