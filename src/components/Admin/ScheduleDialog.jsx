// ScheduleDialog.jsx
import React, { forwardRef, useMemo } from 'react';
import SearchableDropdownToggler from './searchableDropdownForAll';
import { convertToTime } from '../../utils/convertToTime';
import { getTimeSlotString, getTimeSlotIndex } from '@utils/timeSlotMapper';
import TimeSelector from '@utils/timeSelector';

const ScheduleDialog = forwardRef((props, ref) => {
    const {
        editingCell,
        handleTeacherSelection,
        handleStartChange,
        handleEndChange,
        setModalOpen,
        errors,
        addSchedule,
        setAddClicked,
    } = props;

    const setStartTime = (newTime) => {
        if (getTimeSlotIndex(newTime) >= 0 && newTime !== convertToTime(editingCell?.start)) {
            console.log('changing: ', newTime);
            handleStartChange(newTime);
        }
    };

    const setEndTime = (newTime) => {
        if (getTimeSlotIndex(newTime) >= 0 && newTime !== convertToTime(editingCell?.end)) {
            console.log('changing: ', newTime);

            handleEndChange(newTime);
        }
    };

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
            <div className='modal-box h-52 overflow-visible'>
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
                    type={editingCell.type}
                />
                <div className='text-[10px] sm:text-[10px] md:text-xs lg:text-xs text-slate-400 text-center overflow-hidden'>
                    {editingCell?.subject}
                </div>
                <div className='text-[10px] sm:text-[11px] md:text-[10px] lg:text-[9px] text-center overflow-hidden pt-0.5'>
                    {convertToTime(editingCell?.start)} - {convertToTime(editingCell?.end)}
                </div>
                <div className='flex flex-row'>
                    <div className='form-control w-1/2'>
                        <TimeSelector
                            key={`startTime`}
                            interval={5}
                            time={convertToTime(editingCell?.start)}
                            setTime={setStartTime}
                        />
                    </div>
                    <div className='form-control w-1/2'>
                        <TimeSelector key={`endTime`} interval={5} time={convertToTime(editingCell?.end)} setTime={setEndTime} />
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
