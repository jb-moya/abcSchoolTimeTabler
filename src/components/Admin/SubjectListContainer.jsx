import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import {
  fetchSubjects,
  addSubject,
  editSubject,
  removeSubject,
} from '@features/subjectSlice';
import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

import {toast } from "sonner";
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

const AddSubjectContainer = ({
  close,
  reduxFunction,
  errorMessage,
  setErrorMessage,
  errorField,
  setErrorField,
  defaultSubjectClassDuration,
}) => {
  const inputNameRef = useRef();
  const dispatch = useDispatch();
  const subjects = useSelector((state) => state.subject.subjects);

  const [subjectName, setSubjectName] = useState('');
  const [classSubjectDuration, setClassSubjectDuration] = useState(
    defaultSubjectClassDuration || 10
  );
   // Tracks which input field has an error

  useEffect(() => {
    if (!close) {
      setErrorMessage('');
      setErrorField('');
    }
  }, [close, setErrorMessage, setErrorField]);

  const handleAddSubject = () => {

    handleReset();

    if (!subjectName.trim()) {
      setErrorMessage('Subject name cannot be empty');
      setErrorField('name'); // Highlight Subject Name input
      return;
    } else if (!classSubjectDuration) {
      setErrorMessage('Class duration cannot be empty');
      setErrorField('duration'); // Highlight Class Duration input
      return;
    }

    const classDuration = parseInt(classSubjectDuration, 10);

    const duplicateSubject = Object.values(subjects).find(
      (subject) =>
        subject.subject.trim().toLowerCase() === subjectName.trim().toLowerCase()
    );

    if (duplicateSubject) {
      setErrorMessage('A subject with this name already exists');
      setErrorField('name');
    } else {
      dispatch(
        reduxFunction({
          subject: subjectName,
          classDuration: classDuration,
        })
      );

      toast.success('Subject added successfully', {
        style: { backgroundColor: 'green', color: 'white', bordercolor: 'green' },
      });

      handleReset();
      close();
    }
  };

  const handleReset = () => {
    setSubjectName('');
    setClassSubjectDuration(defaultSubjectClassDuration || 10);
    setErrorMessage('');
    setErrorField('');
    if (inputNameRef.current) {
      inputNameRef.current.focus();
    }
  };

  useEffect(() => {
    if (inputNameRef.current) {
      inputNameRef.current.focus();
    }
  }, []);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Add New Subject</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Subject Name:</label>
        <input
          type="text"
          className={`input input-bordered w-full ${errorField === 'name' ? 'border-red-500' : ''
            }`}
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="Enter subject name"
          ref={inputNameRef}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Class Duration (minutes):
        </label>
        <input
          type="number"
          className={`input input-bordered w-full ${errorField === 'duration' ? 'border-red-500' : ''
            }`}
          value={classSubjectDuration}
          onChange={(e) => setClassSubjectDuration(Number(e.target.value))}
          placeholder="Enter class duration"
          step={10}
          min={10}
        />
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm my-4 font-medium select-none ">{errorMessage}</p>
      )}

      <div className="flex justify-center gap-2">
        <button className="btn btn-secondary border-0" onClick={handleReset}>
          Reset
        </button>
        <button className="btn btn-primary" onClick={handleAddSubject}>
          Add Subject
        </button>
      </div>
    </div>
  );
};


