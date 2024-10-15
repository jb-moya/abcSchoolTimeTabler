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
import { fetchTeachers } from '@features/teacherSlice';
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
  const { teachers, status: teacherStatus } = useSelector(
    (state) => state.teacher
  );
  
  const [inputValue, setInputValue] = useState('');
  const [selectedAdviser, setSelectedAdviser] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYearLevel, setSelectedYearLevel] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedShift, setSelectedShift] = useState(0);
  const [selectedStartTime, setSelectedStartTime] = useState(0);
  const [subjectUnits, setSubjectUnits] = useState({});
  const [subjectPriorities, setSubjectPriorities] = useState({});

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleAddEntry = () => {
    const formattedSubjects = {}; // New object for subjects
  
    selectedSubjects.forEach((subjectID) => {
      formattedSubjects[subjectID] = [
        subjectUnits[subjectID] || 0,          // units
        subjectPriorities[subjectID] || 0,     // priority
      ];
    });
  
    dispatch(
      reduxFunction({
        [reduxField[0]]: inputValue,
        teacher: selectedAdviser,
        program: selectedProgram,
        year: selectedYearLevel,
        subjects: formattedSubjects, // Save subjects with units and priorities
        shift: selectedShift,
        startTime: selectedStartTime,
      })
    );
  
    // setEditSectionValue(''); // Reset section name
  
    if (inputNameRef.current) {
      inputNameRef.current.focus();
      inputNameRef.current.select();
    }
  
    // close();
  };  

  const handleReset = () => {
    setInputValue('');
    setSelectedProgram('');
    setSelectedYearLevel('');
    setSelectedSubjects([]);
    setSelectedShift(0);
    setSelectedStartTime(0);
    setSubjectUnits({});
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
        newSubjectUnits[subject] = 0;
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

  useEffect(() => {
    if (teacherStatus === 'idle') {
      dispatch(fetchTeachers());
    }
  }, [teacherStatus, dispatch]);

  return (
    <div className="mb-3 p-4 border rounded-md shadow-md bg-white w-full h-3/12">
      <div className="flex justify-between">
        <h3 className="text-lg font-bold mb-4">ADD NEW {reduxField[0].toUpperCase()}</h3>
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
          <span className="label-text">Assign Adviser</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={selectedAdviser}
          onChange={(e) => setSelectedAdviser(parseInt(e.target.value, 10))}
        >
          <option value="" disabled>
            Assign an adviser
          </option>
          {Object.keys(teachers).map((key) => (
            <option key={teachers[key].id} value={teachers[key].id}>
              {teachers[key].teacher}
            </option>
          ))}
        </select>
      </div>

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
            Select a program
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
          onChange={(e) => setSelectedYearLevel(parseInt(e.target.value, 10))}
        >
          <option value="" disabled>
            Select a year level
          </option>
          {[7, 8, 9, 10].map((level) => (
            <option key={level} value={level}>
              Grade {level}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 text-sm">
        <div className="m-1">Selected Subjects:</div>
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 bg-gray-200 border border-gray-300 px-4 py-2">
          <div className="text-left">Subjects</div>
          <div className="text-left">Units</div>
          <div className="text-left">Priority</div>
        </div>

        {/* Selected Subjects Display */}
        {selectedSubjects.map((subjectID) => (
          <div key={subjectID} className="grid grid-cols-3 gap-4 border-b border-gray-300 px-4 py-2">
            {/* Subject Name */}
            <div>
              {subjects[subjectID]?.subject || 'Unknown Subject'}
            </div>

            {/* Units Input */}
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Units"
                className="input w-full"
                value={subjectUnits[subjectID] ?? 0}
                onChange={(e) => {
                  setSubjectUnits({
                    ...subjectUnits,
                    [subjectID]: parseInt(e.target.value, 10) || 0,
                  });
                }}
              />
              <div className="join join-item join-vertical flex w-20 items-center border-l border-gray-300">
                <button
                  className="join-item h-1/2 w-full bg-secondary hover:brightness-110 flex justify-center"
                  onClick={() => {
                    setSubjectUnits({
                      ...subjectUnits,
                      [subjectID]: (subjectUnits[subjectID] || 0) + 1,
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
                      [subjectID]: Math.max((subjectUnits[subjectID] || 0) - 1, 0),
                    });
                  }}
                >
                  <BiChevronDown size={24} />
                </button>
              </div>
            </div>

            {/* Priority Input */}
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Priority"
                className="input w-full"
                value={subjectPriorities[subjectID] ?? 0}
                onChange={(e) => {
                  setSubjectPriorities({
                    ...subjectPriorities,
                    [subjectID]: parseInt(e.target.value, 10) || 0,
                  });
                }}
              />
              <div className="join join-item join-vertical flex w-20 items-center border-l border-gray-300">
                <button
                  className="join-item h-1/2 w-full bg-secondary hover:brightness-110 flex justify-center"
                  onClick={() => {
                    setSubjectPriorities({
                      ...subjectPriorities,
                      [subjectID]: (subjectPriorities[subjectID] || 0) + 1,
                    });
                  }}
                >
                  <BiChevronUp size={24} />
                </button>
                <button
                  className="join-item h-1/2 w-full bg-secondary hover:brightness-110 flex justify-center"
                  onClick={() => {
                    setSubjectPriorities({
                      ...subjectPriorities,
                      [subjectID]: Math.max((subjectPriorities[subjectID] || 0) - 1),
                    });
                  }}
                >
                  <BiChevronDown size={24} />
                </button>
              </div>
            </div>
        </div>
  ))}
</div>



      <div className="flex justify-between">
          <button className="btn btn-info bg-transparent border-0" onClick={handleReset}>
              Reset
          </button>
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary mt-4" onClick={handleAddEntry}>
            <div>Add {reduxField[0]}</div>
            <IoAdd size={20} />
          </button>
        </div>
      </div>
      
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
  const { teachers, status: teacherStatus } = useSelector(
    (state) => state.teacher
  );

  const [openAddSectionContainer, setOpenAddSectionContainer] = useState(false);

  const [editSectionAdviser, setEditSectionAdviser] = useState('');
  const [editSectionProg, setEditSectionProg] = useState('');
  const [editSectionYear, setEditSectionYear] = useState('');
  const [editSectionId, setEditSectionId] = useState('');
  const [editSectionValue, setEditSectionValue] = useState('');
  const [editSectionSubjects, setEditSectionSubjects] = useState([]);
  const [editSectionUnitsandPriority, setEditSectionUnitsandPriority] = useState({});
  const [editSectionShift, setEditSectionShift] = useState(0);
  const [editSectionStartTime, setEditSectionStartTime] = useState('');

  const [searchSectionResult, setSearchSectionResult] = useState(sections);
  const [searchSectionValue, setSearchSectionValue] = useState('');

  const handleEditSectionClick = (section) => {
    setEditSectionId(section.id);
    setEditSectionValue(section.section);
    setEditSectionAdviser(section.teacher);
    setEditSectionProg(section.program);
    setEditSectionYear(section.year);

    setEditSectionShift(section.shift);
    setEditSectionStartTime(getTimeSlotString(section.startTime));

    const subjectsArray = Object.keys(section.subjects);

    const subjectsWithUnitsAndPriority = subjectsArray.map((subjectId) => {
      const [units, priority] = section.subjects[subjectId] || [0, 0]; // Destructure units and priority
      return {
        id: subjectId,
        name: subjects[subjectId]?.subject || 'Unknown Subject',
        units,
        priority, // Include priority
      };
    });
  
    setEditSectionSubjects(subjectsWithUnitsAndPriority.map(({ id }) => id));
  
    setEditSectionUnitsandPriority(
      subjectsWithUnitsAndPriority.reduce((acc, { id, units, priority }) => {
        acc[id] = [units, priority]; // Store both units and priority
        return acc;
      }, {})
    );
  };

  const handleSaveSectionEditClick = (sectionId) => {
    const updatedUnits = {};
    editSectionSubjects.forEach((subjectId) => {
      updatedUnits[subjectId] = editSectionUnitsandPriority[subjectId] || 0;
    });

    console.log('editSectionStartTime', editSectionStartTime);

    dispatch(
      editSection({
        sectionId,
        updatedSection: {
          id: sectionId,
          teacher: editSectionAdviser,
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
    setEditSectionUnitsandPriority({});
  };

  const handleCancelSectionEditClick = () => {
    setEditSectionId(null);
    setEditSectionValue('');
    setEditSectionAdviser('');
    setEditSectionProg('');
    setEditSectionYear('');
    setEditSectionSubjects([]);
    setEditSectionUnitsandPriority({});
    setEditSectionShift(0);
    setEditSectionStartTime('');
  };

  const renderTimeOptions = (shift) => {
    const times =
      shift === 'AM'
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

  useEffect(() => {
    if (teacherStatus === 'idle') {
      dispatch(fetchTeachers());
    }
  }, [teacherStatus, dispatch]);

  useEffect(() => {
    console.log("editSectionShift: ",editSectionShift);
  }, [editSectionShift]);

  useEffect(() => {
    console.log("editSectionStartTime: ",editSectionStartTime);
  }, [editSectionStartTime]);

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
              <th>Adviser</th>
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
                        <div className="mt-2">
                          <label className="mr-2">Shift:</label>
                          <label className="mr-2">
                            <input
                              type="radio"
                              value={editSectionShift}
                              checked={editSectionShift === 0}
                              onChange={() => {
                                setEditSectionShift(0);
                                setEditSectionStartTime('06:00 AM');
                              }}
                            />
                            AM
                          </label>
                          <label>
                            <input
                              type="radio"
                              value={editSectionShift}
                              checked={editSectionShift === 1}
                              onChange={() => {
                                setEditSectionShift(1);
                                setEditSectionStartTime('01:00 PM');
                              }}
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
                            {renderTimeOptions(editSectionShift === 0 ? 'AM' : 'PM')}
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
                      className="select select-bordered w-full"
                      value={editSectionAdviser}
                      onChange={(e) => setEditSectionAdviser(parseInt(e.target.value, 10))}
                    >
                      <option value="" disabled>
                        Assign an adviser
                      </option>
                      {Object.keys(teachers).map((key) => (
                        <option key={teachers[key].id} value={teachers[key].id}>
                          {teachers[key].teacher}
                        </option>
                      ))}
                    </select>
                    ) : (
                      teachers[section.teacher]?.teacher || 'Unknown Teacher'
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
                          setEditSectionUnitsandPriority(updatedUnits);
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
                          setEditSectionUnitsandPriority(updatedUnits);
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
                              value={editSectionUnitsandPriority[subjectId][0] || 0}
                              onChange={(e) =>
                                setEditSectionUnitsandPriority({
                                  ...editSectionUnitsandPriority,
                                  [subjectId]: parseInt(e.target.value, 10),
                                })
                              }
                              className="input input-xs w-16"
                            />
                            <span className="text-xs ml-1">unit(s)</span>
                            <input
                              type="number"
                              value={editSectionUnitsandPriority[subjectId][1] || 0} // Priority input
                              onChange={(e) =>
                                setEditSectionUnitsandPriority({
                                  ...editSectionUnitsandPriority,
                                  [subjectId]: [
                                    editSectionUnitsandPriority[subjectId]?.[0] || 0, // Preserve units
                                    parseInt(e.target.value, 10) || 0, // Set priority
                                  ],
                                })
                              }
                              className="input input-xs w-16 ml-2" // Add some margin for spacing
                            />
                            <span className="text-xs ml-1">priority</span>
                            {/* <button
                              className="btn btn-xs btn-outline ml-2"
                              onClick={() => {
                                setEditSectionSubjects(
                                  editSectionSubjects.filter(
                                    (id) => id !== subjectId
                                  )
                                );
                                const updatedUnits = {
                                  ...editSectionUnitsandPriority,
                                };
                                delete updatedUnits[subjectId];
                                setEditSectionUnitsandPriority(updatedUnits);
                              }}
                            >
                              Remove
                            </button> */}
                          </div>
                        ))}
                      </div>
                    ) : (
                      subjectStatus === 'succeeded' &&
                      <div className="space-y-2"> {/* This container stacks each subject vertically */}
                        {Object.keys(section.subjects).map((subjectID) => (
                          <div
                            key={subjectID}
                            className="px-2 py-1 flex items-center border border-gray-500 border-opacity-30"
                          >
                            <div className="mr-2">
                              {subjects[subjectID]?.subject || 'Unknown Subject'}
                            </div>
                            <div className="text-xs opacity-75">
                              <span className="mr-1">
                                {section.subjects[subjectID][0]}
                              </span>
                              <span>unit(s)</span>
                              <span>  </span>
                              <span className="mr-1">
                                <span>priority</span>
                              </span>
                                ({section.subjects[subjectID][1]})
                            </div>
                          </div>
                        ))}
                      </div>
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
