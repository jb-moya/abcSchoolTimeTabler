import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import { subscribeToSubjects } from '@features/slice/subject_slice';

import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

import AddSubjectContainer from './AddSubjectContainer';
import SubjectEdit from './SubjectEdit';
import DeleteData from '../Admin/DeleteData';

const SubjectListContainer = ({
    numOfSchoolDays: externalNumOfSchoolDays,
    editable = false,
    breakTimeDuration: externalBreakTimeDuration,
}) => {

    const dispatch = useDispatch();

// ==============================================================================

    // const { documents: subjects, loading, error } = fetchDocuments('subjects');
    const { data: subjects, loading, error } = useSelector((state) => state.subjects);

    useEffect(() => {
        dispatch(subscribeToSubjects());
    }, [dispatch]);

// ==============================================================================

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return externalNumOfSchoolDays ?? (Number(localStorage.getItem('numOfSchoolDays')) || 0);
    });

    const defaultSubjectClassDuration = localStorage.getItem(
        'defaultSubjectClassDuration'
    );

    const [breakTimeDuration, setBreakTimeDuration] = useState(() => {
        return (
            externalBreakTimeDuration ??
            (Number(localStorage.getItem('breakTimeDuration')) || 0)
        );
    });

    useEffect(() => {
        if (externalNumOfSchoolDays !== undefined) {
            setNumOfSchoolDays(externalNumOfSchoolDays);
        }
    }, [externalNumOfSchoolDays]);

    useEffect(() => {
        if (externalBreakTimeDuration !== undefined) {
            setBreakTimeDuration(externalBreakTimeDuration);
        }
    }, [externalBreakTimeDuration]);

    useEffect(() => {
        console.log('numOfSchoolDays:', numOfSchoolDays);
    }, [numOfSchoolDays]);

// ==============================================================================

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState('');

    const [searchSubjectResult, setSearchSubjectResult] = useState(subjects);
    const [searchSubjectValue, setSearchSubjectValue] = useState('');

// ==============================================================================

    const handleClose = () => {
        const modal = document.getElementById('add_subject_modal');
        if (modal) {
            modal.close();
            setErrorMessage('');
            setErrorField('');
        } else {
            console.error("Modal with ID 'add_subject_modal' not found.");
        }
    };

// ==============================================================================

    // useEffect(() => {
    //     if (subjectStatus === 'idle') {
    //         dispatch(fetchSubjects());
    //     }
    // }, [subjectStatus, dispatch]);

// ==============================================================================

    const debouncedSearch = useCallback(
        debounce((searchValue, subjects) => {
            setSearchSubjectResult(
                filterObject(subjects, ([, subject]) => {
                    const escapedSearchValue = escapeRegExp(searchValue).split('\\*').join('.*');

                    const pattern = new RegExp(escapedSearchValue, 'i');

                    return pattern.test(subject.subject);
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        debouncedSearch(searchSubjectValue, subjects);
    }, [searchSubjectValue, subjects, debouncedSearch]);

    const itemsPerPage = 10; // Change this to adjust the number of items per page
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages
    const totalPages = Math.ceil(Object.values(searchSubjectResult).length / itemsPerPage);

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchSubjectResult).slice(indexOfFirstItem, indexOfLastItem);

// ==============================================================================

    return (
        <div className='w-full'>
            <div className='flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5'>
                {/* Pagination */}
                {currentItems.length > 0 && (
                    <div className='join flex justify-center  mb-4 md:mb-0'>
                        <button
                            className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
                            onClick={() => {
                                if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                }
                                resetInputs();
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
                                resetInputs();
                            }}
                            disabled={currentPage === totalPages}
                        >
                            »
                        </button>
                    </div>
                )}

                {currentItems.length === 0 && currentPage > 1 && <div className='hidden'>{setCurrentPage(currentPage - 1)}</div>}

                {/* Search Subject */}
                <div className='flex-grow w-full md:w-1/3 lg:w-1/4'>
                    <label className='input input-bordered flex items-center gap-2 w-full'>
                        <input
                            type='text'
                            className='grow p-3 text-sm w-full'
                            placeholder='Search Subject'
                            value={searchSubjectValue}
                            onChange={(e) => setSearchSubjectValue(e.target.value)}
                        />
                        <IoSearch className='text-xl' />
                    </label>
                </div>

                {/* Add Subject Button (only when editable) */}
                {editable && (
                    <div className='w-full mt-4 md:mt-0 md:w-auto'>
                        <button
                            className='btn btn-primary h-12 flex items-center justify-center w-full md:w-52'
                            onClick={() => document.getElementById('add_subject_modal').showModal()}
                        >
                            Add Subject <IoAdd size={20} className='ml-2' />
                        </button>

                        {/* Modal for adding subject */}
                        <dialog id='add_subject_modal' className='modal modal-bottom sm:modal-middle'>
                            <div className='modal-box'>
                                <AddSubjectContainer
                                    close={() => document.getElementById('add_subject_modal').close()}
                                    errorMessage={errorMessage}
                                    setErrorMessage={setErrorMessage}
                                    errorField={errorField}
                                    setErrorField={setErrorField}
                                    defaultSubjectClassDuration={defaultSubjectClassDuration}
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

            {/* Table */}
            <div className='overflow-x-auto'>
                <table className='table table-sm table-zebra md:table-md w-full'>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Subject</th>
                            <th>Duration HAhah(min)</th>
                            <th>Weekly Requirement (min)</th>
                            <th># of Classes (Max: {numOfSchoolDays})</th>
                            {editable && <th className='text-left'>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan='5' className='text-center'>
                                    No subjects found
                                </td>
                            </tr>
                        ) : (
                            currentItems.map(([, subject], index) => (
                                <tr key={subject.id} className="group hover">

                                    {/* Subject ID */}
                                    {/* <th>{subject.id}</th> */}
                                    <th>{subject.custom_id}</th>

                                    {/* Subject Name */}
                                    <td>{subject.subject}</td>

                                    {/* Class Duration */}
                                    <td>{subject.classDuration}</td>

                                    {/* Subject Weekly Minutes */}
                                    <td>{subject.weeklyMinutes}</td>

                                    {/* Number of Classes */}
                                    <td>
                                        {Math.min(
                                            Math.ceil(subject.weeklyMinutes / subject.classDuration),
                                            numOfSchoolDays
                                        )}
                                    </td>

                                    {/* Edit and Delete */}
                                    {editable && (
                                        <td className='w-28'>
                                            <div className='flex'>
                                                <SubjectEdit
                                                    className="btn btn-xs btn-ghost text-blue-500"
                                                    subject={subject}  // Pass the entire subject object
                                                    errorMessage={errorMessage}
                                                    setErrorMessage={setErrorMessage}
                                                    errorField={errorField}
                                                    setErrorField={setErrorField}
                                                    numOfSchoolDays = {numOfSchoolDays}
                                                    breakTimeDuration={breakTimeDuration}
                                                />
                                                <DeleteData
                                                    className='btn btn-xs btn-ghost text-red-500'
                                                    collection={'subjects'}
                                                    id={subject.custom_id}
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
    );
};

export default SubjectListContainer;
