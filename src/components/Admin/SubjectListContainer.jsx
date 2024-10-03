import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { fetchSubjects, addSubject, editSubject, removeSubject } from '@features/subjectSlice';
import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-base-100 rounded-lg shadow-lg p-6 relative max-w-lg w-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 btn btn-circle btn-outline btn-sm text-gray-600 hover:text-red-500"
          aria-label="Close modal"
        >
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
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

const SuccessModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 relative">
        <h3 className="text-lg font-bold mb-4">Success!</h3>
        <p>{message}</p>
        <button
          onClick={onClose}
          className="btn btn-circle btn-outline btn-xs text-gray-600 hover:text-red-500 mt-4"
        >
          X
        </button>
      </div>
    </div>
  );
};

const AddSubjectContainer = ({ close, reduxFunction, defaultSubjectClassDuration, showSuccessModal }) => {
  const inputNameRef = useRef();
  const dispatch = useDispatch();

  const [subjectName, setSubjectName] = useState('');
  const [classSubjectDuration, setClassSubjectDuration] = useState(
    defaultSubjectClassDuration || 10
  );

  const handleAddSubject = () => {
    const classDuration = parseInt(classSubjectDuration, 10);
    if (subjectName.trim()) {
      dispatch(reduxFunction({ subject: subjectName, classDuration }));
      handleReset();
      close();
      showSuccessModal('Subject added successfully.');
      if (inputNameRef.current) {
        inputNameRef.current.focus();
        inputNameRef.current.select();
      }
    } else {
      alert('Subject name cannot be empty');
    }
  };

  const handleReset = () => {
    setSubjectName('');
    setClassSubjectDuration(defaultSubjectClassDuration || 10);
  };

  useEffect(() => {
    if (inputNameRef.current) {
      inputNameRef.current.focus();
    }
  }, []);

  return (
    <div className="mb-3 p-4">
      <h3 className="text-lg font-bold mb-4">Add New Subject</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Subject Name:</label>
        <input
          ref={inputNameRef}
          type="text"
          className="input input-bordered w-full"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="Enter subject name"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Class Duration (minutes):</label>
        <input
          type="number"
          className="input input-bordered w-full"
          value={classSubjectDuration}
          onChange={(e) => setClassSubjectDuration(Number(e.target.value))}
          placeholder="Enter class duration"
          step={10}
          min={10}
        />
      </div>
      <div className="flex justify-between">
        <button className="btn bg-transparent border-0" onClick={handleReset}>
          Reset
        </button>
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary" onClick={handleAddSubject}>
            Add Subject
          </button>
        </div>
      </div>
    </div>
  );
};

