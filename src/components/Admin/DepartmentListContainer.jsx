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

import {toast} from "sonner";
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

const AddDepartmentContainer = ({ 
    close,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    reduxFunction,
}) => {
  const inputNameRef = useRef();
  const dispatch = useDispatch();
  const departments = useSelector((state) => state.department.departments);

  const [departmentName, setDepartmentName] = useState('');
  const [departmentHead, setDepartmentHead] = useState('');

  const handleAddDepartment = () => {
    if (!departmentName.trim() || !departmentHead.trim()) {
      setErrorMessage('Both department name and head name are required.');
        if(departmentName === ''){
          setErrorField('name');
        } else if (departmentHead === ''){
            setErrorField('depHead');
        } else{
          setErrorField('name');
          setErrorField('depHead');
        }
      return;
    }

    const duplicateDepartment = Object.values(departments).find(
      (department) =>
        department.name.trim().toLowerCase() === departmentName.trim().toLowerCase()
    );

    if (duplicateDepartment) {
      setErrorMessage('A department with this name already exists.');
      setErrorField('name'); 
    } else {
      dispatch(
        reduxFunction({
          name: departmentName,
          head: departmentHead,
        })
      ).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          toast.success('Department added successfully', {
            style: { backgroundColor: 'green', color: 'white', bordercolor: 'green' },
          });
          handleReset();
          close();
          if (inputNameRef.current) {
            inputNameRef.current.focus();
          }
        } else {
          toast.error('Failed to add department.');
        }
      });
    }
  };

  const handleReset = () => {
    setErrorField('');
    setErrorMessage('');
    setDepartmentName('');
    setDepartmentHead('');
  };

  useEffect(() => {
    if (inputNameRef.current) {
      inputNameRef.current.focus();
    }
  }, []);

  return (
    <div>
      <div>
        <h3 className="text-lg font-bold mb-4">Add New Department</h3>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Department Name:</label>
        <input
          type="text"
          className={`input input-bordered w-full ${errorField === 'name' ? 'border-red-500' : ''
          }`}
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          placeholder="Enter department name"
          ref={inputNameRef}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Department Head:</label>
        <input
          type="text"
          className={`input input-bordered w-full ${errorField === 'depHead' ? 'border-red-500' : ''
          }`}
          value={departmentHead}
          onChange={(e) => setDepartmentHead(e.target.value)}
          placeholder="Enter department head name"
        />
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm my-4 font-medium select-none ">{errorMessage}</p>
      )}

      <div className="flex justify-center gap-2">
        <button className="btn btn-secondary border-0" onClick={handleReset}>
            Reset
        </button>
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary" onClick={handleAddDepartment}>
            Add Department
          </button>
        </div>
      </div>
    </div>
  );
};

const DepartmentListContainer = ({ editable = false }) => {
  const dispatch = useDispatch();
  const { departments, status: departmentStatus } = useSelector(
    (state) => state.department
  );

  const [errorMessage, setErrorMessage] = useState('');
  const [errorField, setErrorField] = useState('');

  const [editDepartmentId, setEditDepartmentId] = useState(null);
  const [editDepartmentValue, setEditDepartmentValue] = useState('');
  const [editDepartmentHead, setEditDepartmentHead] = useState('');
  const [searchDepartmentValue, setSearchDepartmentValue] = useState('');
  const [searchDepartmentResult, setSearchDepartmentResult] = useState(departments);

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
    if (!editDepartmentValue.trim() || !editDepartmentHead.trim()) {
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

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(Object.values(searchDepartmentResult).length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Object.entries(searchDepartmentResult).slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const deleteModal = (id) => {
    const deleteModalElement = document.getElementById("delete_modal");
    deleteModalElement.showModal();  

    const deleteButton = document.getElementById("delete_button");
    deleteButton.onclick = () => handleDelete(id);  
  };

  const handleDelete = (id) => {
    dispatch(removeDepartment(id));  
    document.getElementById("delete_modal").close(); 
  };

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
                <td>
                  {editDepartmentId === department.id ? (
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      value={editDepartmentHead}
                      onChange={(e) => setEditDepartmentHead(e.target.value)}
                    />
                  ) : (
                    department.head || 'N/A'
                  )}
                </td>
                {editable && (
                  <td className="w-28 text-right">
                    {editDepartmentId === department.id ? (
                      <>
                        <button
                          className="btn btn-xs btn-ghost text-green-500"
                          onClick={() => handleSaveDepartmentEditClick(department.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-xs btn-ghost text-red-500"
                          onClick={handleCancelDepartmentEditClick}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-xs btn-ghost text-blue-500"
                          onClick={() => handleEditDepartmentClick(department)}
                        >
                          <RiEdit2Fill size={20} />
                        </button>
  
                        <button
                          className="btn btn-xs btn-ghost text-red-500"
                          onClick={() => deleteModal(department.id)}
                        >
                          <RiDeleteBin7Line size={20} />
                        </button>
  
                        {/* Modal for deleting department */}
                        <dialog id="delete_modal" className="modal modal-bottom sm:modal-middle">
                          <form method="dialog" className="modal-box">
                            <div className="flex flex-col items-center justify-center">
                              <TrashIcon className="text-red-500 mb-4" width={40} height={40} />
                              <h3 className="font-bold text-lg text-center">
                                Are you sure you want to delete this department?
                              </h3>
                              <p className="text-sm text-gray-500 text-center">
                                This action cannot be undone.
                              </p>
                            </div>
                            <div className="modal-action flex justify-center">
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => document.getElementById('delete_modal').close()}
                              >
                                Cancel
                              </button>
                              <button
                                id="delete_button"
                                className="btn btn-sm btn-error text-white"     
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

export default DepartmentListContainer;
