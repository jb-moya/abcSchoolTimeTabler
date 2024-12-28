import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import {
  fetchDepartments,
  addDepartment,
  editDepartment,
  removeDepartment,
} from '@features/departmentSlice';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { fetchTeachers } from '@features/teacherSlice';

import { toast } from "sonner";
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

import AddDepartmentContainer from './DepartmentAdd';
import DeleteData from '../DeleteData';
import DepartmentEdit from './DepartmentEdit';

const DepartmentListContainer = ({ editable = false }) => {
  const dispatch = useDispatch();
  const { departments, status: departmentStatus } = useSelector(
    (state) => state.department
  );

  const { teachers, status: teacherStatus } = useSelector(
    (state) => state.teacher
  );

  const [errorMessage, setErrorMessage] = useState('');
  const [errorField, setErrorField] = useState('');

  const [editDepartmentId, setEditDepartmentId] = useState(null);
  const [editDepartmentValue, setEditDepartmentValue] = useState('');
  const [editDepartmentHead, setEditDepartmentHead] = useState('');
  const [searchDepartmentValue, setSearchDepartmentValue] = useState('');
  const [searchDepartmentResult, setSearchDepartmentResult] = useState(departments);
  const [searchTerm, setSearchTerm] = useState('');


  const handleEditDepartmentClick = (department) => {
    setEditDepartmentId(department.id);
    setEditDepartmentValue(department.name);
    setEditDepartmentHead(department.head);
  };

  const handleClose = () => {
    const modal = document.getElementById('add_department_modal');
    if (modal) {
      modal.close();
      setErrorMessage('');
      setErrorField('');
    } else {
      console.error("Modal with ID 'add_department_modal' not found.");
    }
  };

  useEffect(() => {
    console.log('editDepartmentId', editDepartmentId);
  }, [editDepartmentId]);

  const handleSaveDepartmentEditClick = (departmentId) => {
    if (!editDepartmentValue.trim() || !editDepartmentHead) {
      toast.error('Both department name and head name are required.', {
        style: {
          backgroundColor: 'red',
          color: 'white',
        },
      });
      return;
    }

    const duplicateDepartment = Object.values(departments).find(
      (department) =>
        department.name.trim().toLowerCase() === editDepartmentValue.trim().toLowerCase()
    );

    if (duplicateDepartment && duplicateDepartment.id !== departmentId) {
      toast.error('A department with this name already exists.', {
        style: {
          backgroundColor: 'red',
          color: 'white',
        },
      });
    } else {
      dispatch(
        editDepartment({
          departmentId,
          updatedDepartment: { name: editDepartmentValue, head: editDepartmentHead },
        })
      ).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          toast.success('Department updated successfully!', {
            style: {
              backgroundColor: '#28a745',
              color: '#fff',
              borderColor: '#28a745',
            },
          });
          setEditDepartmentId(null);
          setEditDepartmentValue('');
          setEditDepartmentHead('');
        } else {
          toast.error('Failed to update department.');
        }
      });
    }
  };

  const handleCancelDepartmentEditClick = () => {
    setEditDepartmentId(null);
    setEditDepartmentValue('');
    setEditDepartmentHead('');
  };

  useEffect(() => {
    if (departmentStatus === 'idle') {
      dispatch(fetchDepartments());
    }
  }, [departmentStatus, dispatch]);

  const debouncedSearch = useCallback(
    debounce((searchValue, departments) => {
      setSearchDepartmentResult(
        filterObject(departments, ([, department]) => {
          const escapedSearchValue = escapeRegExp(searchValue)
            .split('\\*')
            .join('.*');

          const pattern = new RegExp(escapedSearchValue, 'i');

          return pattern.test(department.name);
        })
      );
    }, 200),
    []
  );

  useEffect(() => {
    debouncedSearch(searchDepartmentValue, departments);
  }, [searchDepartmentValue, departments, debouncedSearch]);

  useEffect(() => {
    if (teacherStatus === 'idle') {
      dispatch(fetchTeachers());
    }
  }, [teacherStatus, dispatch]);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(Object.values(searchDepartmentResult).length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Object.entries(searchDepartmentResult).slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
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
                handleCancelDepartmentEditClick();
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
                handleCancelDepartmentEditClick();
              }}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        )}

        {/* Remove Pagination if No Items */}
        {currentItems.length === 0 && currentPage > 1 && (
          <div className="hidden">
            {setCurrentPage(currentPage - 1)}
          </div>
        )}

        {/* Search Department */}
        <div className="flex-grow w-full md:w-1/3 lg:w-1/4">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <input
              type="text"
              className="grow p-3 text-sm w-full"
              placeholder="Search Department"
              value={searchDepartmentValue}
              onChange={(e) => setSearchDepartmentValue(e.target.value)}
            />
            <IoSearch className="text-xl" />
          </label>
        </div>

        {/* Add Department Button (only when editable) */}
        {editable && (
          <div className="w-full mt-4 md:mt-0 md:w-auto">
            <button
              className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
              onClick={() => document.getElementById('add_department_modal').showModal()}
            >
              Add Department <IoAdd size={20} className="ml-2" />
            </button>

            {/* Modal for adding department */}
            <dialog id="add_department_modal" className="modal modal-bottom sm:modal-middle">
              <div className="modal-box">
                <AddDepartmentContainer
                  close={() => document.getElementById('add_department_modal').close()}
                  reduxFunction={addDepartment}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table table-sm table-zebra md:table-md w-full">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>ID</th>
              <th>Department Name</th>
              <th>Department Head</th>
              {editable && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No departments found.
                </td>
              </tr>
            ) : (
              currentItems.map(([, department], index) => (
                <tr key={department.id} className="group hover">
                  <td>{index + 1}</td>
                  <td>{department.id}</td>
                  <td>
                    {editDepartmentId === department.id ? (
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        value={editDepartmentValue}
                        onChange={(e) => setEditDepartmentValue(e.target.value)}
                      />
                    ) : (
                      department.name
                    )}
                  </td>
                  <td className="flex gap-1 flex-wrap">
                    {editDepartmentId === department.id ? (
                      <div className="mt-3 relative w-full max-w-md md:max-w-lg lg:max-w-xl">
                        {/* Custom Dropdown with Search */}
                        <div className="relative">
                          <div className="dropdown w-full">
                            <button
                              tabIndex={0}
                              className={`btn w-full text-left ${errorField.includes('head') ? 'border-red-500' : ''
                                }`}
                            >
                              {editDepartmentHead
                                ? teachers[editDepartmentHead]?.teacher
                                : 'Assign a department head'}
                            </button>
                            <div
                              tabIndex={0}
                              className="dropdown-content menu bg-base-100 p-2 shadow rounded-box z-[1] w-full max-h-48 overflow-y-auto"
                            >
                              {/* Search Input */}
                              <input
                                type="text"
                                placeholder="Search for a teacher"
                                className="input input-bordered input-sm w-full mb-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                              {/* Options */}
                              <ul className="menu overflow-y-scroll max-h-40 scrollbar-hide">
                                {Object.keys(teachers)
                                  .filter(
                                    (key) =>
                                      teachers[key].department === department.id && // Filter teachers by department
                                      teachers[key].teacher
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()) // Filter by search term
                                  )
                                  .map((key) => (
                                    <li key={teachers[key].id}>
                                      <button
                                        className="w-full text-left"
                                        onClick={() => setEditDepartmentHead(teachers[key].id)}
                                      >
                                        {teachers[key].teacher}
                                      </button>
                                    </li>
                                  ))}
                                {Object.keys(teachers).filter(
                                  (key) =>
                                    teachers[key].department === department.id &&
                                    teachers[key].teacher
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase())
                                ).length === 0 && (
                                    <div className="px-4 py-2 opacity-50">Not found</div>
                                  )}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {errorField.includes('head') && (
                          <span className="text-red-500 text-sm mt-1">
                            Please select a department head.
                          </span>
                        )}
                      </div>
                    ) : (
                      teachers[department.head]?.teacher || 'N/A'
                    )}
                  </td>

                  {editable && (
                    <td className="w-28">
                          <div className="flex">
                             <DepartmentEdit
                              className="btn btn-xs btn-ghost text-blue-500"
                              department={department}  // Pass the entire subject object
                              errorMessage={errorMessage}
                              setErrorMessage={setErrorMessage}
                              errorField={errorField}
                              setErrorField={setErrorField}
                              reduxFunction={editDepartment}
                            /> 
                            
                            <DeleteData
                              className="btn btn-xs btn-ghost text-red-500"
                              id={department.id}
                              reduxFunction={removeDepartment}
                            />
                          </div>
                     
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

export default DepartmentListContainer;
