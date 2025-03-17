import React from 'react';

const SetDay = ({ selectedDays, handleDaysChange, days, isEverydaySelected }) => {
    const openModal = () => {
        const deleteModalElement = document.getElementById(`select_modal`);
        if (deleteModalElement) {
            deleteModalElement.checked = true; // DaisyUI's checkbox-based toggle
        }
    };

    const closeModal = () => {
        const deleteModalElement = document.getElementById(`select_modal`);
        if (deleteModalElement) {
            deleteModalElement.checked = false;
        }
    };

    return (
        <div>
            {/* Trigger Button */}
            <button className='btn btn-xs btn-ghost text-red-500' onClick={openModal}>
                Select Day
            </button>

            {/* Modal */}
            <input type='checkbox' id={`select_modal`} className='modal-toggle' />
            <div className='modal'>
                <div className='modal-box'>
                    <button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2' onClick={closeModal}>
                        ✕
                    </button>
                    <div className='space-y-2'>
                        {/* Everyday Checkbox */}
                        <label className='flex items-center space-x-2'>
                            <input
                                type='checkbox'
                                value={-1}
                                checked={isEverydaySelected}
                                onChange={handleDaysChange}
                                className='checkbox'
                            />
                            <span>Everyday</span>
                        </label>

                        {/* Individual Days Checkboxes */}
                        {days.map((day, index) => (
                            <label key={index} className='flex items-center space-x-2'>
                                <input
                                    type='checkbox'
                                    value={index}
                                    checked={selectedDays.includes(index)}
                                    onChange={handleDaysChange}
                                    className='checkbox'
                                />
                                <span>{day}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetDay;
