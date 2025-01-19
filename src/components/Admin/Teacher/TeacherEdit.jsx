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
                        department: editTeacherDepartment,
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
        <div className=''>
            {/* Trigger Button */}
            <label htmlFor={`teacherEdit_modal_${teacher.id}`} className='btn btn-xs btn-ghost text-blue-500'>
                <RiEdit2Fill size={20} />
            </label>

            {/* Modal */}
            <input type='checkbox' id={`teacherEdit_modal_${teacher.id}`} className='modal-toggle' />
            <div className='modal'>
                <div className='modal-box ' style={{ width: '40%', maxWidth: 'none' }}>
                    <label onClick={closeModal} className='btn btn-sm btn-circle absolute right-2 top-2'>
                        ✕
                    </label>
                    <h3 className='flex justify-center text-lg font-bold mb-4'>Edit Teacher</h3>
                    <hr className='mb-4' />

                    <div className='rounded-lg shadow-md md:shadow-lg sm:shadow-sm space-y-4 mb-4 p-4'>
                        {/* Teacher Name */}
                        <div className='mb-4'>
                            <label className='text-sm font-medium mb-1 flex justify-center ' htmlFor='teacherName'>
                                Teacher Name:
                            </label>
                            <input
                                id='teacherName'
                                type='text'
                                className={`input input-bordered w-full ${errorField === 'name' ? 'border-red-500' : ''}`}
                                value={editTeacherValue}
                                onChange={(e) => setEditTeacherValue(e.target.value)}
                                placeholder='Enter teacher name'
                                aria-label='Teacher Name'
                            />
                        </div>

                        {/* Teacher Rank */}
                        <div className='mb-4'>
                            <label className=' flex justify-center  text-sm font-medium mb-1' htmlFor='teacherRank'>
                                Select Rank:
                            </label>
                            <div className='relative'>
                                <select
                                    id='teacherRank'
                                    className='select select-bordered w-full'
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
                            </div>
                        </div>

                        {/* Departments */}
                        <div className='mb-4'>
                            <label className='flex justify-center  text-sm font-medium mb-1' htmlFor='teacherDepartment'>
                                Select Department:
                            </label>
                            <div className='relative'>
                                <select
                                    id='teacherDepartment'
                                    className='select select-bordered w-full'
                                    value={editTeacherDepartment || ''}
                                    onChange={handleDepartmentChange}
                                >
                                    <option value='' disabled>
                                        Select department
                                    </option>
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
                            </div>
                        </div>

                        {/* Assigning of Subjects and Grade Levels to Teach */}
                        <div className='flex flex-wrap mb-4 '>
                            {/* Subjects Section */}
                            <div className='w-full sm:w-1/2 p-2'>
                                <div className='rounded-lg border p-4 shadow-md'>
                                    <h4 className='font-semibold '>Subjects</h4>
                                    <hr className='my-2'></hr>
                                    <SearchableDropdownToggler
                                        selectedList={editTeacherCurr}
                                        setSelectedList={setEditTeacherCurr}
                                    />
                                    <div className='mt-2'>
                                        <p className='font-medium mb-2'>Selected Subjects:</p>
                                        {editTeacherCurr.length === 0 ? (
                                            <p className='text-gray-500'>No selected subject</p>
                                        ) : (
                                            <div className='flex flex-wrap gap-2'>
                                                {editTeacherCurr.map((subjectID) => (
                                                    <span
                                                        key={subjectID}
                                                        className='bg-secondary text-white text-sm px-2 py-1 rounded-lg'
                                                    >
                                                        {subjects[subjectID].subject}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Grade Levels */}
                            <div className='w-full sm:w-1/2 p-2'>
                                <div className='rounded-lg border p-4 shadow-md'>
                                    <h4 className='font-semibold'>Grade Levels</h4>
                                    <hr className='my-2'></hr>
                                    <div className='grid grid-cols-2 gap-2 mt-2'>
                                        {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map((grade, index) => (
                                            <label key={index} className='flex items-center gap-2'>
                                                <input
                                                    type='checkbox'
                                                    checked={editTeacherYearLevels.includes(index)}
                                                    onChange={() => handleYearLevelChange(index)}
                                                />
                                                {grade}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Schedules */}
                    <div className='p-4 rounded-lg shadow-md'>
                        <div className='text-lg font-semibold rounded-lg text-center'>Additional Teacher Schedules</div>
                        <hr className='my-2'></hr>

                        {/* Button to add schedules */}
                        <button
                            onClick={handleAddTeacherAdditionalSchedules}
                            className='flex flex-wrap items-right text-sm mt-2 bg-primary text-white p-4 px-2 py-1 rounded-lg hover:bg-blue-600'
                        >
                            Add Schedule
                        </button>

                        {/* Render the ScheduleComponent as many times as specified */}
                        <div
                            className='mt-2 overflow-y-auto max-h-36 border rounded-lg'
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#a0aec0 #edf2f7',
                            }} // Optional for styled scrollbars
                        >
                            {editTeacherAdditionalScheds.map((sched, index) => (
                                <div key={index} className='flex flex-wrap border-b'>
                                    <button
                                        className='w-1/12 rounded-lg hover:bg-primary-content hover:text-error flex items-center justify-center'
                                        onClick={() => handleDeleteTeacherAdditionalSchedule(index)}
                                    >
                                        <RiDeleteBin7Line size={15} />
                                    </button>
                                    <div className='w-10/12'>
                                        <button
                                            className='w-full p-2 rounded-lg  shadow-sm hover:bg-primary-content'
                                            onClick={() =>
                                                document
                                                    .getElementById(
                                                        `add_additional_sched_modal_1_teacher-${editTeacherId}_idx-${index}`
                                                    )
                                                    .showModal()
                                            }
                                        >
                                            {sched.name ? (
                                                // Content to show when both are not empty
                                                <>
                                                    <p>Name: {sched.name}</p>
                                                    <p>
                                                        Subject: {sched.subject === -1 ? 'N/A' : subjects[sched.subject].subject}
                                                    </p>
                                                </>
                                            ) : (
                                                // Content to show when either is empty
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
                                    <button
                                        className='w-1/12 flex items-center  hover:text-primary justify-center rounded-lg hover:bg-primary-content'
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
                            ))}
                        </div>
                    </div>

                    {errorMessage && <p className='text-red-500 text-sm my-4 font-medium select-none '>{errorMessage}</p>}

                    <div className='flex justify-center gap-2 mt-4'>
                        <button className='btn btn-primary' onClick={() => handleSaveTeacherEditClick(teacher.id)}>
                            Edit Teacher
                        </button>
                        <button className='btn btn-error' onClick={() => resetStates()}>
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherEdit;
