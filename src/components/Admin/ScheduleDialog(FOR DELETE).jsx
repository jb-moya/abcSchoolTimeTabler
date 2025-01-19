// ScheduleDialog.jsx
import React, { forwardRef, useEffect, useState } from 'react';
import SearchableDropdownToggler from './searchableDropdownForAll(FOR DELETE)';
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

    const [teacher, setTeacher] = useState({ teacher: editingCell?.teacher, teacherID: editingCell?.teacherID });
    const [start, setStart] = useState(convertToTime(editingCell?.start));
    const [end, setEnd] = useState(convertToTime(editingCell?.end));

    const setStartTime = (newTime) => {
        if (getTimeSlotIndex(newTime) >= 0 && newTime !== convertToTime(start)) {
            setStart(newTime);
        }
    };

    const setEndTime = (newTime) => {
        if (getTimeSlotIndex(newTime) >= 0 && newTime !== convertToTime(end)) {
            setEnd(newTime);
        }
    };

    const handleSubmitButton = () => {
        if (editingCell) {
            handleTeacherSelection(teacher.teacherID, teacher.teacher);
            handleStartChange(start);
            handleEndChange(end);
        } else {
            //add
            setAddClicked(false);
            addSchedule();
        }
    };

    const handleResetButton = () => {
        setTeacher({ teacher: editingCell?.teacher, teacherID: editingCell?.teacherID });
        setStart(convertToTime(editingCell?.start));
        setEnd(convertToTime(editingCell?.end));
    };

    // useEffect(() => {
    //     console.log('teacher Log: ', teacher);
    // }, [teacher]);

    // useEffect(() => {
    //     console.log('start log: ', start);
    // }, [start]);

    // useEffect(() => {
    //     console.log('end log: ', end);
    // }, [end]);

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
            <div className='modal-box h-auto overflow-visible'>
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
                <h3 className='text-lg font-bold mb-4'>{editingCell ? 'Editing Class Block' : 'Adding Class Block'}</h3>

                <hr className='mb-4' />
                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-2'>Teacher Name:</label>
                    <SearchableDropdownToggler
                        teacherIDs={props.getTeacherIdsBySubject(editingCell?.subjectID)}
                        setSelectedList={setTeacher}
                        currentTeacherID={teacher.teacherID}
                        type={editingCell?.type}
                    />
                </div>

                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-2'>Subject:</label>
                    <input
                        type='text'
                        className='input input-bordered w-full text-center cursor-default'
                        placeholder={editingCell?.subject}
                        readOnly
                    />
                </div>

                <div className='mb-4 '>
                    <label className='block text-sm font-medium mb-2'>Time Slot:</label>
                    <div className='flex flex-row'>
                        <div className='form-control w-1/2'>
                            <div className='text-[11px] pt-0.5'>start</div>

                            <TimeSelector key={`startTime`} interval={5} time={start} setTime={setStartTime} />
                        </div>
                        <div className='form-control w-1/2'>
                            <div className='text-[11px] pt-0.5'>end</div>

                            <TimeSelector key={`endTime`} interval={5} time={end} setTime={setEndTime} />
                        </div>
                    </div>
                </div>
                {/* <div className='flex flex-row'>
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
                </div> */}
                {errors.time && <span className='text-red-500'>{errors.time}</span>}
                <div className='flex flex-row justify-center space-x-2'>
                    <form method='dialog'>
                        <button
                            onClick={() => {
                                handleSubmitButton();
                            }}
                            className='btn btn-secondary'
                            disabled
                        >
                            {editingCell ? 'Save' : 'Add'}
                        </button>
                    </form>
                    <button
                        onClick={() => {
                            handleResetButton();
                        }}
                        disabled={
                            teacher.teacher === editingCell?.teacher &&
                            teacher.teacherID === editingCell?.teacherID &&
                            start === convertToTime(editingCell?.start) &&
                            end === convertToTime(editingCell?.end)
                        }
                        className='btn btn-error'
                    >
                        Reset
                    </button>
                </div>
            </div>
        </dialog>
    );
});

export default ScheduleDialog;
