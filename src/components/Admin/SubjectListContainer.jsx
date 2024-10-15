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


const SuccessModal = ({ message, onClose }) => {
  return (
    <div className="modal modal-open flex items-center justify-center">
      <div className="modal-box flex flex-col items-center justify-center p-4"> {/* Added padding */}
        <div className="lottie-animation w-48 h-48">
          <Lottie
            animationData={
              {"v":"5.5.7","meta":{"g":"LottieFiles AE 0.1.20","a":"Phibee Deinla","k":"","d":"","tc":""},"fr":24,"ip":0,"op":36,"w":400,"h":400,"nm":"Success","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Shape Layer 3","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[194.188,197.333,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0]],"v":[[-103,-6.5],[-21,56],[67,-45]],"c":false},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[1,1,1,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":16,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Shape 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.794],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":24,"s":[0]},{"t":29,"s":[20]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.7],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":17,"s":[0]},{"t":36,"s":[100]}],"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":36,"st":0,"bm":0},{"ddd":0,"ind":2,"ty":4,"nm":"Shape Layer 6","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":3,"s":[0]},{"t":17,"s":[100]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[186.96,204.502,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":[0.667,0.667,0.667],"y":[1,1,1]},"o":{"x":[0.167,0.167,0.167],"y":[0.167,0.167,0.054]},"t":6,"s":[118,118,100]},{"t":19,"s":[86,86,100]}],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[227.801,227.801],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"st","c":{"a":0,"k":[0.339264993107,0.92611802045,0.468556033864,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":4,"ix":5},"lc":2,"lj":1,"ml":4,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[12.229,-5.67],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":0,"k":0,"ix":1},"e":{"a":0,"k":100,"ix":2},"o":{"a":0,"k":-90,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":36,"st":0,"bm":0},{"ddd":0,"ind":3,"ty":4,"nm":"Shape Layer 5","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":3,"s":[0]},{"t":17,"s":[100]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[186.96,204.502,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":[0.667,0.667,0.667],"y":[1,1,1]},"o":{"x":[0.167,0.167,0.167],"y":[0.167,0.167,-0.24]},"t":6,"s":[157,157,100]},{"t":19,"s":[86,86,100]}],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[227.801,227.801],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"st","c":{"a":0,"k":[0.339264993107,0.92611802045,0.468556033864,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":27,"ix":5},"lc":2,"lj":1,"ml":4,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[12.229,-5.67],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":0,"k":0,"ix":1},"e":{"a":0,"k":100,"ix":2},"o":{"a":0,"k":-90,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":36,"st":0,"bm":0},{"ddd":0,"ind":4,"ty":4,"nm":"Shape Layer 4","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":10,"s":[0]},{"t":38,"s":[100]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[186.96,204.502,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":[0.667,0.667,0.667],"y":[1,1,1]},"o":{"x":[0.167,0.167,0.167],"y":[0.167,0.167,-0.513]},"t":3,"s":[67,67,100]},{"t":27,"s":[100,100,100]}],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[227.801,227.801],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"fl","c":{"a":0,"k":[0.341176470588,0.925490255917,0.466666696586,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[12.229,-5.67],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":0,"k":0,"ix":1},"e":{"a":0,"k":100,"ix":2},"o":{"a":0,"k":-90,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":36,"st":0,"bm":0},{"ddd":0,"ind":5,"ty":4,"nm":"Shape Layer 1","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[186.96,204.502,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[227.801,227.801],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"st","c":{"a":0,"k":[0.339264993107,0.92611802045,0.468556033864,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":16,"ix":5},"lc":2,"lj":1,"ml":4,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[12.229,-5.67],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.27],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[100]},{"t":13,"s":[0]}],"ix":1},"e":{"a":0,"k":100,"ix":2},"o":{"a":0,"k":-90,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":36,"st":0,"bm":0}],"markers":[]}
            } // Replace with your Lottie JSON
            loop={false} // Ensures the animation does not loop
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
      <div className="flex justify-between">
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
  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );

  const defaultSubjectClassDuration = localStorage.getItem(
    'defaultSubjectClassDuration'
  );

  const [editSubjectId, setEditSubjectId] = useState(null);
  const [searchSubjectResult, setSearchSubjectResult] = useState(subjects);
  const [editSubjectValue, setEditSubjectValue] = useState('');
  const [editClassDuration, setEditClassDuration] = useState(0);
  const [searchSubjectValue, setSearchSubjectValue] = useState('');

  const [openAddSubjectContainer, setOpenAddSubjectContainer] = useState(false);

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

  return (
    <div className="">
    <div className="flex flex-col md:flex-row md:gap-4 justify-between items-center mb-5">
  {/* Search Filter */}
  <div className='flex-grow'>
  <label className="input input-bordered flex items-center gap-2 h-12">
    <input
      type="text"
      className="grow p-4 text-sm"
      placeholder="Search Subject"
      value={searchSubjectValue}
      onChange={(e) => setSearchSubjectValue(e.target.value)}
    />
    <IoSearch className="text-xl" />
  </label>
  </div>
  

  {editable && (
    <div className="mb-4 md:mb-0">
      <button
        className="btn btn-primary h-12 flex items-center justify-center w-full"
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
              onClick={() => document.getElementById('add_subject_modal').close()}
            >
              ✕
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )}
</div>

<>
      {/* Table */}
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
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center">
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
                          className="btn btn-xs btn-ghost text-red-500"
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

      {/* Pagination */}
      <div className="join mt-4">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={`join-item btn ${currentPage === index + 1 ? 'btn-active' : ''}`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button className="join-item btn btn-disabled">...</button>
      </div>
    </>    
    </div>
  );
};

export default SubjectListContainer;
