import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import {
  fetchSections,
  editSection,
  removeSection,
} from '@features/sectionSlice';
import { fetchPrograms } from '@features/programSlice';
import { getTimeSlotString } from './timeSlotMapper';
import { IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

const SectionListDisplay = () => {
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

  const [editSectionProg, setEditSectionProg] = useState('');
  const [editSectionYear, setEditSectionYear] = useState('');

  const [editSectionId, setEditSectionId] = useState('');
  const [editSectionValue, setEditSectionValue] = useState('');
  const [editSectionSubjects, setEditSectionSubjects] = useState([]);
  const [editSectionUnits, setEditSectionUnits] = useState({});
  const [searchSectionResult, setSearchSectionResult] = useState(sections);
  const [searchSectionValue, setSearchSectionValue] = useState('');

  const handleEditSectionClick = (section) => {
    setEditSectionId(section.id);
    setEditSectionValue(section.section);

    setEditSectionProg(section.program);
    setEditSectionYear(section.year);

    // console.log("Section ID:", section.id);

    // Convert section.subjects object keys to an array
    const subjectsArray = Object.keys(section.subjects); // Get the subject IDs from the object

    const subjectsWithUnits = subjectsArray.map((subjectId) => ({
      id: subjectId,
      name: subjects[subjectId]?.subject || 'Unknown Subject',
      units: section.subjects[subjectId] || 0,
    }));

    setEditSectionSubjects(subjectsWithUnits.map(({ id }) => id));
    console.log('Subjects with units for section:', subjectsWithUnits);

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

  const getProgramShiftAndTimeSlot = (section) => {
    const program = Object.values(programs).find(
      (prog) => prog.id === section.program
    );

    if (!program) {
      return { shift: null, startTime: null };
    }

    const yearData = program[section.year];

    if (!yearData) {
      return { shift: null, startTime: null };
    }

    return {
      shift: yearData.shift,
      startTime: yearData.startTime,
    };
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

  // useEffect(() => {
  //   if (sectionStatus === 'succeeded') {
  //     console.log('Fetched sections:', sections);
  //   }
  // }, [sectionStatus, sections]);

  useEffect(() => {
    if (programStatus === 'idle') {
      dispatch(fetchPrograms());
    }
  }, [programStatus, dispatch]);

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
              <th className="text-right">Actions</th>
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
                      <input
                        type="text"
                        value={editSectionValue}
                        onChange={(e) => setEditSectionValue(e.target.value)}
                        className="input input-bordered input-sm w-full"
                      />
                    ) : (
                      <>
                        <div className="text-base font-bold">
                          {section.section}
                        </div>
                        <div className="flex items-center mt-2">
                          <span className="inline-block bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-lg">
                            {getProgramShiftAndTimeSlot(section).shift === 0
                              ? 'AM'
                              : 'PM'}{' '}
                            {/* Display SHIFT */}
                          </span>
                          <span className="ml-2 text-sm font-medium">
                            {getTimeSlotString(
                              getProgramShiftAndTimeSlot(section).startTime
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </React.Fragment>
  );
};

export default SectionListDisplay;
