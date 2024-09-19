import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTeachers,
  addTeacher,
  editTeacher,
  removeTeacher,
} from '@features/teacherSlice';
import { fetchSubjects } from '@features/subjectSlice';
import debounce from 'debounce';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import SearchableDropdownToggler from './searchableDropdown';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';

const AddTeacherContainer = ({
  close,
  reduxFunction,
}) => {
  const inputNameRef = useRef();
  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );
  const dispatch = useDispatch();

  const [teacherName, setTeacherName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const handleAddTeacher = () => {
    if (teacherName.trim()) {
      dispatch(
        reduxFunction({
            [reduxField[0]]: teacherName,
            [reduxField[1]]: selectedSubjects,
        })
      );

      if (inputNameRef.current) {
          inputNameRef.current.focus();
          inputNameRef.current.select();
      }
      // close();
    } else {
      alert('Teacher name cannot be empty');
    }
  };

  const handleReset = () => {
    setTeacherName('');
    setSelectedSubjects([]);
  };

  useEffect(() => {
    if (inputNameRef.current) {
        inputNameRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (subjectStatus === 'idle') {
      dispatch(fetchSubjects());
    }
  }, [dispatch, subjectStatus]);

  return (
    <div className="mb-3 p-4 border rounded-md shadow-md bg-white w-7/12 h-4/12">
      <div className="flex justify-between">
        <h3 className="text-lg font-bold mb-4">Add New Teacher</h3>
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
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Teacher Name:</label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={teacherName}
          onChange={(e) => setTeacherName(e.target.value)}
          placeholder="Enter teacher name"
        />
      </div>
      <div className="flex items-center">
          <div className="m-1">Selected Subjects: </div>
          {selectedSubjects.map((subjectID) => (
              <div key={subjectID} className="badge badge-secondary mb-3">
                  {subjects[subjectID].subject}
              </div>
          ))}
      </div>

      <SearchableDropdownToggler
        selectedList={selectedSubjects}
        setSelectedList={setSelectedSubjects}
      />

      <div className="flex justify-between">
        <button className="btn btn-info bg-transparent border-0" onClick={handleReset}>
            Reset
        </button>
        <div className="flex justify-end space-x-2">
            <button className="btn btn-primary" onClick={handleAddTeacher}>
                Add Subject
            </button>
        </div>
    </div>
    </div>
  );
};

const TeacherListContainer = ({ editable = false }) => {
  const dispatch = useDispatch();

  const { teachers, status: teacherStatus } = useSelector(
    (state) => state.teacher
  );

  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );

  const [editTeacherId, setEditTeacherId] = useState(null);
  const [editTeacherValue, setEditTeacherValue] = useState('');
  const [editTeacherCurr, setEditTeacherCurr] = useState([]);
  const [searchTeacherResult, setSearchTeacherResult] = useState(teachers);
  const [searchTeacherValue, setSearcTeacherValue] = useState('');
  const [openAddTeacherContainer, setOpenAddTeacherContainer] = useState(false);

  const handleEditTeacherClick = (teacher) => {
    setEditTeacherId(teacher.id);
    setEditTeacherValue(teacher.teacher);
    setEditTeacherCurr(teacher.subjects);
  };

  const handleSaveTeacherEditClick = (teacherId) => {
    dispatch(
      editTeacher({
        teacherId,
        updatedTeacher: {
          teacher: editTeacherValue,
          subjects: editTeacherCurr,
        },
      })
    );
    setEditTeacherId(null);
  };

  const handleCancelTeacherEditClick = () => {
    setEditTeacherId(null);
    setEditTeacherValue('');
    setEditTeacherCurr([]);
  };

  const debouncedSearch = useCallback(
    debounce((searchValue, teachers, subjects) => {
      setSearchTeacherResult(
        filterObject(teachers, ([, teacher]) => {
          if (!searchValue) return true;

          const teachersSubjectsName = teacher.subjects
            .map((subjectID) => subjects[subjectID].subject)
            .join(' ');

          const escapedSearchValue = escapeRegExp(searchValue)
            .split('\\*')
            .join('.*');

          const pattern = new RegExp(escapedSearchValue, 'i');

          return (
            pattern.test(teacher.teacher) || pattern.test(teachersSubjectsName)
          );
        })
      );
    }, 200),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTeacherValue, teachers, subjects);
  }, [searchTeacherValue, teachers, debouncedSearch, subjects]);

  useEffect(() => {
    if (teacherStatus === 'idle') {
      dispatch(fetchTeachers());
    }
  }, [teacherStatus, dispatch]);

  return (
    <React.Fragment>
      <div>
        <label className="input input-sm input-bordered flex items-center mt-5">
          <input
            type="text"
            className="grow"
            placeholder="Search Teacher by Name or Subject Specialization"
            value={searchTeacherValue}
            onChange={(e) => setSearcTeacherValue(e.target.value)}
          />
          <IoSearch />
        </label>

        <table className="table table-sm table-zebra">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Teacher ID</th>
              <th>Teacher</th>
              <th>Subject Specialization</th>
              {editable && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {Object.values(searchTeacherResult).length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No teachers found
                </td>
              </tr>
            ) : (
              Object.entries(searchTeacherResult).map(([, teacher], index) => (
                <tr key={teacher.id} className="group hover">
                  <td>{index + 1}</td>
                  <th>{teacher.id}</th>
                  <td>
                    {editTeacherId === teacher.id ? (
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        value={editTeacherValue}
                        onChange={(e) => setEditTeacherValue(e.target.value)}
                      />
                    ) : (
                      teacher.teacher
                    )}
                  </td>

                  <td className="flex gap-1 flex-wrap">
                    {editTeacherId === teacher.id ? (
                      <SearchableDropdownToggler
                        selectedList={editTeacherCurr}
                        setSelectedList={setEditTeacherCurr}
                        isEditeditable={true}
                      />
                    ) : (
                      subjectStatus === 'succeeded' &&
                      teacher.subjects.map((subject) => (
                        <div
                          key={subject}
                          className="px-2 border border-gray-500 border-opacity-30"
                        >
                          {subjects[subject].subject}
                        </div>
                      ))
                    )}
                  </td>

                  {editable && (
                    <td className="w-28 text-right">
                      {editTeacherId === teacher.id ? (
                        <>
                          <button
                            className="btn btn-xs btn-ghost text-green-500"
                            onClick={() =>
                              handleSaveTeacherEditClick(teacher.id)
                            }
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => handleCancelTeacherEditClick()}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => handleEditTeacherClick(teacher)}
                          >
                            <RiEdit2Fill size={20} />
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => dispatch(removeTeacher(teacher.id))}
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

      {editable && (
        <div>
          {openAddTeacherContainer ? (
            <AddTeacherContainer
              close={() => setOpenAddTeacherContainer(false)}
              reduxFunction={addTeacher}
            />
          ) : (
            <div className="flex justify-end mt-3">
              <button
                className="btn btn-secondary my-5"
                onClick={() => {
                  setOpenAddTeacherContainer(true);
                }}
              >
                Add Teacher
                <IoAdd size={26} />
              </button>
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default TeacherListContainer;
