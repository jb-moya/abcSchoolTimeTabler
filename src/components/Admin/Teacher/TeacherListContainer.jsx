import React, { useState, useEffect, useCallback, useRef } from 'react';

import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import AdditionalScheduleForTeacher from './AdditionalScheduleForTeacher';
import AddTeacherContainer from './TeacherAdd';
import DeleteData from '../DeleteData';
import TeacherEdit from './TeacherEdit';

const TeacherListContainer = ({ 
    teachers, 
    ranks, 
    departments, 
    subjects,
    editable = false,
    loading,
}) => {

// ===================================================================================================

const { configurations } = useSelector((state) => state.configuration);


    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState('');

// ===================================================================================================

    // Handle closing of teacher addition modal
    const handleClose = () => {
        const modal = document.getElementById('add_teacher_modal');
        if (modal) {
            modal.close();
            setErrorMessage('');
            setErrorField('');
        } else {
            console.error("Modal with ID 'add_teacher_modal' not found.");
        }
    };

// ===================================================================================================

    const [searchTeacherResult, setSearchTeacherResult] = useState(teachers);
    const [searchTeacherValue, setSearcTeacherValue] = useState('');

    const debouncedSearch = useCallback(
        debounce((searchValue, teachers, subjects) => {
            setSearchTeacherResult(
                filterObject(teachers, ([, teacher]) => {
                    if (!searchValue) return true;

                    const teachersSubjectsName = teacher.subjects.map((subjectID) => subjects[subjectID].subject).join(' ');
                    const teacherRankName = ranks[teacher.rank].rank;
                    const teacherDepartmentName = departments[teacher.department].name;

                    const escapedSearchValue = escapeRegExp(searchValue).split('\\*').join('.*');

                    const pattern = new RegExp(escapedSearchValue, 'i');

                    return pattern.test(teacher.teacher) || pattern.test(teachersSubjectsName) 
                        || pattern.test(teacherRankName) || pattern.test(teacherDepartmentName);
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        debouncedSearch(searchTeacherValue, teachers, subjects);
    }, [searchTeacherValue, teachers, debouncedSearch, subjects]);

    const itemsPerPage = 10; // Change this to adjust the number of items per page
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages
    const totalPages = Math.ceil(Object.values(searchTeacherResult).length / itemsPerPage);

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchTeacherResult).slice(indexOfFirstItem, indexOfLastItem);

// ===================================================================================================

    if (loading) {
        return (
            <div className='w-full flex justify-center items-center h-[50vh]'>
                <span className='loading loading-bars loading-lg'></span>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className='w-full'>
                <div className='flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5'>

                    {/* Pagination */}
                    {currentItems.length > 0 && (
                        <div className='join flex justify-center mb-4 md:mb-0'>
                            <button
                                className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
                                onClick={() => {
                                    if (currentPage > 1) {
                                        setCurrentPage(currentPage - 1);
                                    }
                                    // handleCancelTeacherEditClick();
                                }}
                                disabled={currentPage === 1}
                            >
                                «
                            </button>
                            <button className='join-item btn'>
                                Page {currentPage} of {totalPages}
                            </button>
                            <button
                                className={`join-item btn ${currentPage === totalPages ? 'btn-disabled' : ''}`}
                                onClick={() => {
                                    if (currentPage < totalPages) {
                                        setCurrentPage(currentPage + 1);
                                    }
                                    // handleCancelTeacherEditClick();
                                }}
                                disabled={currentPage === totalPages}
                            >
                                »
                            </button>
                        </div>
                    )}

                    {currentItems.length === 0 && currentPage > 1 && (
                        <div className='hidden'>{setCurrentPage(currentPage - 1)}</div>
                    )}

                    {/* Search Teacher */}
                    <div className='flex-grow w-full md:w-1/3 lg:w-1/4'>
                        <label className='input input-bordered flex items-center gap-2 w-full'>
                            <input
                                type='text'
                                className='grow p-3 text-sm w-full'
                                placeholder='Search Teacher'
                                value={searchTeacherValue}
                                onChange={(e) => setSearcTeacherValue(e.target.value)}
                            />
                            <IoSearch className='text-xl' />
                        </label>
                    </div>

                    {/* Add Teacher Button (only when editable) */}
                    {editable && (
                        <div className='w-full mt-4 md:mt-0 md:w-auto'>
                            <button
                                className='btn btn-primary h-12 flex items-center justify-center w-full md:w-52'
                                onClick={() => document.getElementById('add_teacher_modal').showModal()}
                            >
                                Add Teacher <IoAdd size={20} className='ml-2' />
                            </button>

                            {/* Modal for adding teacher */}
                            <dialog id='add_teacher_modal' className='modal modal-bottom sm:modal-middle'>
                                <div className='modal-box' style={{ width: '40%', maxWidth: 'none' }}>
                                    <AddTeacherContainer
                                        teachers={teachers}
                                        ranks={ranks}
                                        departments={departments}
                                        subjects={subjects}
                                        close={() => document.getElementById('add_teacher_modal').close()}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        errorField={errorField}
                                        setErrorField={setErrorField}
                                        numOfSchoolDays={configurations[1]?.defaultNumberOfSchoolDays || 5}
                                    />
                                    <div className='modal-action'>
                                        <button
                                            className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
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
                    <table className='table table-sm table-zebra w-full'>
                        <thead>
                            <tr>
                                <th className='w-8'>#</th>
                                <th className='whitespace-nowrap'>Teacher ID</th>
                                <th className='whitespace-nowrap'>Teacher</th>
                                <th className='whitespace-nowrap'>Rank</th>
                                <th className='whitespace-nowrap'>Department</th>
                                <th className='whitespace-nowrap max-w-xs'>Subject Specialization</th>
                                <th className='whitespace-nowrap max-w-xs'>Assigned Year Level(s)</th>
                                <th className='whitespace-nowrap'>Additional Schedules</th>
                                {editable && <th className='w-28 text-right'>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan='8' className='text-center'>
                                        No teachers found
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map(([, teacher], index) => (
                                    <tr key={teacher.id} className='group hover'>

                                        {/* Index */}
                                        <td>{index + indexOfFirstItem + 1}</td>

                                        {/* Teacher ID */}
                                        <th>{teacher.id}</th>
                                        {/* Teacher Name */}
                                        <td>{teacher.teacher}</td>

                                        {/* Teacher Rank */}
                                        <td>{ranks[teacher.rank]?.rank || 'Unknown Rank'}</td>

                                        {/* Teacher Department */}
                                        <td>{departments?.[String(teacher.department)]?.name || 'Unknown Department'}</td>

                                        {/* Teacher Subjects */}
                                        <td className='flex gap-1 flex-wrap'>
                                            { teacher.subjects.map((subject) => (
                                                <div key={subject} className='badge badge-secondary m-1'>
                                                    {subjects[subject]?.subject || 'Unknown Subject'}
                                                </div>
                                            ))}
                                        </td>

                                        {/* Teacher Year Levels */}
                                        <td>
                                            <div>
                                                {/* Grade 7 */}
                                                <label>
                                                    <input type='checkbox' checked={teacher.yearLevels.includes(0)} readOnly />
                                                    Grade 7
                                                </label>

                                                <br />

                                                {/* Grade 8 */}
                                                <label>
                                                    <input type='checkbox' checked={teacher.yearLevels.includes(1)} readOnly />
                                                    Grade 8
                                                </label>

                                                <br />

                                                {/* Grade 9 */}
                                                <label>
                                                    <input type='checkbox' checked={teacher.yearLevels.includes(2)} readOnly />
                                                    Grade 9
                                                </label>

                                                <br />

                                                {/* Grade 10 */}
                                                <label>
                                                    <input type='checkbox' checked={teacher.yearLevels.includes(3)} readOnly />
                                                    Grade 10
                                                </label>
                                            </div>
                                        </td>

                                        {/* Teacher Additional Schedules */}
                                        <td>
                                            <div
                                                key={`edit-add-sched-view-teacher(${teacher.id})`}
                                                className='overflow-y-auto h-36 max-h-36 bg-base-100 border border-base-content border-opacity-20 rounded-lg'
                                                style={{
                                                    scrollbarWidth: 'thin',
                                                    scrollbarColor: '#a0aec0 #edf2f7',
                                                }} // Optional for styled scrollbars 
                                            >
                                                <div
                                                    className='font-bold bg-base-100 border-base-content border-opacity-20'
                                                    style={{
                                                        position: 'sticky',
                                                        top: 0,
                                                        zIndex: 1,
                                                    }}
                                                ></div>
                                                {teacher.additionalTeacherScheds.map((sched, index) => (
                                                    <div key={index} className='flex flex-wrap'>
                                                        <div className='w-1/12 text-xs font-bold border-b border-base-content border-opacity-20 flex text-center justify-center items-center p-2'>
                                                            {index + 1}
                                                        </div>
                                                        <div className='w-11/12'>
                                                            <button
                                                                className='w-full text-xs p-2 border-b border-base-content border-opacity-20 shadow-sm'
                                                                onClick={() =>
                                                                    document
                                                                        .getElementById(
                                                                            `add_additional_sched_modal_1_teacher-${teacher.id}_idx-${index}`
                                                                        )
                                                                        .showModal()
                                                                }
                                                            >
                                                                {sched.name ? (
                                                                    // Content to show when both are not empty
                                                                    <>
                                                                        <p>Name: {sched.name}</p>
                                                                        <p>
                                                                            Subject:{' '}
                                                                            {sched.subject === -1
                                                                                ? 'N/A'
                                                                                : subjects[sched.subject]?.subject}
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    // Content to show when either is empty
                                                                    <p>Untitled Schedule {index + 1}</p>
                                                                )}
                                                            </button>
                                                            <AdditionalScheduleForTeacher
                                                                subjects={subjects}
                                                                viewingMode={1}
                                                                teacherID={teacher.id}
                                                                arrayIndex={index}
                                                                additionalSchedsOfTeacher={sched}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>

                                        {editable && (
                                            <td className='w-28'>
                                                <div className='flex'>
                                                    <TeacherEdit
                                                        teachers={teachers}
                                                        subjects={subjects}
                                                        ranks={ranks}
                                                        departments={departments}
                                                        teacher={teacher}
                                                        errorMessage={errorMessage}
                                                        setErrorMessage={setErrorMessage}
                                                        errorField={errorField}
                                                        setErrorField={setErrorField}
                                                        numOfSchoolDays={configurations[1]?.defaultNumberOfSchoolDays || 5}
                                                    />
                                                    <DeleteData 
                                                        className='btn btn-xs btn-ghost text-red-500' 
                                                        collection={'teachers'}
                                                        id={teacher.id}
                                                    />
                                                </div>
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

export default TeacherListContainer;
