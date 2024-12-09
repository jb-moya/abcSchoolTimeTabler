import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRanks,
  addRank,
  editRank,
  removeRank,
} from '@features/rankSlice';
import debounce from 'debounce';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';

import { toast } from "sonner";
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

const AddTeacherRankContainer = ({
  close,
  reduxFunction,
  errorMessage,
  setErrorMessage,
  errorField,
  setErrorField,
}) => {
  const inputNameRef = useRef();
  const { ranks, status: rankStatus } = useSelector(
    (state) => state.rank
  )

  const dispatch = useDispatch();

  const [rankValue, setRankValue] = useState('');
  // const [rankLoad, setRankLoad] = useState(1800);

  // const rankLoadInHours = rankLoad / 60;
  
  const handleAddRank = () => {
    
    if (!rankValue.trim() || rankLoad === 0) {
      setErrorMessage('All fields are required.');
      if (rankValue === ""){
        setErrorField('rank');
      } else {
        setErrorField('load');
      }
      return;
    }

    const duplicateRank = Object.values(ranks).find(
      (r) => r.rank.trim().toLowerCase() === rankValue.trim().toLowerCase()
    );

    if (duplicateRank) {
      setErrorMessage('Rank already exists.');
      setErrorField('rank');
      return;
    } else {
      dispatch(
        reduxFunction({
          rank: rankValue,
          // load: rankLoad,
        })
      );
    }

    toast.success('Rank added successfully', {
      style: { backgroundColor: 'green', color: 'white', bordercolor: 'green', },
    });
    handleReset();
    close();

    if (inputNameRef.current) {
      inputNameRef.current.focus();
      inputNameRef.current.select();
    }
    
  };

  const handleRankLoadChange = (e) => {
    setRankLoad(Number(e.target.value) * 60);
  };

  const handleReset = () => {
    setErrorField('');
    setErrorMessage('');
    setRankValue('');
    // setRankLoad(1800);
  };

  useEffect(() => {
    if (rankStatus === 'idle') {
      dispatch(fetchRanks());
    }
  }, [rankStatus, dispatch]);

  useEffect(() => {
    if (inputNameRef.current) {
        inputNameRef.current.focus();
    }
  }, []);

  return (
    <div className="justify-left">
      <div className="flex justify-center mb-4">
        <h3 className="text-xl font-bold">Add New Rank</h3>
      </div>

      {/* Rank Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="rankName">Rank Name:</label>
        <input
          id="rankName"
          type="text"
          className={`input input-bordered w-full ${errorField === 'rank' ? 'border-red-500' : ''
          }`}
          value={rankValue}
          onChange={(e) => setRankValue(e.target.value)}
          placeholder="Enter rank name"
          aria-label="Rank Name"
          ref={inputNameRef} 
        />
      </div>

      {/* Rank Load */}
      {/* <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="rankLoad">
          Input Rank Load (hours):
        </label>
        <input
          id="rankLoad"
          type="number"
          className={`input input-bordered w-full ${errorField === 'load' ? 'border-red-500' : ''
          }`}
          value={rankLoadInHours}
          onChange={handleRankLoadChange}
          min={10}
          max={40}
          step={1}
        />
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm my-4 font-medium select-none ">{errorMessage}</p>
      )}

      <div className="flex justify-center gap-4 mt-4">
        <button className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
        <button className="btn btn-primary" onClick={handleAddRank}>
          Add Rank
        </button>
      </div>
    </div>

  );
};

const TeacherRankListContainer = ({ editable = false }) => {
  const dispatch = useDispatch();

  const { ranks, status: rankStatus } = useSelector(
    (state) => state.rank
  )

  const [errorMessage, setErrorMessage] = useState('');
  const [errorField, setErrorField] = useState('');

  const [editRankId, setEditRankId] = useState(null);
  const [editRankValue, setEditRankValue] = useState('');
  // const [editRankLoad, setEditRankLoad] = useState(1800);

  const [searchRankResult, setSearchRankResult] = useState(ranks);
  const [searchRankValue, setSearchRankValue] = useState('');

  // const rankLoadInHours = editRankLoad / 60;

  const handleRankLoadChange = (e) => {
    setEditRankLoad(Number(e.target.value) * 60);
  };

  const handleEditRankClick = (rank) => {
    setEditRankId(rank.id);
    setEditRankValue(rank.rank);
    // setEditRankLoad(rank.load);
  };

  const handleSaveRankEditClick = (rankId) => {

    if (!editRankValue.trim() || editRankLoad === 0) {
      toast.error('All fields are required.', {
        style: { backgroundColor: 'red', color: 'white' },
      });
      return;
    }

    const currentRank = ranks[rankId]?.rank || '';

    if (editRankValue.trim().toLowerCase() === currentRank.trim().toLowerCase()) {
      dispatch(
        editRank({
          rankId,
          updatedRank: {
            rank: editRankValue,
            // load: editRankLoad,
          },
        })
      );

      setEditRankId(null);
      setEditRankValue('');
      // setEditRankLoad(0);
    } else {
      const duplicateRank = Object.values(ranks).find(
        (rank) => rank.rank.trim().toLowerCase() === editRankValue.trim().toLowerCase()
      );

      if (duplicateRank) {
        toast.error('Rank already exists.', {
          style: { backgroundColor: 'red', color: 'white' },
        });
        return;
      } else {
        dispatch(
          editRank({
            rankId,
            updatedRank: {
              rank: editRankValue,
              // load: editRankLoad,
            },
          })
        );

        toast.success('Data updated successfully', {
          style: { backgroundColor: 'green', color: 'white', bordercolor: 'green', },
        });
        setEditRankId(null);
        setEditRankValue('');
        // setEditRankLoad(0);
      }
    }
  };

  const handleCancelRankEditClick = () => {
    setEditRankId(null);
    setEditRankValue('');
    // setEditRankLoad(0);
  };

  const debouncedSearch = useCallback(
    debounce((searchValue, ranks) => {
      setSearchRankResult(
        filterObject(ranks, ([, rank]) => {
          if (!searchValue) return true;

          const escapedSearchValue = escapeRegExp(searchValue)
            .split('\\*')
            .join('.*');

          const pattern = new RegExp(escapedSearchValue, 'i');

          return (
            pattern.test(rank.rank) || pattern.test(rank.load)
          );
        })
      );
    }, 200),
    []
  );

  useEffect(() => {
    debouncedSearch(searchRankValue, ranks);
  }, [searchRankValue, ranks, debouncedSearch]);

  useEffect(() => {
    if (rankStatus === 'idle') {
      dispatch(fetchRanks());
    }
  }, [rankStatus, dispatch]);

  const handleClose = () => {
    const modal = document.getElementById('add_rank_modal');
    if (modal) {
      modal.close();
      setErrorMessage('');
      setErrorField('');
    } else {
      console.error("Modal with ID 'add_teacher_modal' not found.");
    }
  };

  const deleteModal = (id) => {
    const deleteModalElement = document.getElementById("delete_modal");
    deleteModalElement.showModal();  

    const deleteButton = document.getElementById("delete_button");
    deleteButton.onclick = () => handleDelete(id);  
  };

  const handleDelete = (id) => {
    dispatch(removeRank(id));  
    document.getElementById("delete_modal").close(); 
  };

  
  const itemsPerPage = 10; // Change this to adjust the number of items per page
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(Object.values(searchRankResult).length / itemsPerPage);

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Object.entries(searchRankResult).slice(indexOfFirstItem, indexOfLastItem);

  return (
    <React.Fragment>
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
              handleCancelRankEditClick();
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
              handleCancelRankEditClick();
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

      {/* Search Rank */}
      <div className="flex-grow w-full md:w-1/3 lg:w-1/4">
        <label className="input input-bordered flex items-center gap-2 w-full">
          <input
            type="text"
            className="grow p-3 text-sm w-full"
            placeholder="Search Rank"
            value={searchRankValue}
            onChange={(e) => setSearchRankValue(e.target.value)}
          />
          <IoSearch className="text-xl" />
        </label>
      </div>

      {/* Add Rank Button (only when editable) */}
      {editable && (
        <div className="w-full mt-4 md:mt-0 md:w-auto">
          <button
            className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
            onClick={() => document.getElementById('add_rank_modal').showModal()}
          >
            Add Rank <IoAdd size={20} className="ml-2" />
          </button>

          {/* Modal for adding rank */}
          <dialog id="add_rank_modal" className="modal modal-bottom sm:modal-middle">
            <div className="modal-box">
              <AddTeacherRankContainer
                close={() => document.getElementById('add_rank_modal').close()}
                reduxFunction={addRank}
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
      <div className='overflow-x-auto'>
      <table className="table table-sm table-zebra w-full">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th className="whitespace-nowrap">Rank ID</th>
              <th className="whitespace-nowrap">Rank</th>
              {/* <th className="whitespace-nowrap max-w-xs">Weekly Load (hours)</th> */}
              {editable && <th className="w-28 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No ranks found
                </td>
              </tr>
            ) : (
              currentItems.map(([, rank], index) => (
                <tr key={rank.id} className="group hover">
                  <td>{index + indexOfFirstItem + 1}</td>
                  <th>{rank.id}</th>
                  <td>
                    {editRankId === rank.id ? (
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        value={editRankValue}
                        onChange={(e) => setEditRankValue(e.target.value)}
                      />
                    ) : (
                      rank.rank
                    )}
                  </td>
                  {/* <td className="flex gap-1 flex-wrap">
                    {editRankId === rank.id ? (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-1" htmlFor="rankLoad">
                            Input Rank Load (hours):
                          </label>
                          <input
                            id="rankLoad"
                            type="number"
                            className="input input-bordered w-full"
                            value={rankLoadInHours}
                            onChange={handleRankLoadChange}
                            min={10}
                            max={40}
                            step={1}
                          />
                        </div>
                      </>
                    ) : (
                      rank.load / 60
                    )}
                  </td> */}
                  {editable && (
                    <td className="w-28 text-right">
                      {editRankId === rank.id ? (
                        <>
                          <button
                            className="btn btn-xs btn-ghost text-green-500"
                            onClick={() => handleSaveRankEditClick(rank.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => handleCancelRankEditClick()}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-xs btn-ghost text-blue-500"
                            onClick={() => handleEditRankClick(rank)}
                          >
                            <RiEdit2Fill size={20} />
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-red-500"
                            onClick={() => deleteModal(rank.id)}
                          >
                            <RiDeleteBin7Line size={20} />
                          </button>

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
  </React.Fragment>
  );
};

export default TeacherRankListContainer;
