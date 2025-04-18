import { useState, useEffect, useCallback } from 'react';

import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

import AddSubjectContainer from './AddSubjectContainer';
import SubjectEdit from './SubjectEdit';
import DeleteData from '../Admin/DeleteData';
import { useSelector } from 'react-redux';

const SubjectListContainer = ({ editable = false }) => {
    const { configurations } = useSelector((state) => state.configuration);
    const { subjects, loading: subjectsStoreLoading, error: subjectsStoreError } = useSelector((state) => state.subjects);
    const { programs, loading: programsStoreLoading, error: programsStoreError } = useSelector((state) => state.programs);
    const { sections, loading: sectionsStoreLoading, error: sectionsStoreError } = useSelector((state) => state.sections);

    const numOfSchoolDays = configurations[1]?.numOfSchoolDays || 5; // Default to 5 if not found in configurations
    const defaultSubjectClassDuration = configurations[1]?.defaultClassDuration || 40; // Default to 40 if not found in configurations
    const breakTimeDuration = configurations[1]?.breakTimeDuration || 30; // Default to 30 if not found in configurations
    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState('');
    const [searchSubjectResult, setSearchSubjectResult] = useState(subjects);
    const [searchSubjectValue, setSearchSubjectValue] = useState('');

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
        if (subjectsStoreLoading || programsStoreLoading || sectionsStoreLoading) return;

        debouncedSearch(searchSubjectValue, subjects);
    }, [searchSubjectValue, subjects, debouncedSearch, subjectsStoreLoading, programsStoreLoading, sectionsStoreLoading]);

    const itemsPerPage = 10; // Change this to adjust the number of items per page
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(Object.values(searchSubjectResult).length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchSubjectResult).slice(indexOfFirstItem, indexOfLastItem);

    if (subjectsStoreLoading || programsStoreLoading || sectionsStoreLoading) {
        return (
            <div className='w-full flex justify-center items-center h-[50vh]'>
                <span className='loading loading-bars loading-lg'></span>
            </div>
        );
    }

    if (subjectsStoreError || programsStoreError || sectionsStoreError) {
        return (
            <div role='alert' className='alert alert-error alert-soft'>
                <span>{subjectsStoreError || programsStoreError || sectionsStoreError}</span>
            </div>
        );
    }

    return (
        <div className='w-full'>
            <div className='flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5'>
                {currentItems.length > 0 && (
                    <div className='join flex justify-center  mb-4 md:mb-0'>
                        <button
                            className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
                            onClick={() => {
                                if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                }
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
                            }}
                            disabled={currentPage === totalPages}
                        >
                            »
                        </button>
                    </div>
                )}

                {currentItems.length === 0 && currentPage > 1 && <div className='hidden'>{setCurrentPage(currentPage - 1)}</div>}

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

                {editable && (
                    <div className='w-full mt-4 md:mt-0 md:w-auto'>
                        <button
                            className='btn btn-primary h-12 flex items-center justify-center w-full md:w-52'
                            onClick={() => document.getElementById('add_subject_modal').showModal()}
                        >
                            Add Subject <IoAdd size={20} className='ml-2' />
                        </button>

                        <dialog id='add_subject_modal' className='modal modal-bottom sm:modal-middle'>
                            <div className='modal-box'>
                                <AddSubjectContainer
                                    subjects={subjects}
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

            <div className='overflow-x-auto'>
                <table className='table table-sm table-zebra md:table-md w-full'>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Subject</th>
                            <th>Duration (min)</th>
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
                                <tr key={subject.id} className='group hover'>
                                    <th>{subject.id}</th>

                                    <td>{subject.subject}</td>

                                    <td>{subject.classDuration}</td>

                                    <td>{subject.weeklyMinutes}</td>

                                    <td>{Math.min(Math.ceil(subject.weeklyMinutes / subject.classDuration), numOfSchoolDays)}</td>

                                    {editable && (
                                        <td className='w-28'>
                                            <div className='flex'>
                                                <SubjectEdit
                                                    className='btn btn-xs btn-ghost text-blue-500'
                                                    subjects={subjects}
                                                    programs={programs}
                                                    sections={sections}
                                                    subject={subject} // Pass the entire subject object
                                                    errorMessage={errorMessage}
                                                    setErrorMessage={setErrorMessage}
                                                    errorField={errorField}
                                                    setErrorField={setErrorField}
                                                    numOfSchoolDays={numOfSchoolDays}
                                                    breakTimeDuration={breakTimeDuration}
                                                />
                                                <DeleteData
                                                    className='btn btn-xs btn-ghost text-red-500'
                                                    collection={'subjects'}
                                                    id={subject.id}
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
