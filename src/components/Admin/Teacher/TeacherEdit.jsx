import { useState, useEffect } from 'react';
import { RiEdit2Fill } from 'react-icons/ri';

import { useDispatch, useSelector } from 'react-redux';
import SearchableDropdownToggler from '../searchableDropdown';

import { fetchSubjects } from '@features/subjectSlice';
import { fetchRanks } from '@features/rankSlice';
import { fetchDepartments } from '@features/departmentSlice';
import { fetchTeachers } from '@features/teacherSlice';
import AdditionalScheduleForTeacher from './AdditionalScheduleForTeacher';
import { RiDeleteBin7Line } from 'react-icons/ri';

import { toast } from 'sonner';

const TeacherEdit = ({ teacher, reduxFunction, errorMessage, setErrorMessage, errorField, setErrorField, numOfSchoolDays }) => {
    const dispatch = useDispatch();

    // ==============================================================================

    const { departments, status: departmentStatus } = useSelector((state) => state.department);

    const { ranks, status: rankStatus } = useSelector((state) => state.rank);

    const { subjects, status: subjectStatus } = useSelector((state) => state.subject);

    const { teachers, status: teacherStatus } = useSelector((state) => state.teacher);

    // ==============================================================================

    const [editTeacherId, setEditTeacherId] = useState(teacher.id || null);

    const [editTeacherRank, setEditTeacherRank] = useState(teacher.rank || 0);

    const [editTeacherDepartment, setEditTeacherDepartment] = useState(teacher.department || 0);

    const [editTeacherValue, setEditTeacherValue] = useState(teacher.teacher || '');

    const [editTeacherCurr, setEditTeacherCurr] = useState(teacher.subjects || []);

    const [editTeacherYearLevels, setEditTeacherYearLevels] = useState(teacher.yearLevels || []);

    const [editTeacherAdditionalScheds, setEditTeacherAdditionalScheds] = useState(teacher.additionalTeacherScheds || []);

    // For rank change
    const [tempRank, setTempRank] = useState(teacher.rank || 0);

    // Update data when teacher changes
    useEffect(() => {
        if (teacher) {
            setEditTeacherId(teacher.id || null);
            setEditTeacherValue(teacher.teacher || '');
            setEditTeacherDepartment(teacher.department || 0);
            setEditTeacherRank(teacher.rank || 0);
            setEditTeacherValue(teacher.teacher || '');
            setEditTeacherCurr(teacher.subjects || []);
            setEditTeacherYearLevels(teacher.yearLevels || []);
            setEditTeacherAdditionalScheds(teacher.additionalTeacherScheds || []);
            setTempRank(teacher.rank || 0);
        }
    }, [teacher]);

    // Update additional teacher schedules when rank changes
    useEffect(() => {
        if (editTeacherRank !== tempRank) {
            const rank = Object.values(ranks).find((rank) => rank.id === editTeacherRank);

            if (rank) {
                setEditTeacherAdditionalScheds(rank.additionalRankScheds);
            }

            setTempRank(editTeacherRank);
        }
    }, [editTeacherRank]);

    // ==============================================================================

    useEffect(() => {
        if (departmentStatus === 'idle') {
            dispatch(fetchDepartments());
        }
    }, [departmentStatus, dispatch]);

    useEffect(() => {
        if (rankStatus === 'idle') {
            dispatch(fetchRanks());
        }
    }, [rankStatus, dispatch]);

    useEffect(() => {
        if (subjectStatus === 'idle') {
            dispatch(fetchSubjects());
        }
    }, [subjectStatus, dispatch]);

    useEffect(() => {
        if (teacherStatus === 'idle') {
            dispatch(fetchTeachers());
        }
    }, [teacherStatus, dispatch]);

    // ==============================================================================

    const handleSaveTeacherEditClick = (teacherId) => {
        console.log('editTaecersId', editTeacherId);
        console.log('editTeacherValue', editTeacherValue);

        if (
            !editTeacherValue.trim() ||
            editTeacherRank === 0 ||
            editTeacherCurr.length === 0 ||
            editTeacherYearLevels.length === 0
        ) {
            toast.error('All fields are required.', {
                style: { backgroundColor: 'red', color: 'white' },
            });
            return;
        }

        const currentTeacher = teachers[editTeacherId]?.teacher || '';

        if (editTeacherValue.trim().toLowerCase() === currentTeacher.trim().toLowerCase()) {
            dispatch(
                reduxFunction({
                    teacherId,
                    updatedTeacher: {
                        teacher: editTeacherValue,
                        rank: editTeacherRank,
                        subjects: editTeacherCurr,
                        yearLevels: editTeacherYearLevels,
                        additionalTeacherScheds: editTeacherAdditionalScheds,
                    },
                })
            );

            toast.success('Data updated successfully', {
                style: { backgroundColor: 'green', color: 'white', bordercolor: 'green' },
            });

            resetStates();
            closeModal();
        } else {
            const duplicateTeacher = Object.values(teachers).find(
                (teacher) => teacher.teacher.trim().toLowerCase() === editTeacherValue.trim().toLowerCase()
            );

            if (duplicateTeacher) {
                toast.error('Teacher already exists.', {
                    style: { backgroundColor: 'red', color: 'white' },
                });
                return;
            } else {
                dispatch(
                    reduxFunction({
                        teacherId,
                        updatedTeacher: {
                            teacher: editTeacherValue,
                            department: editTeacherDepartment,
                            rank: editTeacherRank,
                            subjects: editTeacherCurr,
                            yearLevels: editTeacherYearLevels,
                            additionalTeacherScheds: editTeacherAdditionalScheds,
                        },
                    })
                );
                resetStates();
                closeModal();
            }
        }
    };

    // ==============================================================================

    // Rank
    const handleRankChange = (event) => {
        setEditTeacherRank(parseInt(event.target.value));
    };

    // Additional Teacher Schedules
    const handleAddTeacherAdditionalSchedules = () => {
        setEditTeacherAdditionalScheds((prevScheds) => [
            ...prevScheds,
            {
                name: '',
                subject: -1,
                duration: 60,
                frequency: 1,
                shown: true,
                time: 72,
            },
        ]);
    };

    const handleDeleteTeacherAdditionalSchedule = (index) => {
        setEditTeacherAdditionalScheds((prevScheds) => prevScheds.filter((_, i) => i !== index));
    };

    // Department
    const handleDepartmentChange = (event) => {
        setEditTeacherDepartment(parseInt(event.target.value));
    };

    // Assigned Year Levels
    const handleYearLevelChange = (level) => {
        if (editTeacherYearLevels.includes(level)) {
            setEditTeacherYearLevels(editTeacherYearLevels.filter((l) => l !== level));
        } else {
            setEditTeacherYearLevels([...editTeacherYearLevels, level]);
        }
    };

    // ==============================================================================

    const resetStates = () => {
        setEditTeacherValue(teacher.teacher);
        setEditTeacherId(teacher.id);
        setEditTeacherDepartment(teacher.department);
        setEditTeacherRank(teacher.rank);
        setEditTeacherValue(teacher.teacher);
        setEditTeacherCurr(teacher.subjects);
        setEditTeacherYearLevels(teacher.yearLevels);
        setEditTeacherAdditionalScheds(teacher.additionalTeacherScheds);
        setTempRank(teacher.rank);
    };

    const closeModal = () => {
        const modalCheckbox = document.getElementById(`teacherEdit_modal_${teacher.id}`);
        if (modalCheckbox) {
            modalCheckbox.checked = false; // Uncheck the modal toggle
        }
        // handleReset();
    };

    // ==============================================================================

    return (
        <div className='flex items-center justify-center'>
            {/* Trigger Button */}
            <label htmlFor={`teacherEdit_modal_${teacher.id}`} className='btn btn-xs btn-ghost text-blue-500'>
                <RiEdit2Fill size={20} />
            </label>

            {/* Modal */}
            <input type='checkbox' id={`teacherEdit_modal_${teacher.id}`} className='modal-toggle' />
            <div className='modal'>
                <div className='modal-box relative' style={{ width: '50%', maxWidth: 'none' }}>
                    <label onClick={closeModal} className='btn btn-sm btn-circle absolute right-2 top-2'>
                        ✕
                    </label>
                    <h3 className='flex justify-center text-lg font-bold mb-4'>Edit Teacher</h3>
                    <hr className='mb-4' />
                    <div className='p-6'>
                        {/* Input Field for Teacher Name */}
                        <div className='mb-4'>
                            <label className='flex justify-center text-sm font-medium mb-2'>Teacher Name:</label>
                            <input
                                type='text'
                                className='input input-bordered input-sm w-full'
                                value={editTeacherValue}
                                onChange={(e) => setEditTeacherValue(e.target.value)}
                            />
                        </div>

                        <div className='mb-4'>
                            <label className='flex justify-center text-sm font-medium mb-2'>Teacher Rank:</label>
                            <div className='relative w-full'>
                                <select
                                    id='teacherRank'
                                    className='input input-bordered input-sm w-full appearance-none pr-10'
                                    value={editTeacherRank || ''}
                                    onChange={handleRankChange}
                                >
                                    <option value='' disabled>
                                        Select rank
                                    </option>
                                    {ranks && Object.keys(ranks).length > 0 ? (
                                        Object.values(ranks).map((rank) => (
                                            <option key={rank.id} value={rank.id}>
                                                {rank.rank}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No ranks available</option>
                                    )}
                                </select>
                                {/* Dropdown Icon */}
                                <div className='absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
                                    <svg
                                        className='w-4 h-4 text-gray-500'
                                        xmlns='http://www.w3.org/2000/svg'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className='mb-4'>
                            <label className='flex justify-center text-sm font-medium mb-2'>Teacher Department:</label>
                            <div className='relative w-full'>
                                <select
                                    id='teacherDepartment'
                                    className='input input-bordered input-sm w-full appearance-none pr-10'
                                    value={editTeacherDepartment || ''}
                                    onChange={handleDepartmentChange}
                                >
                                    {/* <option value="" disabled>
                                        Select department
                                    </option> */}
                                    {departments && Object.keys(departments).length > 0 ? (
                                        Object.values(departments).map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {`${department.name || ''}${
                                                    teachers[department.head]?.teacher
                                                        ? ` - ${teachers[department.head]?.teacher}`
                                                        : ''
                                                }`}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No departments available</option>
                                    )}
                                </select>
                                {/* Dropdown Icon */}
                                <div className='absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
                                    <svg
                                        className='w-4 h-4 text-gray-500'
                                        xmlns='http://www.w3.org/2000/svg'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className='flex gap-1 flex-wrap mb-4'>
                            <div className='m-1'>Selected Subjects:</div>
                            {editTeacherCurr && Array.isArray(editTeacherCurr) && subjects ? (
                                editTeacherCurr.map((subjectID) => (
                                    <div key={subjectID} className='badge badge-secondary m-1'>
                                        {subjects[subjectID]?.subject || subjectID}
                                    </div>
                                ))
                            ) : (
                                <div>No subjects selected</div>
                            )}
                            <SearchableDropdownToggler
                                selectedList={editTeacherCurr}
                                setSelectedList={setEditTeacherCurr}
                                isEditable={true}
                            />
                        </div>

                        <div className='w-1/2 flex justify-center'>
                            <div className='w-5/6'>
                                <div className='p-2 flex justify-center font-bold bg-base-200 border border-base-content border-opacity-20 rounded-t-lg'>
                                    Grade Levels to Teach
                                </div>
                                <div className='flex flex-col items-center justify-center border border-base-content border-opacity-20 rounded-b-lg'>
                                    <div className='w-1/3 flex justify-start'>
                                        <label>
                                            <input
                                                type='checkbox'
                                                checked={editTeacherYearLevels.includes(0)}
                                                onChange={() => handleYearLevelChange(0)}
                                            />
                                            Grade 7
                                        </label>
                                    </div>

                                    <div className='w-1/3 flex justify-start'>
                                        <label>
                                            <input
                                                type='checkbox'
                                                checked={editTeacherYearLevels.includes(1)}
                                                onChange={() => handleYearLevelChange(1)}
                                            />
                                            Grade 8
                                        </label>
                                    </div>

                                    <div className='w-1/3 flex justify-start'>
                                        <label>
                                            <input
                                                type='checkbox'
                                                checked={editTeacherYearLevels.includes(2)}
                                                onChange={() => handleYearLevelChange(2)}
                                            />
                                            Grade 9
                                        </label>
                                    </div>

                                    <div className='w-1/3 flex justify-start'>
                                        <label>
                                            <input
                                                type='checkbox'
                                                checked={editTeacherYearLevels.includes(3)}
                                                onChange={() => handleYearLevelChange(3)}
                                            />
                                            Grade 10
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            key={`edit-add-sched-edit-teacher(${editTeacherId})`}
                            className='mt-2 overflow-y-auto h-36 max-h-36 border border-base-content border-opacity-20 rounded-lg'
                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#a0aec0 #edf2f7' }}
                        >
                            <div className='flex flex-wrap sticky top-0 z-10 bg-base-200 '>
                                <div className='w-3/12 flex justify-center items-center border-gray-300'>
                                    <button
                                        className='w-3/4 bg-green-700 m-2 font-bold rounded-lg hover:bg-green-500'
                                        onClick={handleAddTeacherAdditionalSchedules}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            {editTeacherAdditionalScheds.map((sched, index) => (
                                <div key={index} className='flex flex-wrap border-b border-base-content border-opacity-20'>
                                    <button
                                        className='w-1/12  rounded-lg  flex items-center justify-center hover:text-error hover:bg-base-200'
                                        onClick={() => handleDeleteTeacherAdditionalSchedule(index)}
                                    >
                                        <RiDeleteBin7Line size={15} />
                                    </button>
                                    <div className='w-10/12'>
                                        <button
                                            className='w-full  p-2  shadow-sm '
                                            onClick={() =>
                                                document
                                                    .getElementById(
                                                        `add_additional_sched_modal_1_teacher-${editTeacherId}_idx-${index}`
                                                    )
                                                    .showModal()
                                            }
                                        >
                                            {sched.name ? (
                                                <>
                                                    <p>Name: {sched.name}</p>
                                                    <p>
                                                        Subject: {sched.subject === -1 ? 'N/A' : subjects[sched.subject].subject}
                                                    </p>
                                                </>
                                            ) : (
                                                <p>Untitled Schedule {index + 1}</p>
                                            )}
                                        </button>
                                        <AdditionalScheduleForTeacher
                                            viewingMode={1}
                                            teacherID={editTeacherId}
                                            arrayIndex={index}
                                            additionalSchedsOfTeacher={sched}
                                        />
                                    </div>
                                    <div className='w-1/12 flex items-center justify-center  rounded-lg'>
                                        <button
                                            className='w-full h-full flex items-center justify-center rounded-lg hover:text-error hover:bg-base-200'
                                            onClick={() =>
                                                document
                                                    .getElementById(
                                                        `add_additional_sched_modal_0_teacher-${editTeacherId}_idx-${index}`
                                                    )
                                                    .showModal()
                                            }
                                        >
                                            <RiEdit2Fill size={15} />
                                        </button>
                                        <AdditionalScheduleForTeacher
                                            viewingMode={0}
                                            teacherID={editTeacherId}
                                            arrayIndex={index}
                                            teacherSubjects={editTeacherCurr}
                                            numOfSchoolDays={numOfSchoolDays}
                                            additionalSchedsOfTeacher={sched}
                                            setAdditionalScheds={setEditTeacherAdditionalScheds}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Error Message */}
                        {errorMessage && <p className='text-red-500 text-sm my-4 font-medium'>{errorMessage}</p>}

                        {/* Action Buttons */}
                        <div className='flex justify-center gap-2 mt-4'>
                            <button className='btn btn-primary' onClick={() => handleSaveTeacherEditClick(teacher.id)}>
                                Update Teacher
                            </button>
                            <button className='btn btn-error' onClick={() => resetStates()}>
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherEdit;
