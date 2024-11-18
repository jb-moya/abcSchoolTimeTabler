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
  const { sections } = useSelector((state) => state.section);

  const numOfSchoolDays = localStorage.getItem('numOfSchoolDays');
  
  const [inputValue, setInputValue] = useState('');
  const [selectedAdviser, setSelectedAdviser] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYearLevel, setSelectedYearLevel] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedShift, setSelectedShift] = useState(0);
  const [selectedStartTime, setSelectedStartTime] = useState(0);

  const [fixedDays, setFixedDays] = useState({});
  const [fixedPositions, setFixedPositions] = useState({});

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleFixedDaysChange = (subjectID, index) => {
    setFixedDays((prevState) => {
      const currentDayState = prevState[subjectID]?.[index] || 0;
      const updatedState = {
        ...prevState,
        [subjectID]: {
          ...prevState[subjectID],
          [index]: currentDayState === 0 ? 1 : 0,
        },
      };
      return updatedState;
    })
  };

  const handleFixedPositionChange = (e, subjectID) => {
    const value = Math.min(
      Math.max(0, parseInt(e.target.value) || 0),
      selectedSubjects.length || 0
    );
    setFixedPositions((prevState) => ({
      ...prevState,
      [subjectID]: value
    }))

  };

  const handleAddEntry = () => {

    if (inputValue === '' || selectedAdviser === '' || selectedProgram === '' || selectedYearLevel === '' || selectedSubjects.length === 0) {
      alert('All fields are required.');
      return;
    }

    const duplicateSection = Object.values(sections).find(
      (section) => section.section.trim().toLowerCase() === inputValue.trim().toLowerCase()
    );

    const duplicateAdviser = Object.values(sections).find(
      (section) => section.teacher === selectedAdviser
    );

    if (duplicateSection) {
      alert('Section already exists.');
      return;
    } else if (duplicateAdviser) {
      alert(`Teacher is already assigned as adviser of section '${duplicateAdviser.section}'`);
      return;
    } else {

    
      dispatch(
        reduxFunction({
          [reduxField[0]]: inputValue,
          teacher: selectedAdviser,
          program: selectedProgram,
          year: selectedYearLevel,
          subjects: selectedSubjects,
          fixedDays: fixedDays,
          fixedPositions: fixedPositions,
          shift: selectedShift,
          startTime: selectedStartTime,
        })
      );
    
      setInputValue('');
      setSelectedProgram('');
      setSelectedYearLevel('');
      setSelectedSubjects([]);
      setSelectedShift(0);
      setSelectedStartTime(0);
      setSubjectUnits({});
      setSubjectPriorities({});
      setFixedDays({});
      setFixedPositions({});
    }
  
    if (inputNameRef.current) {
      inputNameRef.current.focus();
      inputNameRef.current.select();
    }
  };

  const handleReset = () => {
    setInputValue('');
    setSelectedProgram('');
    setSelectedYearLevel('');
    setSelectedAdviser('');
    setSelectedSubjects([]);
    setSelectedShift(0);
    setSelectedStartTime(0);
    setFixedDays({});
    setFixedPositions({});
  };

  useEffect(() => {
    if (inputNameRef.current) {
      inputNameRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // console.log('Selected Program:', selectedProgram);
    // console.log('Selected Year Level:', selectedYearLevel);

    if (selectedProgram && selectedYearLevel) {
      const program = Object.values(programs).find(
        (p) => p.id === selectedProgram
      );

      // console.log('program[selectedYearLevel].subjects:', program[selectedYearLevel].subjects);

      if (program) {
        setSelectedSubjects(program[selectedYearLevel].subjects || []); // Ensure it accesses the subjects correctly
        setFixedDays(program[selectedYearLevel].fixedDays || {});
        setFixedPositions(program[selectedYearLevel].fixedPositions || {});
        setSelectedShift(program[selectedYearLevel].shift || 0);
        setSelectedStartTime(program[selectedYearLevel].startTime || 0);
      }
    }
  }, [selectedProgram, selectedYearLevel, ,programs]);

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
    <div>
      <div className="flex justify-center">
        <h3 className="text-lg font-bold mb-4">Add New Section</h3>
      </div>

      <div className="mb-4">
          <label className="label">
          <span className="label-text">Section Name</span>
        </label>
          <input
            type="text"
            ref={inputNameRef}
            placeholder={`${reduxField[0]} Name`}
            required
            className="input input-bordered input-sm w-full "
            value={inputValue}
            onChange={handleInputChange}
          />
      </div>

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
            {selectedSubjects.map((subjectID) => (
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
                <td className='p-2'>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    .slice(0, numOfSchoolDays)
                    .map((day, index) => {
                      const weeklyMinutes = subjects[subjectID]?.weeklyMinutes || 0;
                      const classDuration = subjects[subjectID]?.classDuration || 0;
                      const requiredClasses = Math.ceil(weeklyMinutes / classDuration);

                      const disabledDays = requiredClasses >= numOfSchoolDays;
                      const selectedDaysCount = Object.values(fixedDays[subjectID] || {}).filter(Boolean).length;

                      return (
                        <label key={index} className='flex items-center'>
                          <input
                            type='checkbox'
                            className='mr-1'
                            checked={fixedDays[subjectID]?.[index] || false}
                            onChange={() => handleFixedDaysChange(subjectID, index)}
                            disabled={disabledDays || selectedDaysCount >= requiredClasses && !fixedDays[subjectID]?.[index]}
                          />
                          {day}
                        </label>
                      );
                    })
                  }
                </td>
                {/* Fixed Position */}
                <td className='p-2'>
                  <input 
                    type='number'
                    className='input bg-gray-200 input-border w-full'
                    min={0}
                    max={selectedSubjects.length || 0}
                    value={fixedPositions[subjectID] || 0}
                    onChange={(e) => handleFixedPositionChange(e, subjectID)}
                  />
                </td>        
              </tr>
            ))}
          </tbody>
        </table>

        
        
      </div>

      <div className="flex justify-center gap-4 mt-4">
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
          <button className="btn btn-primary" onClick={handleAddEntry}>
            Add Section
          </button>
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

  const numOfSchoolDays = localStorage.getItem('numOfSchoolDays');

  const [editSectionAdviser, setEditSectionAdviser] = useState('');
  const [editSectionProg, setEditSectionProg] = useState('');
  const [editSectionYear, setEditSectionYear] = useState('');
  const [editSectionId, setEditSectionId] = useState('');
  const [editSectionValue, setEditSectionValue] = useState('');
  const [editSectionSubjects, setEditSectionSubjects] = useState([]);
  const [editSectionShift, setEditSectionShift] = useState(0);
  const [editSectionStartTime, setEditSectionStartTime] = useState('');

  const [editSectionFixedDays, setEditSectionFixedDays] = useState({});
  const [editSectionFixedPositions, setEditSectionFixedPositions] = useState({});

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
    setEditSectionSubjects(section.subjects);
    setEditSectionFixedDays(section.fixedDays);
    setEditSectionFixedPositions(section.fixedPositions);
  };

  const handleSaveSectionEditClick = (sectionId) => {

    if (!editSectionAdviser || !editSectionValue || !editSectionProg || !editSectionYear || editSectionSubjects.length === 0) {
      alert('Please fill out all required fields.');
      return;
    }

    const currentSection = sections[sectionId]?.section || '';
    const currentSectionAdviser = sections[sectionId]?.teacher || '';

    if (editSectionValue.trim().toLowerCase() === currentSection.trim().toLowerCase()
      && editSectionAdviser === currentSectionAdviser) {

      dispatch(
        editSection({
          sectionId,
          updatedSection: {
            id: sectionId,
            teacher: editSectionAdviser,
            program: editSectionProg,
            section: editSectionValue,
            subjects: editSectionSubjects,
            fixedDays: editSectionFixedDays,
            fixedPositions: editSectionFixedPositions,
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
      setEditSectionFixedDays({});
      setEditSectionFixedPositions({});
    } else {
      const duplicateSection = Object.values(sections).find(
        (section) => section.section.trim().toLowerCase() === editSectionValue.trim().toLowerCase()
      );

      const duplicateAdviser = Object.values(sections).find(
        (section) => section.teacher === editSectionAdviser
      );

      // console.log('duplicateAdviser: ', duplicateAdviser);

      if (duplicateSection) {
        alert('Section name already taken.');
        return;
      } else if (duplicateAdviser) {
        alert(`Adviser already assigned to section '${duplicateAdviser.section}'`);
        return;
      } else {
        dispatch(
          editSection({
            sectionId,
            updatedSection: {
              id: sectionId,
              teacher: editSectionAdviser,
              program: editSectionProg,
              section: editSectionValue,
              subjects: editSectionSubjects,
              fixedDays: editSectionFixedDays,
              fixedPositions: editSectionFixedPositions,
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
        setEditSectionFixedDays({});
        setEditSectionFixedPositions({});
      }
    }
  };

  const handleCancelSectionEditClick = () => {
    setEditSectionId(null);
    setEditSectionValue('');
    setEditSectionAdviser('');
    setEditSectionProg('');
    setEditSectionYear('');
    setEditSectionSubjects([]);
    setEditSectionFixedDays({});
    setEditSectionFixedPositions({});
  };

  const handleFixedDaysSelection = (subjectID, dayIndex) => {
    setEditSectionFixedDays((prevState) => ({
      ...prevState,
      [subjectID]: {
        ...prevState[subjectID],
        [dayIndex]: prevState[subjectID]?.[dayIndex] === 1 ? 0 : 1,
      },
    }));
  };

  const renderTimeOptions = () => {
    const times =
      editSectionShift === 0
        ? Array.from({ length: 36 }, (_, i) => {
            const hours = 6 + Math.floor(i / 6);
            const minutes = (i % 6) * 10;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} AM`;
          })
        : ['01:00 PM']; // Only one option for PM
  
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

  // TO DETECT CHANGES IN SECTION PROGRAM AND/OR YEAR
  const prevYear = useRef(editSectionYear);
  const prevProgram = useRef(editSectionProg);

  useEffect(() => {
    if (prevYear.current !== editSectionYear || prevProgram.current !== editSectionProg) {
      console.log("editSectionYear or editSectionProgram has changed.");
      prevYear.current = editSectionYear;
      prevProgram.current = editSectionProg;
      
      const program = Object.values(programs).find(
        (p) => p.id === editSectionProg
      );

      if (program) {
        setEditSectionSubjects(program[editSectionYear]?.subjects || []);
        setEditSectionFixedDays(program[editSectionYear]?.fixedDays || {});
        setEditSectionFixedPositions(program[editSectionYear]?.fixedPositions || {});
      }
    }
  }, [editSectionYear, editSectionProg]);
  

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

  const itemsPerPage = 10; // Adjust this to change items per page
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages based on filtered sections
  const totalPages = Math.ceil(Object.values(searchSectionResult).length / itemsPerPage);

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Object.entries(searchSectionResult).slice(indexOfFirstItem, indexOfLastItem);

  return (
    <React.Fragment>
      <div className="w-full">
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
                handleCancelSectionEditClick();
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
                handleCancelSectionEditClick();
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
          {/* Search Section */}
          <div className="flex-grow w-full md:w-1/3 lg:w-1/4">
            <label className="input input-bordered flex items-center gap-2 w-full">
              <input
                type="text"
                className="grow p-3 text-sm w-full"
                placeholder="Search Section"
                value={searchSectionValue}
                onChange={(e) => setSearchSectionValue(e.target.value)}
              />
              <IoSearch className="text-xl" />
            </label>
          </div>

          {editable && (
            <div className="w-full mt-4 md:mt-0 md:w-auto">
              <button
                className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
                onClick={() => document.getElementById('add_section_modal').showModal()}
              >
                Add Section <IoAdd size={20} className="ml-2" />
              </button>

              <dialog id="add_section_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box" style={{ width: '50%', maxWidth: 'none' }}>
                  <AddSectionContainer
                    close={() => document.getElementById('add_section_modal').close()}
                    reduxField={['section', 'subjects', 'units']}
                    reduxFunction={addSection}
                  />
                  <div className="modal-action">
                    <button
                      className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                      onClick={() => document.getElementById('add_section_modal').close()}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </dialog>
            </div>
          )}
        </div>

        {/* Section Table */}
        <div className="overflow-x-auto">
          <table className="table table-sm table-zebra min-w-full">
            <thead>
              <tr>
                {/* <th className="w-8">#</th> */}
                <th>Section ID</th>
                <th>Section</th>
                <th>Adviser</th>
                {/* <th>Program</th> */}
                {/* <th>Year</th> */}
                <th>Subjects</th>
                {editable && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    No sections found
                  </td>
                </tr>
              ) : (
                currentItems.map(([, section], index) => (
                  <tr key={section.id} className="group hover">
                    {/* <td>{index + indexOfFirstItem + 1}</td> */}

                    {/* Section ID */}
                    <th>{section.id}</th>

                    {/* Section Name, Shift, and Start Time */}
                    <td>
                      {editSectionId === section.id ? (
                        <>
                          {/* Section Name */}
                          <div className="flex items-center mb-2">
                            <label htmlFor="section-name" className="mr-2">
                              Name:
                            </label>
                            <input
                              type="text"
                              id="section-name"
                              value={editSectionValue}
                              onChange={(e) => setEditSectionValue(e.target.value)}
                              className="input input-bordered input-sm w-full"
                            />
                          </div>

                          {/* Section Program */}
                          <div className="flex items-center mb-2">
                            <label htmlFor="section-name" className="mr-2">
                              Program:
                            </label>
                            <select
                              value={editSectionProg}
                              onChange={(e) => {
                                const newProgram = parseInt(e.target.value, 10);
                                setEditSectionProg(newProgram);
                              }}
                              className="select select-bordered"
                            >
                              {Object.entries(programs).map(([key, program]) => (
                                <option key={key} value={key}>
                                  {program.program}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Section Year */}
                          <div className="flex items-center mb-2">
                            <label htmlFor="section-name" className="mr-2">
                              Year:
                            </label>
                            <select
                              value={editSectionYear}
                              onChange={(e) => {
                                const newYear = parseInt(e.target.value, 10);
                                setEditSectionYear(newYear);
                              }}
                              className="select select-bordered"
                            >
                              {[7, 8, 9, 10].map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Section Shift */}
                          <div className="mt-2">
                            <label className="mr-2">Shift:</label>
                            <label className="mr-2">
                              <input
                                type="radio"
                                value={editSectionShift}
                                checked={editSectionShift === 0}
                                onChange={() => {
                                  setEditSectionShift(0);  // PM shift
                                  setEditSectionStartTime('06:00 AM');  // Reset to default AM start time
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
                                  setEditSectionShift(1);  // PM shift
                                  setEditSectionStartTime('01:00 PM');  // Reset to default PM start time
                                }}
                              />
                              PM
                            </label>
                          </div>

                          {/* Section Start Time (AM or PM) */}
                          <div>
                            <label>Start Time:</label>
                            <select
                              value={editSectionStartTime}
                              onChange={(e) => setEditSectionStartTime(e.target.value)}
                            >
                              {renderTimeOptions()}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-base font-bold">
                            {`${section.year} -  ${section.section}`}
                          </div>
                          <div className='mt-1'>
                            {`(${programs[section.program]?.program})`}
                          </div>
                          <div className="flex items-center mt-2">
                            <span className="inline-block bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-lg">
                              {section.shift === 0 ? 'AM' : 'PM'}
                            </span>
                            <span className="ml-2 text-sm font-medium">
                              {getTimeSlotString(section.startTime)}
                            </span>
                          </div>
                        </>
                      )}
                    </td>

                    {/* Adviser */}
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

                    {/* Subject Details */}
                    <td className="flex gap-1 flex-wrap">
                      {editSectionId === section.id ? (
                        <div className="overflow-x-auto mt-2">
                          <table className='min-w-full bg-white border border-gray-300'>
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
                              {Array.isArray(editSectionSubjects) && editSectionSubjects.length > 0 ? (
                                editSectionSubjects.map((subjectID, index) => {

                                  return (
                                    <tr key={subjectID}>

                                      {/* Subject */}
                                      <td className="py-2 px-4 border-b border-gray-200">
                                        {subjects[subjectID]?.subject || 'Unknown Subject, ID: ' + subjectID}
                                      </td>

                                      {/* Duration */}
                                      <td className="py-2 px-4 border-b border-gray-200">
                                        {subjects[subjectID]?.classDuration}
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
                                            const selectedDaysCount = Object.values(editSectionFixedDays[subjectID] || {}).filter(Boolean).length;

                                            return (
                                              <label key={index} className="flex items-center">
                                                <input
                                                  type="checkbox"
                                                  className="mr-1"
                                                  checked={editSectionFixedDays[subjectID]?.[index] || false}
                                                  onChange={() => handleFixedDaysSelection(subjectID, index)}
                                                  disabled={disabledDays ||selectedDaysCount >= requiredClasses && !editSectionFixedDays[subjectID]?.[index]} // Disable if the condition is met
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
                                          max={editSectionSubjects?.length || 0}
                                          value={editSectionFixedPositions[subjectID] || 0}
                                          onChange={(e) => {
                                            const value = Math.min(
                                              Math.max(0, parseInt(e.target.value) || 0),
                                              editSectionSubjects.length || 0
                                            );
                                            setEditSectionFixedPositions((prevState) => ({
                                              ...prevState,
                                              [subjectID]: value,
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
                      ) : (
                        <div className='overflow-x-auto mt-2'>
                          <table className='min-w-full bg-white border border-gray-300'>
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
                              {Array.isArray(section.subjects)&& section.subjects.length > 0 ? (
                                section.subjects.map((subjectID, index) => {

                                  const fixedDaysForSubject = section?.fixedDays?.[subjectID];
                                  const fixedPositionForSubject = section?.fixedPositions?.[subjectID];

                                  return (
                                    <tr key={index} className="border-b border-gray-200">

                                      {/* Subject Name */}
                                      <td className="py-2 px-4 border-b border-gray-200">
                                        {subjects[subjectID].subject || 'Unknown Subject, ID: ' + subjectID}
                                      </td>

                                      {/* Duration */}
                                      <td className="py-2 px-4 border-b border-gray-200">
                                        {subjects[subjectID].classDuration || ''}
                                      </td>

                                      {/* Weekly Minutes */}
                                      <td className="py-2 px-4 border-b border-gray-200">
                                        {subjects[subjectID].weeklyMinutes || ''}
                                      </td>

                                      {/* Fixed Days */}
                                      <td className="py-2 px-4 border-b border-gray-200">
                                        {['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun']
                                          .map((day, index) => {
                                            return fixedDaysForSubject[index] === 1 ? <div key={day}>• {day}</div> : null;
                                        })}
                                      </td>

                                      {/* Fixed Position */}
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
                      )}
                    </td>

                    {editable && (
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
                              onClick={() => handleCancelSectionEditClick()}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-xs btn-ghost text-blue-500"
                              onClick={() => handleEditSectionClick(section)}
                            >
                              <RiEdit2Fill />
                            </button>
                            <button
                              className="btn btn-xs btn-ghost text-red-500"
                              onClick={() => dispatch(removeSection(section.id))}
                            >
                              <RiDeleteBin7Line />
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

export default SectionListContainer;
