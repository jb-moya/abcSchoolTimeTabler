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

import { toast } from "sonner";
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

const AddSectionContainer = ({
  close,
  reduxField,
  reduxFunction,
  errorMessage,
  setErrorMessage,
  errorField,
  setErrorField, }) => {
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

    if (inputValue === '' || selectedAdviser === '' || selectedProgram === '' || selectedYearLevel === '' || selectedSubjects.length === 0 || subjectUnits.length === 0 || subjectPriorities.length === 0) {
      const errorFields = [];
      if (inputValue === '') errorFields.push('name');
      if (selectedAdviser === '') errorFields.push('adviser');
      if (selectedProgram === '') errorFields.push('program');
      if (selectedYearLevel === '') errorFields.push('yearLevel');
      if (selectedSubjects.length === 0) errorFields.push('subjects');

      if (errorFields.length > 0) {
        setErrorMessage('All fields are required.');
        setErrorField(errorFields);
        return;
      }
    }

    const duplicateSection = Object.values(sections).find(
      (section) => section.section.trim().toLowerCase() === inputValue.trim().toLowerCase()
    );

    const duplicateAdviser = Object.values(sections).find(
      (section) => section.teacher === selectedAdviser
    );

    if (duplicateSection) {
      setErrorMessage('Section already exists.');
      setErrorField('name');
      return;
    } else if (duplicateAdviser) {
      setErrorMessage(`Teacher is already assigned as adviser of section '${duplicateAdviser.section}'`);
      setErrorField('adviser');
      // alert(`Teacher is already assigned as adviser of section '${duplicateAdviser.section}'`);
      return;
    } else {
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
          subjects: formattedSubjects,
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
    }

    toast.success('Teacher added successfully', {
      style: { backgroundColor: 'green', color: 'white', bordercolor: 'green', },
    });

    handleReset();
    close();

    if (inputNameRef.current) {
      inputNameRef.current.focus();
      inputNameRef.current.select();
    }
  };

  const handleReset = () => {

    setErrorMessage('');
    setErrorField([]);
    setInputValue('');
    setSelectedProgram('');
    setSelectedYearLevel('');
    setSelectedAdviser('');
    setSelectedSubjects([]);
    setSelectedShift(0);
    setSelectedStartTime(0);
    setSubjectUnits({});
    setSubjectPriorities({});
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
          placeholder={`Section Name`}
          required
          className={`input input-bordered input-md w-full ${errorField.includes('name') ? 'border-red-500' : ''
            }`}
          value={inputValue}
          onChange={handleInputChange}
        />
      </div>

      <div className="mt-3">
        <label className="label">
          <span className="label-text">Assign Adviser</span>
        </label>
        <select
          className={`select select-bordered w-full ${errorField.includes('adviser') ? 'border-red-500' : ''
            }`}
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
          className={`select select-bordered w-full ${errorField.includes('program') ? 'border-red-500' : ''
            }`}
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
          className={`select select-bordered w-full ${errorField.includes('yearLevel') ? 'border-red-500' : ''
            }`}
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

      {errorMessage && (
        <p className="text-red-500 text-sm my-4 font-medium select-none ">{errorMessage}</p>
      )}

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

  const [openAddSectionContainer, setOpenAddSectionContainer] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [errorField, setErrorField] = useState([]);

  const [editSectionAdviser, setEditSectionAdviser] = useState('');
  const [editSectionProg, setEditSectionProg] = useState('');
  const [editSectionYear, setEditSectionYear] = useState('');
  const [editSectionId, setEditSectionId] = useState('');
  const [editSectionValue, setEditSectionValue] = useState('');
  const [editSectionSubjects, setEditSectionSubjects] = useState([]);
  const [editSectionUnitsAndPriority, setEditSectionUnitsAndPriority] = useState({});
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

    // Convert section.subjects object keys to an array
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

    setEditSectionUnitsAndPriority(
      subjectsWithUnitsAndPriority.reduce((acc, { id, units, priority }) => {
        acc[id] = [units, priority];
        return acc;
      }, {})
    );
  };

  const handleSaveSectionEditClick = (sectionId) => {

    if (!editSectionAdviser || !editSectionValue || !editSectionProg || !editSectionYear || editSectionSubjects.length === 0 || editSectionUnitsAndPriority.length === 0) {
      toast.error('Please fill out all required fields.', {
        style: { backgroundColor: 'red', color: 'white' },
      });
      return;
    }

    const currentSection = sections[sectionId]?.section || '';
    const currentSectionAdviser = sections[sectionId]?.teacher || '';

    if (editSectionValue.trim().toLowerCase() === currentSection.trim().toLowerCase()
      && editSectionAdviser === currentSectionAdviser) {
      const updatedUnits = {};
      editSectionSubjects.forEach((subjectId) => {
        updatedUnits[subjectId] = editSectionUnitsAndPriority[subjectId] || [0, 0];
      });

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

      toast.success('Section added successfully', {
        style: { backgroundColor: 'green', color: 'white', bordercolor: 'green' },
      });

      // Reset the editing state
      setEditSectionId('');
      setEditSectionValue('');
      setEditSectionProg('');
      setEditSectionYear('');
      setEditSectionSubjects([]);
      setEditSectionUnitsAndPriority({});
    } else {
      const duplicateSection = Object.values(sections).find(
        (section) => section.section.trim().toLowerCase() === editSectionValue.trim().toLowerCase()
      );

      const duplicateAdviser = Object.values(sections).find(
        (section) => section.teacher === editSectionAdviser
      );

      // console.log('duplicateAdviser: ', duplicateAdviser);

      if (duplicateSection) {
        toast.error('Section name already taken.', {
          style: { backgroundColor: 'red', color: 'white' },
        });
        return;
      } else if (duplicateAdviser) {
        toast.error(`Adviser already assigned to section '${duplicateAdviser.section}'`, {
          style: { backgroundColor: 'red', color: 'white' },
        });
      } else {
        const updatedUnits = {};
        editSectionSubjects.forEach((subjectId) => {
          updatedUnits[subjectId] = editSectionUnitsAndPriority[subjectId] || [0, 0];
        });

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
        setEditSectionUnitsAndPriority({});
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
    setEditSectionUnitsAndPriority({});
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
    console.log('editSectionAdviser: ', editSectionAdviser);
  }, [editSectionAdviser]);

  const handleClose = () => {
    const modal = document.getElementById('add_section_modal');
    if (modal) {
      modal.close();
      setErrorMessage('');
      setErrorField([]);
    } else {
      console.error("Modal with ID 'add_section_modal' not found.");
    }
  };

  const deleteModal = (id) => {
    const deleteModalElement = document.getElementById("delete_modal");
    deleteModalElement.showModal();  // Show the modal

    const deleteButton = document.getElementById("delete_button");
    deleteButton.onclick = () => handleDelete(id);  // Dynamically assign delete logic
  };

  const handleDelete = (id) => {
    dispatch(removeSection(id));  // Perform the delete action
    document.getElementById("delete_modal").close(); // Close the modal after deleting
  };


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
                <div className="modal-box">
                  <AddSectionContainer
                    close={() => document.getElementById('add_section_modal').close()}
                    reduxField={['section', 'subjects', 'units']}
                    reduxFunction={addSection}
                    errorMessage={errorMessage}
                    setErrorMessage={setErrorMessage}
                    errorField={errorField}
                    setErrorField={setErrorField}
                  />
                  <div className="modal-action">
                    <button
                      className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                      onClick={handleClose}
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
          <table className="table table-sm table-zebra md:table-md w-full">
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
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    No sections found
                  </td>
                </tr>
              ) : (
                currentItems.map(([, section], index) => (
                  <tr key={section.id} className="group hover">
                    <td>{index + indexOfFirstItem + 1}</td>
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
                          <div className="text-base font-bold">{section.section}</div>
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
                              programs[newProgram]?.[section.year]?.subjects || [];
                            setEditSectionSubjects(subjectsForProgramAndYear);
                            const updatedUnits = {};
                            subjectsForProgramAndYear.forEach((subjectId) => {
                              updatedUnits[subjectId] = 0;
                            });
                            setEditSectionUnitsAndPriority(updatedUnits);
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
                              programs[editSectionProg]?.[newYear]?.subjects || [];
                            setEditSectionSubjects(subjectsForProgramAndYear);
                            const updatedUnits = {};
                            subjectsForProgramAndYear.forEach((subjectId) => {
                              updatedUnits[subjectId] = 0;
                            });
                            setEditSectionUnitsAndPriority(updatedUnits);
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
                        <div className="space-y-2">
                          {editSectionSubjects.map((subjectId) => (
                            <div
                              key={subjectId}
                              className="px-2 flex items-center border border-gray-500 border-opacity-30"
                            >
                              <div className="mr-2">
                                {subjects[subjectId]?.subject || 'Unknown Subject'}
                              </div>
                              <input
                                type="number"
                                value={editSectionUnitsAndPriority[subjectId][0] || 0}
                                onChange={(e) =>
                                  setEditSectionUnitsAndPriority({
                                    ...editSectionUnitsAndPriority,
                                    [subjectId]: [
                                      parseInt(e.target.value, 10) || 0, // Set units
                                      editSectionUnitsAndPriority[subjectId]?.[1] || 0, // Preserve priority
                                    ],
                                  })
                                }
                                className="input input-xs w-16"
                              />
                              <span className="text-xs ml-1">unit(s)</span>

                              <input
                                type="number"
                                value={editSectionUnitsAndPriority[subjectId][1] || 0} // Priority input
                                onChange={(e) =>
                                  setEditSectionUnitsAndPriority({
                                    ...editSectionUnitsAndPriority,
                                    [subjectId]: [
                                      editSectionUnitsAndPriority[subjectId]?.[0] || 0, // Preserve units
                                      parseInt(e.target.value, 10) || 0, // Set priority
                                    ],
                                  })
                                }
                                className="input input-xs w-16 ml-2" // Add some margin for spacing
                              />
                              <span className="text-xs ml-1">priority</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        subjectStatus === 'succeeded' && (
                          <div className="space-y-2">
                            {Object.keys(section.subjects).map((subjectID) => (
                              <div
                                key={subjectID}
                                className="px-2 py-1 flex items-center border border-gray-500 border-opacity-30"
                              >
                                <div className="mr-2">
                                  {subjects[subjectID]?.subject || 'Unknown Subject'}
                                </div>
                                <div className="text-xs opacity-75">
                                  <span className="mr-1">{section.subjects[subjectID][0]}</span>
                                  <span>unit(s)</span>
                                  <span> </span>
                                  <span>priority</span>
                                  <span className="mr-1">({section.subjects[subjectID][1]})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
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
                              onClick={() => deleteModal(section.id)} // Call deleteModal with the section.id
                            >
                              <RiDeleteBin7Line />
                            </button>

                            <dialog id="delete_modal" className="modal modal-bottom sm:modal-middle">
                              <form method="dialog" className="modal-box">
                                <div className="flex flex-col items-center justify-center">
                                  <TrashIcon className="text-red-500 mb-4" width={40} height={40} />
                                  <h3 className="font-bold text-lg text-center">
                                    Are you sure you want to delete this section?
                                  </h3>
                                  <p className="text-sm text-gray-500 text-center">
                                    This action cannot be undone.
                                  </p>
                                </div>
                                <div className="modal-action flex justify-center">
                                  <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => document.getElementById('delete_modal').close()}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    id="delete_button"
                                    className="btn btn-sm btn-error text-white"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </form>
                            </dialog>

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