const SubjectListContainer = ({ editable = false }) => {
  const dispatch = useDispatch();
  const { subjects, status: subjectStatus } = useSelector((state) => state.subject);

  const defaultSubjectClassDuration = localStorage.getItem('defaultSubjectClassDuration');

  const [errorMessage, setErrorMessage] = useState('');
  const [errorField, setErrorField] = useState('');

  const [editSubjectId, setEditSubjectId] = useState(null);
  const [searchSubjectResult, setSearchSubjectResult] = useState(subjects);
  const [editSubjectValue, setEditSubjectValue] = useState('');
  const [editClassDuration, setEditClassDuration] = useState(0);
  const [searchSubjectValue, setSearchSubjectValue] = useState('');

  const handleClose = () => {
    const modal = document.getElementById('add_subject_modal');
    if (modal) {
        modal.close();
        setErrorMessage('');
        setErrorField('');
    } else {
        console.error("Modal with ID 'add_subject_modal' not found.");
    }
};

  const handleEditSubjectClick = (subject) => {
    setEditSubjectId(subject.id);
    setEditSubjectValue(subject.subject);
    setEditClassDuration(subject.classDuration);
  };

  const handleSaveSubjectEditClick = (subjectId) => {

    if (!editSubjectValue.trim()) {
      toast.error('Subject name cannot be empty', {
        style: { backgroundColor: 'red', color: 'white' },
      });

      return;
    } else if (!editClassDuration) {
      toast.error('Class duration cannot be empty', {
        style: { backgroundColor: 'red', color: 'white' },
      });
      return;
    }

    const currentSubject = subjects[subjectId]?.subject || '';

    if (editSubjectValue.trim().toLowerCase() === currentSubject.toLowerCase()) {
      dispatch(
        editSubject({
          subjectId,
          updatedSubject: {
            subject: editSubjectValue,
            classDuration: editClassDuration,
          },
        })
      );

      toast.success('Data updated successfully', {
        style: { backgroundColor: 'green', color: 'white', bordercolor: 'green', },
      });

      setEditSubjectId(null);
      setEditSubjectValue('');
      setEditClassDuration(0);
    } else {
      const duplicateSubject = Object.values(subjects).find(
        (subject) => subject.subject.trim().toLowerCase() === editSubjectValue.trim().toLowerCase()
      );

      if (duplicateSubject) {
        alert('A subject with this name already exists.');
      } else if (editSubjectValue.trim()) {
        dispatch(
          editSubject({
            subjectId,
            updatedSubject: {
              subject: editSubjectValue,
              classDuration: editClassDuration,
            },
          })
        );

        toast.success('Data updated successfully', {
          style: { backgroundColor: 'green', color: 'white', bordercolor: 'green', },
        });

        setEditSubjectId(null);
        setEditSubjectValue('');
        setEditClassDuration(0);
      }
    }
  };

  const handleCancelSubjectEditClick = () => {
    setEditSubjectId(null);
    setEditSubjectValue('');
    setEditClassDuration(0);
  };

  useEffect(() => {
    if (subjectStatus === 'idle') {
      dispatch(fetchSubjects());
    }
  }, [subjectStatus, dispatch]);

  const debouncedSearch = useCallback(
    debounce((searchValue, subjects) => {
      setSearchSubjectResult(
        filterObject(subjects, ([, subject]) => {
          const escapedSearchValue = escapeRegExp(searchValue)
            .split('\\*')
            .join('.*');

          const pattern = new RegExp(escapedSearchValue, 'i');

          return pattern.test(subject.subject);
        })
      );
    }, 200),
    []
  );

  useEffect(() => {
    debouncedSearch(searchSubjectValue, subjects);
  }, [searchSubjectValue, subjects, debouncedSearch]);

  const deleteModal = (id) => {
    const deleteModalElement = document.getElementById("delete_modal");
    deleteModalElement.showModal();  

    const deleteButton = document.getElementById("delete_button");
    deleteButton.onclick = () => handleDelete(id);  
  };

  const handleDelete = (id) => {
    dispatch(removeSubject(id));  
    document.getElementById("delete_modal").close(); 
  };

  const itemsPerPage = 10; // Change this to adjust the number of items per page
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(Object.values(searchSubjectResult).length / itemsPerPage);

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Object.entries(searchSubjectResult).slice(indexOfFirstItem, indexOfLastItem);


  return (
    <div className="w-full">

      <div className="flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5">
        {/* Pagination */}
        {currentItems.length > 0 && (
          <div className="join flex justify-center  mb-4 md:mb-0">
            <button
              className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                }
                handleCancelSubjectEditClick();
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
                handleCancelSubjectEditClick();
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

        {/* Search Subject */}
        <div className="flex-grow w-full md:w-1/3 lg:w-1/4">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <input
              type="text"
              className="grow p-3 text-sm w-full"
              placeholder="Search Subject"
              value={searchSubjectValue}
              onChange={(e) => setSearchSubjectValue(e.target.value)}
            />
            <IoSearch className="text-xl" />
          </label>
        </div>

        {/* Add Subject Button (only when editable) */}
        {editable && (
          <div className="w-full mt-4 md:mt-0 md:w-auto">
            <button
              className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
              onClick={() => document.getElementById('add_subject_modal').showModal()}
            >
              Add Subject <IoAdd size={20} className="ml-2" />
            </button>

            {/* Modal for adding subject */}
            <dialog id="add_subject_modal" className="modal modal-bottom sm:modal-middle">
              <div className="modal-box">
              <AddSubjectContainer
                  close={() => document.getElementById('add_subject_modal').close()}
                  reduxFunction={addSubject}
                  errorMessage={errorMessage}
                  setErrorMessage={setErrorMessage}
                  errorField={errorField}
                  setErrorField={setErrorField}
                  defaultSubjectClassDuration={defaultSubjectClassDuration}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table table-sm table-zebra md:table-md w-full">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Subject ID</th>
              <th>Subject</th>
              <th>Class Duration</th>
              {editable && <th className="text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No subjects found
                </td>
              </tr>
            ) : (
              currentItems.map(([, subject], index) => (
                <tr key={subject.id} className="group hover">
                  <td>{index + indexOfFirstItem + 1}</td>
                  <th>{subject.id}</th>
                  <td>
                    {editSubjectId === subject.id ? (
                      <input
                        type="text"
                        value={editSubjectValue}
                        onChange={(e) => setEditSubjectValue(e.target.value)}
                        className="input input-bordered input-sm w-full"
                      />
                    ) : (
                      subject.subject
                    )}
                  </td>
                  <td>
                    {editSubjectId === subject.id ? (
                      <input
                        type="number"
                        value={editClassDuration}
                        onChange={(e) => {
                          const newDuration = Number(e.target.value);
                          setEditClassDuration(newDuration);
                        }}
                        className="input input-bordered input-sm w-full"
                        placeholder="Enter class duration"
                        step={10}
                        min={10}
                      />
                    ) : (
                      `${subject.classDuration} mins`
                    )}
                  </td>
                  {editable && (
                    <td className="w-28 text-right">
                      {editSubjectId === subject.id ? (
                        <>
                          <button
                            className="btn btn-xs btn-ghost text-green-500"
                            onClick={() => handleSaveSubjectEditClick(subject.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => handleCancelSubjectEditClick()}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-xs btn-ghost text-blue-500"
                            onClick={() => handleEditSubjectClick(subject)}
                          >
                            <RiEdit2Fill size={20} />
                          </button>


                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => deleteModal(subject.id)}
                          >
                            <RiDeleteBin7Line size={20} />
                          </button>

                          {/* Modal for deleting an item */}
                          <dialog id="delete_modal" className="modal modal-bottom sm:modal-middle">
                            <form method="dialog" className="modal-box">
                              {/* Icon and message */}
                              <div className="flex flex-col items-center justify-center">
                                <TrashIcon className="text-red-500 mb-4" width={40} height={40} />
                                <h3 className="font-bold text-lg text-center">
                                  Are you sure you want to delete this item?
                                </h3>
                                <p className="text-sm text-gray-500 text-center">
                                  This action cannot be undone.
                                </p>
                              </div>

                              {/* Modal actions */}
                              <div className="modal-action flex justify-center">
                                {/* Close Button */}
                                <button
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => document.getElementById("delete_modal").close()}
                                  aria-label="Cancel deletion"
                                >
                                  Cancel
                                </button>

                                {/* Confirm Delete Button */}
                                <button
                                  className="btn btn-sm btn-error text-white"
                                  id="delete_button"
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
  );
};

export default SubjectListContainer;