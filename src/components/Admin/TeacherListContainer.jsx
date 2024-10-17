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
import Lottie from 'lottie-react';
import animationData from '/public/SuccessAnimation.json'

const SuccessModal = ({ message, onClose }) => {
  return (
    <div className="modal modal-open flex items-center justify-center">
      <div className="modal-box flex flex-col items-center justify-center p-4"> {/* Added padding */}
        <div className="lottie-animation w-48 h-48">
          <Lottie
            animationData={
              animationData
            } // Replace with your Lottie JSON
            loop={false} // Ensures the animati on does not loop
          />
        </div>
        <h2 className="font-bold text-lg text-center">{message}</h2> {/* Center text */}
        <div className="modal-action">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

const AddTeacherContainer = ({
  close,
  reduxFunction,
}) => {
  const inputNameRef = useRef();
  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );
  const { teachers } = useSelector((state) => state.teacher);
  const dispatch = useDispatch();

  const [teacherName, setTeacherName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const handleAddTeacher = () => {

    if (!teacherName.trim()) {
      alert('Teacher name cannot be empty.');
      return;
    } else if (selectedSubjects.length === 0) {
      alert('Please assign subject specialization');
      return;
    }

    const duplicateTeacher = Object.values(teachers).find(
      (teacher) => teacher.teacher.trim().toLowerCase() === teacherName.trim().toLowerCase()
    );

    if (duplicateTeacher) {
      alert('Teacher already exists.');
      return;
    } else {
      dispatch(
        reduxFunction({
          teacher: teacherName,
          subjects: selectedSubjects,
        })
      );
    }

    if (inputNameRef.current) {
      inputNameRef.current.focus();
      inputNameRef.current.select();
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
    <div>
        <div className="flex justify-center mb-4">
          <h3 className="text-xl font-bold">Add New Teacher</h3>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="teacherName">Teacher Name:</label>
          <input
            id="teacherName"
            type="text"
            className="input input-bordered w-full"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="Enter teacher name"
            aria-label="Teacher Name"
            ref={inputNameRef} 
          />
        </div>

        <div className="mb-4">

        <div className="flex flex-col md:flex-row mb-20 space-x-4">
          
                <SearchableDropdownToggler
                  selectedList={selectedSubjects}
                  setSelectedList={setSelectedSubjects}
                />
                  <div className="flex gap-2 flex-wrap ml-4 max-w-72">
                {selectedSubjects.length === 0 ? (
                  <span className="text-gray-500">No subjects selected</span>
                ) : (
                  selectedSubjects.map((subjectID) => (
                    <div key={subjectID} className="badge badge-secondary mb-2">
                      {subjects[subjectID].subject}
                    </div>
                  ))
                )}
              </div>

        
        </div>



          
        </div>
     
        <div className="flex justify-center gap-4 mt-4">
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
          <button className="btn btn-primary" onClick={handleAddTeacher}>
            Add Teacher
          </button>
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
  const [editSubjectCurr, setEditSubjectCurr] = useState([]);

  const handleEditTeacherClick = (teacher) => {
    setEditTeacherId(teacher.id);
    setEditTeacherValue(teacher.teacher);
    setEditTeacherCurr(teacher.subjects);
  };

  const handleSaveTeacherEditClick = (teacherId) => {

    if (!editTeacherValue.trim() || editTeacherCurr.length === 0) {
      alert('All fields are required.');
      return;
    }

    const currentTeacher = teachers[teacherId]?.teacher || '';

    if (editTeacherValue.trim().toLowerCase() === currentTeacher.trim().toLowerCase()) {
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
      setEditTeacherValue('');
      setEditTeacherCurr([]);
    } else {
      const duplicateTeacher = Object.values(teachers).find(
        (teacher) => teacher.teacher.trim().toLowerCase() === editTeacherValue.trim().toLowerCase()
      );

      if (duplicateTeacher) {
        alert('Teacher already exists.');
        return;
      } else {
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
        setEditTeacherValue('');
        setEditTeacherCurr([]);
      }
    }
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

  useEffect(() => {
    if (subjectStatus === 'idle') {
      dispatch(fetchSubjects());
    }
  }, [subjectStatus, dispatch]);

  
  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };


  const itemsPerPage = 10; // Change this to adjust the number of items per page
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(Object.values(searchTeacherResult).length / itemsPerPage);

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Object.entries(searchTeacherResult).slice(indexOfFirstItem, indexOfLastItem);


  return (
    <React.Fragment>
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:gap-4 justify-between items-center mb-5">
        <div className="flex-grow w-full">
          <label className="input input-bordered flex items-center gap-2 h-12 w-full">
            <input
              type="text"
              className="grow p-4 text-sm w-full"
              placeholder="Search Teacher"
              value={searchTeacherValue}
              onChange={(e) => setSearcTeacherValue(e.target.value)}
            />
            <IoSearch className="text-xl" />
          </label>
        </div>

        {editable && (
          <div className="w-full mt-4 md:mt-0 md:w-auto">
            <button
              className="btn btn-primary h-12 flex items-center justify-center w-full md:w-44"
              onClick={() => document.getElementById('add_teacher_modal').showModal()}
            >
              Add Teacher <IoAdd size={20} className="ml-2" />
            </button>

            <dialog id="add_teacher_modal" className="modal modal-bottom sm:modal-middle">
              <div className="modal-box">
                <AddTeacherContainer
                  close={() => document.getElementById('add_teacher_modal').close()}
                  reduxFunction={addTeacher}
                />
                <div className="modal-action">
                  <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => document.getElementById('add_teacher_modal').close()}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </dialog>
          </div>
        )}
      </div>

      <table className="table table-sm table-zebra">
        <thead>
          <tr>
            <th className="w-8">#</th>
            <th>Teacher ID</th>
            <th>Teacher</th>
            <th className="w-[600px]">Subject Specialization</th>
            {editable && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                No teachers found
              </td>
            </tr>
          ) : (
            currentItems.map(([, teacher], index) => (
              <tr key={teacher.id} className="group hover">
                <td>{index + indexOfFirstItem + 1}</td>
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
                    <>
                      <div className="m-1">Selected Subjects:</div>
                      {editTeacherCurr && Array.isArray(editTeacherCurr) && subjects ? (
                        editTeacherCurr.map((subjectID) => (
                          <div key={subjectID} className="badge badge-secondary m-1">
                            {subjects[subjectID]?.subject || subjectID}
                          </div>
                        ))
                      ) : (
                        <div>No subjects selected</div>
                      )}
                      <SearchableDropdownToggler
                        selectedList={editTeacherCurr}
                        setSelectedList={setEditTeacherCurr}
                        isEditable={true}
                      />
                    </>
                  ) : (
                    subjectStatus === 'succeeded' &&
                    teacher.subjects.map((subject) => (
                      <div key={subject} className="badge badge-secondary m-1">
                        {subjects[subject]?.subject || 'Unknown Subject'}
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
                          onClick={() => handleSaveTeacherEditClick(teacher.id)}
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
                          className="btn btn-xs btn-ghost text-blue-500"
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

      {/* Pagination */}
      {currentItems.length > 0 && (
        <div className="join mt-4 flex justify-center">
          <button
            className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
              }
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

    </div>
  </React.Fragment>
  );
};

export default TeacherListContainer;
