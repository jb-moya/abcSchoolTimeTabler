import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import {
  fetchSubjects,
  addSubject,
  editSubject,
  removeSubject,
} from '@features/subjectSlice';
import { getDurationIndex, getDurationEqualToIndex } from './timeSlotMapper';
import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

const AddSubjectContainer = ({
  close,
  reduxFunction,
  defaultSubjectClassDuration,
}) => {
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
          classDuration: getDurationIndex(classDuration),
        })
      );
      close();
    } else {
      alert('Subject name cannot be empty');
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-md bg-white">
      <h3 className="text-lg font-bold mb-4">Add New Subject</h3>
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
            if (value >= 10 && value <= 240) {
              setClassSubjectDuration(value);
            } else {
              alert('Duration must be between 10 and 240 minutes (4 hrs).');
            }
          }}
          placeholder="Enter class duration"
          step={10}
          min={10}
          max={240}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button className="btn btn-secondary" onClick={close}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleAddSubject}>
          Add Subject
        </button>
      </div>
    </div>
  );
};

const SubjectListContainer = ({ mode }) => {
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
  // const [subjectInputValue, setSubjectInputValue] = useState('');
  const [searchSubjectValue, setSearchSubjectValue] = useState('');

  const [openAddSubjectContainer, setOpenAddSubjectContainer] = useState(false);

  const handleEditSubjectClick = (subject) => {
    setEditSubjectId(subject.id);
    setEditSubjectValue(subject.subject);
    setEditClassDuration(getDurationEqualToIndex(subject.classDuration));
  };

  const handleSaveSubjectEditClick = (subjectId) => {
    dispatch(
      editSubject({
        subjectId,
        updatedSubject: {
          subject: editSubjectValue,
          classDuration: getDurationIndex(editClassDuration),
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

  // const handleKeyDown = (e) => {
  //     if (e.key === "Enter") {
  //         e.preventDefault();
  //         if (subjectInputValue.trim()) {
  //             dispatch(addSubject({ subject: subjectInputValue }));
  //             setSubjectInputValue("");
  //         }
  //     }
  // };

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
            {mode === 0 && <th className="text-right">Actions</th>}
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
                        if (newDuration >= 10 && newDuration <= 240) {
                          setEditClassDuration(newDuration);
                        }
                      }}
                      className="input input-bordered input-sm w-full"
                      placeholder="Enter class duration"
                      step={10}
                      min={10}
                      max={240}
                    />
                  ) : (
                    `${getDurationEqualToIndex(subject.classDuration)} mins`
                  )}
                </td>
                {mode === 0 
                  && 
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
                }
                
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Add Button */}
      {mode === 0 && 
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
      }
      
    </div>
  );
};

export default SubjectListContainer;
