import React, { useState, useEffect, useCallback } from 'react';

import { getTimeSlotString } from '@utils/timeSlotMapper';

import { IoAdd, IoEye, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import AdditionalScheduleForSection from './AdditionalScheduleForSection';
import AddSectionContainer from './SectionAdd';
import DeleteData from '../DeleteData';
import SectionEdit from './SectionEdit';
import { useSelector } from 'react-redux';

const SectionListContainer = ({ editable = false }) => {
    const { subjects, loading: subjectsStoreLoading, error: subjectsStoreError } = useSelector((state) => state.subjects);
    const { programs, loading: programsStoreLoading, error: programsStoreError } = useSelector((state) => state.programs);
    const { sections, loading: sectionsStoreLoading, error: sectionsStoreError } = useSelector((state) => state.sections);
    const { buildings, loading: buildingsStoreLoading, error: buildingsStoreError } = useSelector((state) => state.buildings);
    const { teachers, loading: teachersStoreLoading, error: teachersStoreError } = useSelector((state) => state.teachers);
    const { configurations } = useSelector((state) => state.configuration);

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState([]);

    const [searchSectionResult, setSearchSectionResult] = useState(sections);
    const [searchSectionValue, setSearchSectionValue] = useState('');

    const handleClose = () => {
        const modal = document.getElementById('add_section_modal');
        if (modal) {
            modal.close();
            setErrorMessage('');
            setErrorField([]);
        } else {
            console.error("Modal with ID 'add_section_modal' not found.");
        }
    };

    const debouncedSearch = useCallback(
        debounce((searchValue, sections, subjects) => {
            setSearchSectionResult(
                filterObject(sections, ([, section]) => {
                    const escapedSearchValue = escapeRegExp(searchValue).split('\\*').join('.*');

                    const sectionSubjectsName = Object.keys(section.subjects)
                        .map((subjectID) => subjects[subjectID]?.subject || '')
                        .join(' ');
                    const programName = programs[section.program]?.program || '';
                    const teacherName = teachers[section.teacher]?.teacher || '';

                    const pattern = new RegExp(escapedSearchValue, 'i');

                    return (
                        pattern.test(section.section) ||
                        pattern.test(programName) ||
                        pattern.test(section.year) ||
                        pattern.test(sectionSubjectsName) ||
                        pattern.test(teacherName)
                    );
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        if (
            subjectsStoreLoading ||
            programsStoreLoading ||
            sectionsStoreLoading ||
            buildingsStoreLoading ||
            teachersStoreLoading
        ) {
            return;
        }
        debouncedSearch(searchSectionValue, sections, subjects);
    }, [
        searchSectionValue,
        sections,
        debouncedSearch,
        subjects,
        programs,
        subjectsStoreLoading,
        programsStoreLoading,
        sectionsStoreLoading,
        buildingsStoreLoading,
        teachersStoreLoading,
    ]);

    const itemsPerPage = 10; // Adjust this to change items per page
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(Object.values(searchSectionResult).length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchSectionResult).slice(indexOfFirstItem, indexOfLastItem);

    if (subjectsStoreLoading || programsStoreLoading || sectionsStoreLoading || buildingsStoreLoading || teachersStoreLoading) {
        return (
            <div className='w-full flex justify-center items-center h-[50vh]'>
                <span className='loading loading-bars loading-lg'></span>
            </div>
        );
    }

    if (subjectsStoreError || programsStoreError || sectionsStoreError || buildingsStoreError || teachersStoreError) {
        return (
            <div role='alert' className='alert alert-error alert-soft'>
                <span>
                    {subjectsStoreError || programsStoreError || sectionsStoreError || buildingsStoreError || teachersStoreError}
                </span>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className='w-full'>
                <div className='flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5'>
                    {currentItems.length > 0 && (
                        <div className='join flex justify-center mb-4 md:mb-0'>
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

                    {currentItems.length === 0 && currentPage > 1 && (
                        <div className='hidden'>{setCurrentPage(currentPage - 1)}</div>
                    )}

                    <div className='flex-grow w-full md:w-1/3 lg:w-1/4'>
                        <label className='input input-bordered flex items-center gap-2 w-full'>
                            <input
                                type='text'
                                className='grow p-3 text-sm w-full'
                                placeholder='Search Section'
                                value={searchSectionValue}
                                onChange={(e) => setSearchSectionValue(e.target.value)}
                            />
                            <IoSearch className='text-xl' />
                        </label>
                    </div>

                    {editable && (
                        <div className='w-full mt-4 md:mt-0 md:w-auto'>
                            <button
                                className='btn btn-primary h-12 flex items-center justify-center w-full md:w-52'
                                onClick={() => document.getElementById('add_section_modal').showModal()}
                            >
                                Add Section <IoAdd size={20} className='ml-2' />
                            </button>

                            <dialog id='add_section_modal' className='modal '>
                                <div className='modal-box' style={{ width: '48%', maxWidth: 'none' }}>
                                    <AddSectionContainer
                                        sections={sections}
                                        subjects={subjects}
                                        programs={programs}
                                        teachers={teachers}
                                        buildings={buildings}
                                        close={handleClose}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        errorField={errorField}
                                        setErrorField={setErrorField}
                                        numOfSchoolDays={configurations[1].defaultNumberOfSchoolDays}
                                        breakTimeDuration={configurations[1].defaultBreakTimeDuration}
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
                    <table className='table table-sm table-zebra min-w-full'>
                        <thead>
                            <tr>
                                <th className='w-1/12'>Section ID</th>
                                <th className='w-3/12'>Section</th>
                                <th className='w-2/12'>Room Details</th>
                                <th className='w-2/12'>Subjects</th>
                                <th className='w-3/12'>Additional Schedules</th>
                                {editable && <th className='w-1/12 text-right'>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan='7' className='text-center'>
                                        No sections found
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map(([, section], index) => (
                                    <tr key={section.id} className='group hover'>
                                        <td>{section.id}</td>

                                        <td>
                                            <div className='text-base font-bold'>{`${section.year} -  ${section.section}`}</div>

                                            <div className='mt-1'>{`(${programs[section.program]?.program})`}</div>

                                            <div className='flex items-center mt-2'>
                                                <span className='inline-block bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-lg'>
                                                    {section.shift === 0 ? 'AM' : 'PM'}
                                                </span>
                                                <span className='ml-2 text-sm font-medium'>
                                                    {getTimeSlotString(section.startTime)} - {getTimeSlotString(section.endTime)}
                                                </span>
                                            </div>

                                            <div className='flex flex-wrap mt-2'>
                                                <div className='w-1/4 p-2 mr-2 font-bold flex items-center justify-center'>
                                                    Adviser:
                                                </div>
                                                <div className='w-2/3 flex  items-center justify-start m-1'>
                                                    {teachers[section.teacher]?.teacher || 'Unknown Teacher'}
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div>
                                                <div className='mb-5 flex flex-col justify-start font-semibold'>
                                                    <div>
                                                        {buildings[section.roomDetails.buildingId]?.name || 'UNASSIGNED BUILDING'}
                                                    </div>
                                                </div>

                                                <div className='mb-5 flex flex-col justify-start text-zinc-600'>
                                                    <div>{section.roomDetails.floorIdx + 1 || 'UNASSIGNED FLOOR'}</div>
                                                </div>

                                                <div className='mb-5 flex flex-col justify-start text-zinc-600'>
                                                    <div>
                                                        {buildings[section.roomDetails.buildingId]?.rooms[
                                                            section.roomDetails.floorIdx
                                                        ][section.roomDetails.roomIdx]?.roomName || 'UNASSIGNED ROOM'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className=''>
                                            <div className='flex flex-col gap-4 mt-4 overflow-y-auto h-96 max-h-96 '>
                                                {Array.isArray(section.subjects) && section.subjects.length > 0 ? (
                                                    section.subjects.map((subjectID, index) => (
                                                        <div key={index} className='mb-4'>
                                                            <div className='font-semibold'>
                                                                {subjects[subjectID]?.subject ||
                                                                    `Unknown Subject, ID: ${subjectID}`}
                                                            </div>

                                                            <div className='text-zinc-600'>
                                                                {subjects[subjectID]?.classDuration || 'Unknown Duration'} min /{' '}
                                                                {subjects[subjectID]?.weeklyMinutes || 'Unknown Weekly Minutes'}{' '}
                                                                Weekly
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className='text-center text-gray-500'>No subjects selected</div>
                                                )}

                                                <FixedScheduleMaker
                                                    subjectsStore={subjects}
                                                    key={section.year}
                                                    viewingMode={1}
                                                    isForSection={true}
                                                    pvs={1}
                                                    section={section.id}
                                                    grade={section.year}
                                                    selectedSubjects={section.subjects || []}
                                                    fixedDays={section.fixedDays || {}}
                                                    additionalSchedules={section.additionalScheds || []}
                                                    fixedPositions={section.fixedPositions || {}}
                                                    numOfSchoolDays={configurations[1].defaultNumberOfSchoolDays}
                                                />
                                            </div>
                                        </td>

                                        <td>
                                            <div
                                                key={`edit-add-sched-view-section(${section.id})`}
                                                className='overflow-y-auto h-36 max-h-36 border border-base-content border-opacity-20 rounded-lg'
                                                style={{
                                                    scrollbarWidth: 'thin',
                                                    scrollbarColor: '#a0aec0 #edf2f7',
                                                }}
                                            >
                                                <div
                                                    className='font-bold border-base-content border-opacity-20'
                                                    style={{
                                                        position: 'sticky',
                                                        top: 0,
                                                        zIndex: 1,
                                                    }}
                                                ></div>
                                                {section.additionalScheds.map((sched, index) => (
                                                    <div
                                                        key={index}
                                                        className='flex flex-wrap border-b border-base-content border-opacity-20 hover:bg-primary-content'
                                                    >
                                                        <div className='w-1/12 text-xs  font-bold flex text-center justify-center items-center p-2'>
                                                            {index + 1}
                                                        </div>
                                                        <div className='w-11/12'>
                                                            <button
                                                                className='w-full text-xs p-2  shadow-sm'
                                                                onClick={() =>
                                                                    document
                                                                        .getElementById(
                                                                            `add_additional_sched_modal_1_grade-${section.year}_sec-${section.id}_idx-${index}`
                                                                        )
                                                                        .showModal()
                                                                }
                                                            >
                                                                {sched.name ? (
                                                                    <>
                                                                        <p>Name: {sched.name}</p>
                                                                        <p>
                                                                            Subject:{' '}
                                                                            {sched.subject === -1
                                                                                ? 'N/A'
                                                                                : subjects[sched.subject].subject}
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    <p>Untitled Schedule {index + 1}</p>
                                                                )}
                                                            </button>
                                                            <AdditionalScheduleForSection
                                                                subjects={subjects}
                                                                viewingMode={1}
                                                                sectionID={section.id}
                                                                grade={section.year}
                                                                arrayIndex={index}
                                                                additionalSchedsOfSection={sched}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>

                                        {editable && (
                                            <td className='w-28'>
                                                <div className='flex '>
                                                    <SectionEdit
                                                        subjects={subjects}
                                                        programs={programs}
                                                        teachers={teachers}
                                                        sections={sections}
                                                        buildings={buildings}
                                                        section={section}
                                                        errorMessage={errorMessage}
                                                        setErrorMessage={setErrorMessage}
                                                        errorField={errorField}
                                                        setErrorField={setErrorField}
                                                        numOfSchoolDays={configurations[1].defaultNumberOfSchoolDays}
                                                        breakTimeDuration={configurations[1].defaultBreakTimeDuration}
                                                    />

                                                    <DeleteData
                                                        className='btn btn-xs btn-ghost text-red-500'
                                                        collection={'sections'}
                                                        id={section.id}
                                                    />
                                                </div>

                                                <div className='sticky top-0 z-10 flex justify-center sm:justify-start py-2'>
                                                    <button
                                                        className='btn btn-primary flex items-center gap-2 p-2 w-full sm:w-auto'
                                                        onClick={() =>
                                                            document
                                                                .getElementById(
                                                                    `assign_fixed_sched_modal_section(${section.id})-grade(${section.year})-view(1)`
                                                                )
                                                                .showModal()
                                                        }
                                                    >
                                                        <IoEye className='w-5 h-5' />
                                                        <span className='hidden sm:inline'>View</span>{' '}
                                                    </button>
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

export default SectionListContainer;
