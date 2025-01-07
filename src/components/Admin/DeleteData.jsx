import React from 'react';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import {RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';

const DeleteData = ({ id, store, reduxFunction, callback }) => {
    const dispatch = useDispatch();
    const handleDelete = async () => {

        const result = await dispatch(reduxFunction(id));

        if (callback) {
            callback(result);
        }

        closeModal();
    };

    const openModal = () => {
        const deleteModalElement = document.getElementById(`delete_modal_${store}_${id}`);
        if (deleteModalElement) {
            deleteModalElement.checked = true; // DaisyUI's checkbox-based toggle
        }
    };

    const closeModal = () => {
        const deleteModalElement = document.getElementById(`delete_modal_${store}_${id}`);
        if (deleteModalElement) {
            deleteModalElement.checked = false;
        }
    };

    return (
        <div>
            {/* Trigger Button */}
            <button
                className="btn btn-xs btn-ghost text-red-500"
                onClick={openModal}
            >
                <RiDeleteBin7Line size={20} />
            </button>

            {/* Modal */}
            <input
                type="checkbox"
                id={`delete_modal_${store}_${id}`}
                className="modal-toggle"
            />
            <div className="modal">
                <div className="modal-box">
                    {/* Icon and message */}
                    <div className="flex flex-col items-center justify-center">
                         <TrashIcon
                            className="text-red-500 mb-4"
                            width={40}
                            height={40}
                        />
                        <h3 className="font-bold text-lg text-center">
                            Are you sure you want to delete this item?
                        </h3>
                        <p className="text-sm text-gray-500 text-center">
                            This action cannot be undone.
                        </p>
                    </div>

                    {/* Modal actions */}
                    <div className="modal-action flex justify-center">
                        {/* Cancel Button */}
                        <label
                            htmlFor={`delete_modal_${store}_${id}`}
                            className="btn btn-sm btn-ghost"
                        >
                            Cancel
                        </label>

                        {/* Confirm Delete Button */}
                        <button
                            className="btn btn-sm btn-error text-white"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteData;
