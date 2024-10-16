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
import Lottie from 'lottie-react';
import animationData from '/public/SuccessAnimation.json'


const SuccessModal = ({ message, onClose }) => {
  return (
    <div className="modal modal-open flex items-center justify-center z-10">
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

const AddSubjectContainer = ({
  close,
  reduxFunction,
  defaultSubjectClassDuration,
}) => {
  const inputNameRef = useRef();
  const dispatch = useDispatch();

  const [subjectName, setSubjectName] = useState('');
  const [classSubjectDuration, setClassSubjectDuration] = useState(
    defaultSubjectClassDuration || 10 // Ensure it defaults to 10 if undefined
  );

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleAddSubject = () => {
    const classDuration = parseInt(classSubjectDuration, 10);
    if (subjectName.trim()) {
      dispatch(
        reduxFunction({
          subject: subjectName,
          classDuration: classDuration,
        })
      );

      // Set success message and show the modal
      setModalMessage('Subject added successfully!');
      setShowSuccessModal(true);

      // Reset input fields
      setSubjectName('');
      setClassSubjectDuration(defaultSubjectClassDuration || 10);

      if (inputNameRef.current) {
        inputNameRef.current.focus();
      }
    } else {
      alert('Subject name cannot be empty');
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
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
    <div>
      <div>
        <h3 className="text-lg font-bold mb-4">Add New Subject</h3>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Subject Name:</label>
        <input
          type="text"
          className="input input-bordered w-full"
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
          className="input input-bordered w-full"
          value={classSubjectDuration}
          onChange={(e) => {
            const value = Number(e.target.value);
            setClassSubjectDuration(value);
          }}
          placeholder="Enter class duration"
          step={10}
          min={10}
        />
      </div>
      <div className="flex justify-center gap-2">
        <button className="btn btn-secondary border-0" onClick={handleReset}>
          Reset
        </button>
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary" onClick={handleAddSubject}>
            Add Subject
          </button>
        </div>
      </div>

      {/* Render SuccessModal if showSuccessModal is true */}
      {showSuccessModal && (
        <SuccessModal
          message={modalMessage}
          onClose={handleCloseModal}
        />
      )}
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

  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleEditSubjectClick = (subject) => {
    setEditSubjectId(subject.id);
    setEditSubjectValue(subject.subject);
    setEditClassDuration(subject.classDuration);
  };

  const handleSaveSubjectEditClick = (subjectId) => {
    dispatch(
      editSubject({
        subjectId,
        updatedSubject: {
          subject: editSubjectValue,
          classDuration: editClassDuration,
        },
      })
    );

    // Set success message and show the modal
    setModalMessage('Data Updated Successfully!');
    setShowSuccessModal(true);

    setEditSubjectId(null);
    setEditSubjectValue('');
    setEditClassDuration(0);
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

  const itemsPerPage = 10; // Change this to adjust the number of items per page
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(Object.values(searchSubjectResult).length / itemsPerPage);

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Object.entries(searchSubjectResult).slice(indexOfFirstItem, indexOfLastItem);

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:gap-4 justify-between items-center mb-5">
        {/* Search Filter */}
        <div className="flex-grow w-full">
          <label className="input input-bordered flex items-center gap-2 h-12 w-full">
            <input
              type="text"
              className="grow p-4 text-sm w-full"
              placeholder="Search Subject"
              value={searchSubjectValue}
              onChange={(e) => setSearchSubjectValue(e.target.value)}
            />
            <IoSearch className="text-xl" />
          </label>
        </div>

        {editable && (
          <div className="w-full mt-4 md:mt-0 md:w-auto">
            <button
              className="btn btn-primary h-12 flex items-center justify-center w-full md:w-40"
              onClick={() => document.getElementById('add_subject_modal').showModal()}
            >
              Add Subject <IoAdd size={20} className="ml-2" />
            </button>

            <dialog id="add_subject_modal" className="modal modal-bottom sm:modal-middle">
              <div className="modal-box">
                <AddSubjectContainer
                  close={() => document.getElementById('add_subject_modal').close()}
                  reduxFunction={addSubject}
                  defaultSubjectClassDuration={defaultSubjectClassDuration}
                />

                {/* Modal close button */}
                <div className="modal-action">
                  <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => {
                      document.getElementById('add_subject_modal').close();
                      handleReset();
                    }}
                    
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
                            onClick={() => dispatch(removeSubject(subject.id))}
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

        {showSuccessModal && (
          <SuccessModal
            message={modalMessage}
            onClose={handleCloseModal}
          />
        )}
      </div>

      {/* Pagination */}
      {currentItems.length > 0 && (
      <div className="join mt-4 flex justify-center">
        <button
          className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          «
        </button>
        <button className="join-item btn">Page {currentPage} of {totalPages}</button>
        <button
          className={`join-item btn ${currentPage === totalPages ? 'btn-disabled' : ''}`}
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          »
        </button>
      </div>
        )}
    </div>
  );
};

export default SubjectListContainer;