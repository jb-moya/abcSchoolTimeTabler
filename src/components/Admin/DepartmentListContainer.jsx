import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { toast } from 'sonner';
import {
  fetchDepartments,
  addDepartment,
  editDepartment,
  removeDepartment,
} from '@features/departmentSlice';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

const AddDepartmentContainer = ({ 
    close,
    reduxFunction,
}) => {
  const inputNameRef = useRef();
  const dispatch = useDispatch();
  const departments = useSelector((state) => state.department.departments);

  const [departmentName, setDepartmentName] = useState('');
  const [departmentHead, setDepartmentHead] = useState('');

  const handleAddDepartment = () => {
    if (!departmentName.trim() || !departmentHead.trim()) {
      alert('Both department name and head name are required.');
      return;
    }

    const duplicateDepartment = Object.values(departments).find(
      (department) =>
        department.name.trim().toLowerCase() === departmentName.trim().toLowerCase()
    );

    if (duplicateDepartment) {
      alert('A department with this name already exists.');
    } else {
      dispatch(
        reduxFunction({
          name: departmentName,
          head: departmentHead,
        })
      ).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          toast.success('Department added successfully!', {
            style: {
              backgroundColor: '#28a745',
              borderColor: '#28a745',
              color: '#fff',
            },
          });
          setDepartmentName('');
          setDepartmentHead('');
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
          className="input input-bordered w-full"
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
          className="input input-bordered w-full"
          value={departmentHead}
          onChange={(e) => setDepartmentHead(e.target.value)}
          placeholder="Enter department head name"
        />
      </div>
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


  useEffect(() => {
    console.log('editDepartmentId', editDepartmentId);
  }, [editDepartmentId]);
  
  const handleSaveDepartmentEditClick = (departmentId) => {
    if (!editDepartmentValue.trim() || !editDepartmentHead.trim()) {
      alert('Both department name and head name are required.');
      return;
    }

    const duplicateDepartment = Object.values(departments).find(
      (department) =>
        department.name.trim().toLowerCase() === editDepartmentValue.trim().toLowerCase()
    );

    if (duplicateDepartment && duplicateDepartment.id !== departmentId) {
      alert('A department with this name already exists.');
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

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5">
        {currentItems.length > 0 && (
          <div className="join flex justify-center mb-4 md:mb-0">
            <button
              className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
              onClick={() => {
                if (currentPage > 1) setCurrentPage(currentPage - 1);
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
              className={`join-item btn ${
                currentPage === totalPages ? 'btn-disabled' : ''
              }`}
              onClick={() => {
                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                handleCancelDepartmentEditClick();
              }}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        )}
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
        {editable && (
          <div className="w-full mt-4 md:mt-0 md:w-auto">
            <button
              className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
              onClick={() => document.getElementById('add_department_modal').showModal()}
            >
              Add Department <IoAdd size={20} className="ml-2" />
            </button>
            <dialog
              id="add_department_modal"
              className="modal modal-bottom sm:modal-middle"
            >
              <div className="modal-box">
                <AddDepartmentContainer
                  close={() => document.getElementById('add_department_modal').close()}
                  reduxFunction={addDepartment}
                />
                <div className="modal-action">
                  <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => document.getElementById('add_department_modal').close()}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </dialog>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="table table-sm table-zebra md:table-md w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Department Name</th>
              <th>Department Head</th>
              {editable && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map(([, department], index) => (
                <tr key={department.id}>
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
                    <td>
                      {editDepartmentId === department.id ? (
                        <div className="flex gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleSaveDepartmentEditClick(department.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={handleCancelDepartmentEditClick}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => handleEditDepartmentClick(department)}
                          >
                            <RiEdit2Fill />
                          </button>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => dispatch(removeDepartment(department.id))}
                          >
                            <RiDeleteBin7Line />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">
                  No departments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentListContainer;
