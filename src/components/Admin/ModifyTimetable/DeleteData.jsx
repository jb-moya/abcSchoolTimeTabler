import React, { useState } from 'react';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import { RiDeleteBin7Line } from 'react-icons/ri';

const DeleteData = ({ handleDeleteButton, data }) => {
    const [deleteCheckbox, setDeleteCheckbox] = useState(false);

    const handleDelete = async () => {
        handleDeleteButton(data, deleteCheckbox);
        closeModal();
    };

    const handleDeleteCheckbox = () => {
        setDeleteCheckbox(!deleteCheckbox);
    };

    const openModal = () => {
        const deleteModalElement = document.getElementById(`delete_modal`);
        if (deleteModalElement) {
            deleteModalElement.checked = true;
        }
    };

    const closeModal = () => {
        const deleteModalElement = document.getElementById(`delete_modal`);
        if (deleteModalElement) {
            deleteModalElement.checked = false;
        }
    };

    return (
        <div>
            {/* Trigger Button */}
            <button className='btn btn-xs btn-ghost text-red-500' onClick={openModal}>
                <RiDeleteBin7Line size={20} />
            </button>

            {/* Modal */}
            <input type='checkbox' id={`delete_modal`} className='modal-toggle' />
            <div className='modal'>
                <div className='modal-box'>
                    {/* Icon and message */}
                    <div className='flex flex-col items-center justify-center'>
                        <TrashIcon className='text-red-500 mb-4' width={40} height={40} />
                        <h3 className='font-bold text-lg text-center'>Are you sure you want to delete this item?</h3>
                        <p className='text-sm text-gray-500 text-center'>This action cannot be undone.</p>
                    </div>

                    <div className='form-control'>
                        <label className='label cursor-pointer'>
                            <span className='label-text'>Delete Schedule in respective Table</span>
                            <input
                                type='checkbox'
                                checked={deleteCheckbox}
                                onChange={handleDeleteCheckbox}
                                className='checkbox'
                            />
                        </label>
                    </div>

                    {/* Modal actions */}
                    <div className='modal-action flex justify-center'>
                        {/* Cancel Button */}
                        <label htmlFor={`delete_modal`} className='btn btn-sm btn-ghost'>
                            Cancel
                        </label>

                        {/* Confirm Delete Button */}
                        <button className='btn btn-sm btn-error text-white' onClick={handleDelete}>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteData;