const SubjectListContainer = ({ editable = false }) => {
  const dispatch = useDispatch();
  const { subjects, status: subjectStatus } = useSelector((state) => state.subject);
  const defaultSubjectClassDuration = localStorage.getItem('defaultSubjectClassDuration');

  const [editSubjectId, setEditSubjectId] = useState(null);
  const [searchSubjectResult, setSearchSubjectResult] = useState(subjects);
  const [editSubjectValue, setEditSubjectValue] = useState('');
  const [editClassDuration, setEditClassDuration] = useState(0);
  const [searchSubjectValue, setSearchSubjectValue] = useState('');
  const [openAddSubjectContainer, setOpenAddSubjectContainer] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [addSuccessModalOpen, setAddSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (subjectStatus === 'idle') {
      dispatch(fetchSubjects());
    }
  }, [subjectStatus, dispatch]);

  const debouncedSearch = useCallback(
    debounce((searchValue, subjects) => {
      setSearchSubjectResult(
        filterObject(subjects, ([, subject]) => {
          const escapedSearchValue = escapeRegExp(searchValue).split('\\*').join('.*');
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

  const handleEditSubjectClick = (subject) => {
    setEditSubjectId(subject.id);
    setEditSubjectValue(subject.subject);
    setEditClassDuration(subject.classDuration);
  };

  const handleSaveSubjectEditClick = (subjectId) => {
    if (editSubjectValue.trim() === '' || editClassDuration <= 0) {
      alert('Both subject name and class duration must be valid.');
      return;
    }

    dispatch(
      editSubject({
        subjectId,
        updatedSubject: {
          subject: editSubjectValue,
          classDuration: editClassDuration,
        },
      })
    );
    setEditSubjectId(null);
    setEditSubjectValue('');
    setEditClassDuration(0);
    showSuccessModal('Data has been successfully updated.');
  };

  const handleCancelSubjectEditClick = () => {
    setEditSubjectId(null);
    setEditSubjectValue('');
    setEditClassDuration(0);
  };

  const handleEditClassDurationChange = (e) => {
    const value = Number(e.target.value);
    if (value % 10 === 0) {
      setEditClassDuration(value);
    } else {
      alert('Class duration must be in increments of 10 minutes.');
    }
  };

  const showSuccessModal = (message) => {
    setSuccessMessage(message);
    setSuccessModalOpen(true);
    setTimeout(() => {
      setSuccessModalOpen(false);
    }, 2000); // Automatically close after 2 seconds
  };

  const showAddSuccessModal = (message) => {
    setSuccessMessage(message);
    setAddSuccessModalOpen(true);
    setTimeout(() => {
      setAddSuccessModalOpen(false);
    }, 2000);
  };

  return (
    <div>
      {editable && (
        <div className="flex justify-between items-center mb-5">
          <div className="flex-grow mr-2">
            <label className="input input-md input-bordered flex items-center gap-2">
              <input
                type="text"
                className="grow p-4"
                placeholder="Search Subject"
                value={searchSubjectValue}
                onChange={(e) => setSearchSubjectValue(e.target.value)}
              />
              <IoSearch />
            </label>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setOpenAddSubjectContainer(true)}
          >
            Add Subject
            <IoAdd size={26} />
          </button>
        </div>
      )}

      <Modal isOpen={openAddSubjectContainer} onClose={() => setOpenAddSubjectContainer(false)}>
        <AddSubjectContainer
          close={() => setOpenAddSubjectContainer(false)}
          reduxFunction={addSubject}
          defaultSubjectClassDuration={defaultSubjectClassDuration}
          showSuccessModal={showAddSuccessModal}
        />
      </Modal>

      <SuccessModal isOpen={successModalOpen} onClose={() => setSuccessModalOpen(false)} message={successMessage} />
      <SuccessModal isOpen={addSuccessModalOpen} onClose={() => setAddSuccessModalOpen(false)} message="Subject added successfully." />

      <table className="table table-sm table-zebra">
        <thead>
          <tr>
            <th className="w-8">#</th>
            <th>Subject ID</th>
            <th>Subject</th>
            <th>Class Duration</th>
            {editable && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {Object.values(searchSubjectResult).length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                No subjects found
              </td>
            </tr>
          ) : (
            Object.entries(searchSubjectResult).map(([, subject], index) => (
              <tr key={subject.id} className="group hover">
                <td>{index + 1}</td>
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
                      onChange={handleEditClassDurationChange}
                      className="input input-bordered input-sm w-full"
                      step={10}
                      min={10}
                    />
                  ) : (
                    `${subject.classDuration} mins`
                  )}
                </td>
                {editable && (
                  <td className="flex justify-end gap-2">
                    {editSubjectId === subject.id ? (
                      <>
                        <button
                          className="btn btn-sm btn-primary" // Green for save
                          onClick={() => handleSaveSubjectEditClick(subject.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-sm " // Warning for cancel
                          onClick={handleCancelSubjectEditClick}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-sm btn-primary" // Green for edit
                          onClick={() => handleEditSubjectClick(subject)}
                        >
                          <RiEdit2Fill />
                        </button>
                        <button
                          className="btn btn-sm btn-danger" // Red for delete
                          onClick={() => dispatch(removeSubject(subject.id))}
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
  );
};

export default SubjectListContainer;
