// ScheduleDialog.jsx
import React, { forwardRef } from 'react';
import SearchableDropdownToggler from './searchableDropdownForAll';

const ScheduleDialog = forwardRef((props, ref) => {
    const {
        editingCell,
        handleTeacherSelection,
        handleStartChange,
        handleEndChange,
        generateTimeOptions,
        convertToTime,
        setModalOpen,
        errors,
        addSchedule,
        setAddClicked,
    } = props;
    console.log('editingCell: ', editingCell);
    return (
        <dialog
            id='my_modal_2'
            className='modal'
            ref={(el) => {
                if (el) {
                    el.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape') {
                            setAddClicked(false);
                            setModalOpen(false);
                        }
                    });
                }
                if (ref) ref(el); // Forward ref if needed
            }}
        >
            <div className='modal-box h-52 overflow-hidden'>
                <form method='dialog'>
                    <button
                        className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
                        onClick={() => {
                            setAddClicked(false);
                            setModalOpen(false);
                        }}
                    >
                        ✕
                    </button>
                </form>
                <SearchableDropdownToggler
                    teacherID={props.getTeacherIdsBySubject(editingCell?.subjectID)}
                    setSelectedList={handleTeacherSelection}
                    currID={editingCell?.teacherID}
                />
                <div className='text-[10px] sm:text-[10px] md:text-xs lg:text-xs text-slate-400 text-center overflow-hidden'>
                    {editingCell?.subject}
                </div>
                <div className='text-[10px] sm:text-[11px] md:text-[10px] lg:text-[9px] text-center overflow-hidden pt-0.5'>
                    {convertToTime(editingCell?.start)} - {convertToTime(editingCell?.end)}
                </div>
                <div className='flex flex-row'>
                    <div className='form-control w-1/2'>
                        <select
                            className='select select-bordered w-full overflow-y-auto max-h-40'
                            value={`${convertToTime(editingCell?.start)}`}
                            onChange={handleStartChange}
                        >
                            {generateTimeOptions(6, 12, true).map((time) => (
                                <option key={time} value={time}>
                                    {time}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='form-control w-1/2'>
                        <select
                            className='select select-bordered w-full'
                            value={`${convertToTime(editingCell?.end)}`}
                            onChange={handleEndChange}
                        >
                            {generateTimeOptions(6, 12, true).map((time) => (
                                <option key={time} value={time}>
                                    {time}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {errors.time && <span className='text-red-500'>{errors.time}</span>}
                {!editingCell && (
                    <form method='dialog'>
                        <button
                            onClick={() => {
                                setAddClicked(false);
                                addSchedule();
                            }}
                            className='btn btn-secondary'
                        >
                            Add
                        </button>
                    </form>
                )}
            </div>
        </dialog>
    );
});

export default ScheduleDialog;
