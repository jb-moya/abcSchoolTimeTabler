// ScheduleDialog.jsx
import React, { forwardRef, useEffect, useState } from 'react';
import SearchableDropdownToggler from './searchableDropdownForAll';
import { convertToTime } from '@utils/convertToTime';
import { getTimeSlotString, getTimeSlotIndex } from '@utils/timeSlotMapper';
import TimeSelector from '@utils/timeSelector';
import DeleteData from './DeleteData';

import SetDay from './SetDay';

const ScheduleDialog = forwardRef((props, ref) => {
    const {
        editingCell,
        handleTeacherSelection,
        handleStartChange,
        handleEndChange,
        handleDeleteBlock,
        setModalOpen,
        errors,
        addSchedule,
        setAddClicked,
        containerType,
        teachers,
        subjects,
        sections,
    } = props;

    const [teacher, setTeacher] = useState({ teacher: editingCell?.teacher, teacherID: editingCell?.teacherID });
    const [section, setSection] = useState({ section: editingCell?.section, sectionID: editingCell?.sectionID });

    const [start, setStart] = useState(convertToTime(editingCell?.start));
    const [end, setEnd] = useState(convertToTime(editingCell?.end));
    const [addCheckbox, setAddCheckbox] = useState(true);
    const [subject, setSubject] = useState({ subject: editingCell?.subject, subjectID: editingCell?.subjectID });

    // const { teachers, status: teacherStatus } = useSelector((state) => state.teacher);
    // const { subjects, status: subjectStatus } = useSelector((state) => state.subject);
    // const { sections, status: sectionStatus } = useSelector((state) => state.section);
    const [reset, setReset] = useState(false);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const [selectedDays, setSelectedDays] = useState(Array.from({ length: days.length }, (_, i) => i));

    const dataFirstField = containerType === 's' ? teacher : containerType === 't' ? section : undefined;
    const dataName = containerType === 's' ? dataFirstField.teacher : containerType === 't' ? dataFirstField.section : undefined;
    const dataID =
        containerType === 's' ? dataFirstField.teacherID : containerType === 't' ? dataFirstField.sectionID : undefined;

    const editName = containerType === 's' ? editingCell?.teacher : containerType === 't' ? editingCell?.section : undefined;
    const editID = containerType === 's' ? editingCell?.teacherID : containerType === 't' ? editingCell?.sectionID : undefined;

    // useEffect(() => {
    //     if (teacherStatus === 'idle') {
    //         dispatch(fetchTeachers());
    //     }
    // }, [teacherStatus, dispatch]);

    // useEffect(() => {
    //     if (subjectStatus === 'idle') {
    //         dispatch(fetchSubjects());
    //     }
    // }, [subjectStatus, dispatch]);

    // useEffect(() => {
    //     if (sectionStatus === 'idle') {
    //         dispatch(fetchSections());
    //     }
    // }, [sectionStatus, dispatch]);

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
            if (containerType === 's') {
                handleTeacherSelection(teacher.teacherID, teacher.teacher, containerType);
            } else if (containerType === 't') {
                handleTeacherSelection(section.sectionID, section.section, containerType);
            }

            handleStartChange(start);
            handleEndChange(end);
        } else {
            //add
            setAddClicked(false);
            addSchedule(teacher, subject, start, end, addCheckbox, selectedDays);
        }
    };

    const handleCheckboxChange = (e) => {
        setAddCheckbox(e.target.checked); // Update state based on checkbox status
    };

    function getFieldIdsBySubject(subjectID) {
        if (containerType === 's') {
            return Object.values(teachers)
                .filter((teacher) => (subjectID ? teacher.subjects.includes(subjectID) : true)) // Filter only if subjectID is provided
                .map((teacher) => teacher.id);
        } else if (containerType === 't') {
            return Object.values(sections)
                .filter((section) => (subjectID ? section.subjects.includes(subjectID) : true)) // Filter only if subjectID is provided
                .map((section) => section.id);
        }
    }

    function getSubjectIdsByField(fieldID) {
        let data = null;
        if (containerType === 's') {
            data = teachers;
        } else if (containerType === 't') {
            data = sections;
        }

        if (!fieldID) {
            return Object.values(subjects).map((subject) => subject.id);
        }

        const key = Object.keys(data).find((key) => data[key].id === fieldID);
        return key ? data[key].subjects : [];
    }

    const handleResetButton = () => {
        if (containerType === 's') {
            setTeacher({ teacher: editingCell?.teacher, teacherID: editingCell?.teacherID });
        } else if (containerType === 't') {
            setSection({ section: editingCell?.section, sectionID: editingCell?.sectionID });
        }

        if (!editingCell) {
            setSubject({ subject: editingCell?.subject, subjectID: editingCell?.subjectID });
        }
        setStart(convertToTime(editingCell?.start));
        setEnd(convertToTime(editingCell?.end));
        setReset(false);
    };

    const handleDaysChange = (event) => {
        const dayIndex = parseInt(event.target.value, 10);
        const isChecked = event.target.checked;

        if (dayIndex === -1) {
            // "Everyday" selected
            setSelectedDays(isChecked ? Array.from({ length: days.length }, (_, i) => i) : []);
        } else {
            // Individual day selection
            const updatedDays = isChecked ? [...selectedDays, dayIndex] : selectedDays.filter((day) => day !== dayIndex);

            setSelectedDays(updatedDays.sort((a, b) => a - b));
        }
    };
    // console.log("dialogRender")
    const handleDeleteButton = (data, deleteCheckbox) => {
        handleDeleteBlock(data, deleteCheckbox);
        setModalOpen(false);
        document.getElementById('my_modal_2').close();
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

    const isEverydaySelected = selectedDays.length === days.length;
    const typePlaceholder = containerType === 's' ? 'Teacher' : containerType === 't' ? 'Section' : undefined;

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
                    <label className='block text-sm font-medium mb-2'>{typePlaceholder} Name:</label>
                    <SearchableDropdownToggler
                        fieldIDs={getFieldIdsBySubject(subject.subjectID)}
                        setSelectedList={containerType === 't' ? setSection : setTeacher}
                        currentFieldID={dataID}
                        type={containerType}
                        mode={'Main'}
                        setReset={setReset}
                        typePlaceholder={typePlaceholder}
                        teachers={teachers}
                        subjects={subjects}
                        sections={sections}
                    />
                </div>

                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-2'>Subject:</label>
                    {editingCell ? (
                        <input
                            type='text'
                            className='input input-bordered w-full text-center cursor-default'
                            placeholder={editingCell?.subject}
                            readOnly
                        />
                    ) : (
                        <SearchableDropdownToggler
                            fieldIDs={getSubjectIdsByField(dataID)}
                            setSelectedList={setSubject}
                            currentFieldID={subject.subjectID}
                            type={containerType}
                            mode={'Subject'}
                            setReset={setReset}
                            typePlaceholder={'Subject'}
                            teachers={teachers}
                            subjects={subjects}
                            sections={sections}
                        />
                    )}
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
                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-2'>
                        Select Days:{' '}
                        {isEverydaySelected
                            ? 'Everyday'
                            : selectedDays.length > 0
                            ? selectedDays.map((i) => days[i]).join(', ')
                            : 'None'}
                    </label>

                    <SetDay
                        handleDaysChange={handleDaysChange}
                        selectedDays={selectedDays}
                        days={days}
                        isEverydaySelected={isEverydaySelected}
                    />
                </div>
                {!editingCell && (
                    <div className='form-control'>
                        <label className='label cursor-pointer'>
                            <span className='label-text'>Add Schedule to respective Table</span>
                            <input type='checkbox' checked={addCheckbox} onChange={handleCheckboxChange} className='checkbox' />
                        </label>
                    </div>
                )}
                <div className='flex flex-row justify-center space-x-2'>
                    <form method='dialog'>
                        <button
                            onClick={() => {
                                handleSubmitButton();
                            }}
                            className='btn btn-secondary'
                        >
                            {editingCell ? 'Save' : 'Add'}
                        </button>
                    </form>
                    <button
                        onClick={() => {
                            handleResetButton();
                        }}
                        disabled={
                            editingCell
                                ? dataName === editName &&
                                  dataID === editID &&
                                  start === convertToTime(editingCell?.start) &&
                                  end === convertToTime(editingCell?.end)
                                : !reset
                        }
                        className='btn btn-error'
                    >
                        Reset
                    </button>
                    {/* <button
                        onClick={() => {
                            handleDeleteButton();
                        }}
                        disabled={
                            teacher.teacher !== editingCell?.teacher ||
                            teacher.teacherID !== editingCell?.teacherID ||
                            start !== convertToTime(editingCell?.start) ||
                            end !== convertToTime(editingCell?.end)
                        }
                        className='btn btn-error'
                    >
                        Delete
                    </button> */}
                    <DeleteData handleDeleteButton={handleDeleteButton} data={editingCell} />
                </div>
            </div>
        </dialog>
    );
});

export default ScheduleDialog;
