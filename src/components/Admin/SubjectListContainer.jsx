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

  const handleAddSubject = () => {
    const classDuration = parseInt(classSubjectDuration, 10);
    if (subjectName.trim()) {
      dispatch(
        reduxFunction({
          subject: subjectName,
          classDuration: classDuration,
        })
      );

      // setSubjectName('');

      if (inputNameRef.current) {
        inputNameRef.current.focus();
        inputNameRef.current.select();
      }
      // close();
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
    <div className="mb-3 p-4 border rounded-md shadow-md bg-white w-5/12 h-4/12">
      <div className="flex justify-between">
        <h3 className="text-lg font-bold mb-4">Add New Subject</h3>
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
        <label className="block text-sm font-medium mb-2">Subject Name:</label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="Enter subject name"
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
        <button className="btn btn-info bg-transparent border-0" onClick={handleReset}>
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

  return (
    <div className="">
      {/* Search Filter */}
      <label className="input input-sm input-bordered flex items-center gap-2">
        <input
          type="text"
          className="grow"
          placeholder="Search Subject"
          value={searchSubjectValue}
          onChange={(e) => setSearchSubjectValue(e.target.value)}
        />
        <IoSearch />
      </label>
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
          {Object.values(searchSubjectResult).length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center">
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
      {/* Add Button */}
      {editable && (
        <div>
          {openAddSubjectContainer ? (
            <AddSubjectContainer
              close={() => setOpenAddSubjectContainer(false)}
              reduxFunction={addSubject}
              defaultSubjectClassDuration={defaultSubjectClassDuration}
            />
          ) : (
            <div className="flex justify-end mt-3">
              <button
                className="btn btn-secondary my-5"
                onClick={() => {
                  setOpenAddSubjectContainer(true);
                }}
              >
                Add Subject
                <IoAdd size={26} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectListContainer;
