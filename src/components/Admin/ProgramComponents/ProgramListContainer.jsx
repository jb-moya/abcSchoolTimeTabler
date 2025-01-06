import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPrograms, addProgram, editProgram, removeProgram } from '@features/programSlice';
import { fetchSections, editSection } from '@features/sectionSlice';
import { fetchSubjects } from '@features/subjectSlice';

import debounce from 'debounce';
import { FcInfo } from 'react-icons/fc';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import SearchableDropdownToggler from '../searchableDropdown';

import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';

import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';
import { toast } from 'sonner';

import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import DeleteData from '../DeleteData';
import AddProgramContainer from './ProgramAdd';
import AdditionalScheduleForProgram from './AdditionalScheduleForProgram';
import ProgramEdit from './ProgramEdit';

const ProgramListContainer = ({
    numOfSchoolDays: externalNumOfSchoolDays,
    editable = false,
    breakTimeDuration: externalBreakTimeDuration,
}) => {
    const dispatch = useDispatch();

    // ==============================================================================

    // ==============================================================================

    const { programs, status: programStatus } = useSelector((state) => state.program);

    const { subjects, status: subjectStatus } = useSelector((state) => state.subject);

    const { sections, status: sectionStatus } = useSelector((state) => state.section);

    // ==============================================================================

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState('');

    // ==============================================================================

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return externalNumOfSchoolDays ?? (Number(localStorage.getItem('numOfSchoolDays')) || 0);
    });

    const [breakTimeDuration, setBreakTimeDuration] = useState(() => {
        return externalBreakTimeDuration ?? (Number(localStorage.getItem('breakTimeDuration')) || 0);
    });

    const morningStartTime = localStorage.getItem('morningStartTime') || '06:00 AM';

    const afternoonStartTime = localStorage.getItem('afternoonStartTime') || '01:00 PM';

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
        console.log('breakTimeDuration', breakTimeDuration);
    }, [breakTimeDuration]);

    // ==============================================================================

    const handleClose = () => {
        const modal = document.getElementById('add_program_modal');
        if (modal) {
            modal.close();
            setErrorMessage('');
            setErrorField('');
        } else {
            console.error("Modal with ID 'add_program_modal' not found.");
        }
    };

    // ================================================================

    useEffect(() => {
        if (sectionStatus === 'idle') {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

    useEffect(() => {
        if (programStatus === 'idle') {
            dispatch(fetchPrograms());
        }
    }, [programStatus, dispatch]);

    useEffect(() => {
        if (subjectStatus === 'idle') {
            dispatch(fetchSubjects());
        }
    }, [subjectStatus, dispatch]);

    // ================================================================================

    const [searchProgramResult, setSearchProgramResult] = useState(programs);
    const [searchProgramValue, setSearchProgramValue] = useState('');

    const debouncedSearch = useCallback(
        debounce((searchValue, programs, subjects) => {
            setSearchProgramResult(
                filterObject(programs, ([, program]) => {
                    if (!searchValue) return true;

                    const programsSubjectsName = Object.values(program)
                        .filter((gradeData) => Array.isArray(gradeData.subjects)) // Ensure we're working with subjects array for each grade
                        .flatMap((gradeData) => gradeData.subjects.map((subjectID) => subjects[subjectID]?.subject || ''))
                        .join(' ');

                    const escapedSearchValue = escapeRegExp(searchValue).split('\\*').join('.*');

                    const pattern = new RegExp(escapedSearchValue, 'i');

                    return pattern.test(program.program) || pattern.test(programsSubjectsName);
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        debouncedSearch(searchProgramValue, programs, subjects);
    }, [searchProgramValue, programs, debouncedSearch, subjects]);

    const itemsPerPage = 3; // Change this to adjust the number of items per page
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages
    const totalPages = Math.ceil(Object.values(searchProgramResult).length / itemsPerPage);

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchProgramResult).slice(indexOfFirstItem, indexOfLastItem);

    // ================================================================

    return (
        <React.Fragment>
            <div className=''>
                <div className='flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5'>
                    {currentItems.length > 0 && (
                        <div className='join flex justify-center mb-4 md:mb-0'>
                            <button
                                className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
                                onClick={() => {
                                    if (currentPage > 1) {
                                        setCurrentPage(currentPage - 1);
                                    }
                                    resetStates();
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
                                    resetStates();
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
                                placeholder='Search Program'
                                value={searchProgramValue}
                                onChange={(e) => setSearchProgramValue(e.target.value)}
                            />
                            <IoSearch className='text-xl' />
                        </label>
                    </div>

                    {editable && (
                        <div className='w-full mt-4 md:mt-0 md:w-auto'>
                            <button
                                className='btn btn-primary h-12 flex items-center justify-center w-full md:w-52'
                                onClick={() => document.getElementById('add_program_modal').showModal()}
                            >
                                Add Program <IoAdd size={20} className='ml-2' />
                            </button>
                            <AddProgramContainer
                                close={handleClose}
                                reduxField={['program', 'subjects']}
                                reduxFunction={addProgram}
                                morningStartTime={morningStartTime}
                                afternoonStartTime={afternoonStartTime}
                                errorMessage={errorMessage}
                                setErrorMessage={setErrorMessage}
                                errorField={errorField}
                                setErrorField={setErrorField}
                                numOfSchoolDays={numOfSchoolDays}
                                breakTimeDuration={breakTimeDuration}
                            />
                        </div>
                    )}
                </div>

                <div className='overflow-x-auto'>
                    <div className=' max-h-[100vh] overflow-y-auto'>
                        <table className='table table-sm table-zebra w-full'>
                            <thead>
                                <tr>
                                    <th className=''>#</th>
                                    <th className=''>Program ID</th>
                                    <th className='w-2/12'>Program</th>
                                    <th className='w-5/12'>Shift, Start Time, and Subjects (per year level)</th>
                                    <th className='w-auto'>Additional Schedules</th>
                                    {editable && <th className='w-auto'>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(searchProgramResult).length === 0 ? (
                                    <tr>
                                        <td colSpan='5' className='text-center'>
                                            No Programs Found
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map(([, program], index) => (
                                        <tr key={program.id} className='group hover'>
                                            <td>{index + 1 + indexOfFirstItem}</td>

                                            {/* Program ID */}
                                            <td>{program.id}</td>

                                            {/* Program Name */}
                                            <td className='max-w-md'>{program.program}</td>

                                            {/* Shift, Start Time, and Subjects (per year level) */}
                                            <td className='w-6/12'>
                                                <div className=''>
                                                    {[7, 8, 9, 10].map((grade) => (
                                                        <div key={grade} className='my-4 flex flex-wrap'>
                                                            <div className='w-5/12'>
                                                                <h3 className='font-bold'>{`Grade ${grade}`}</h3>
                                                                <div className='flex items-center mt-2'>
                                                                    <span className='inline-block bg-blue-500 text-white text-xs font-semibold py-1 px-3 rounded-lg'>
                                                                        {program[`${grade}`]?.shift === 0 ? 'AM' : 'PM'}
                                                                    </span>
                                                                    <span className='ml-2 text-xs font-medium'>
                                                                        {getTimeSlotString(program[`${grade}`]?.startTime || 0)} -{' '}
                                                                        {getTimeSlotString(program[`${grade}`]?.endTime || 0)}
                                                                    </span>
                                                                    <div
                                                                        className='tooltip ml-2'
                                                                        data-tip='END TIME is subject to change'
                                                                    >
                                                                        <FcInfo size={20} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className='w-7/12 flex flex-wrap'>
                                                                <div className='w-full'>Assigned Subjects for Grade {grade}:</div>
                                                                <div className='w-full flex flex-wrap gap-1 p-1'>
                                                                    {program[`${grade}`]?.subjects?.map((id) => (
                                                                        <div
                                                                            key={id}
                                                                            className='p-2 bg-secondary text-white rounded-md text-xs flex items-center justify-center truncate'
                                                                        >
                                                                            {subjects[id]?.subject}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className='flex justify-center items-center'>
                                                                    <button
                                                                        className='btn text-xs'
                                                                        onClick={() =>
                                                                            document
                                                                                .getElementById(
                                                                                    `assign_fixed_sched_modal_prog(${program.id})-grade(${grade})-view(1)`
                                                                                )
                                                                                .showModal()
                                                                        }
                                                                    >
                                                                        View Fixed Schedules for Grade {grade}
                                                                    </button>
                                                                    <FixedScheduleMaker
                                                                        key={grade}
                                                                        viewingMode={1}
                                                                        pvs={0}
                                                                        program={program.id}
                                                                        grade={grade}
                                                                        selectedSubjects={program[grade]?.subjects || []}
                                                                        fixedDays={program[grade]?.fixedDays || {}}
                                                                        fixedPositions={program[grade]?.fixedPositions || {}}
                                                                        numOfSchoolDays={numOfSchoolDays}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Additional Schedules (per year level) */}
                                            <td>
                                                <div>
                                                    {[7, 8, 9, 10].map((grade) => (
                                                        <div
                                                            key={`edit-add-sched-view-prog(${program.id})-grade(${grade})`}
                                                            className='mt-2 overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg'
                                                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#a0aec0 #edf2f7' }} // Optional for styled scrollbars
                                                        >
                                                            <div
                                                                className='font-bold p-2 border-b border-gray-300'
                                                                style={{
                                                                    position: 'sticky',
                                                                    top: 0,
                                                                    zIndex: 1,
                                                                    backgroundColor: 'white',
                                                                }}
                                                            >
                                                                Grade {grade}
                                                            </div>
                                                            {program[grade]?.additionalScheds.map((sched, index) => (
                                                                <div key={index} className='flex flex-wrap'>
                                                                    <div className='w-1/12 text-xs font-bold bg-blue-100 flex text-center justify-center items-center p-2'>
                                                                        {index + 1}
                                                                    </div>
                                                                    <div className='w-11/12'>
                                                                        <button
                                                                            className='w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-gray-200'
                                                                            onClick={() =>
                                                                                document
                                                                                    .getElementById(
                                                                                        `add_additional_sched_modal_1_grade-${grade}_prog-${program.id}_idx-${index}`
                                                                                    )
                                                                                    .showModal()
                                                                            }
                                                                        >
                                                                            {sched.name || sched.subject ? (
                                                                                // Content to show when both are not empty
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
                                                                                // Content to show when either is empty
                                                                                <p>Untitled Schedule {index + 1}</p>
                                                                            )}
                                                                        </button>
                                                                        <AdditionalScheduleForProgram
                                                                            viewingMode={1}
                                                                            programID={program.id}
                                                                            grade={grade}
                                                                            arrayIndex={index}
                                                                            additionalSchedsOfProgYear={sched}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {editable && (
                                                <td>
                                                    <div className='h-full flex flex-wrap justify-center items-center'>
                                                        <ProgramEdit
                                                            className='btn btn-xs btn-ghost text-blue-500'
                                                            program={program}
                                                            reduxField={['program', 'subjects']}
                                                            reduxFunction={editProgram}
                                                            morningStartTime={morningStartTime}
                                                            afternoonStartTime={afternoonStartTime}
                                                            errorMessage={errorMessage}
                                                            setErrorMessage={setErrorMessage}
                                                            errorField={errorField}
                                                            setErrorField={setErrorField}
                                                            numOfSchoolDays={numOfSchoolDays}
                                                            breakTimeDuration={breakTimeDuration}
                                                        />
                                                        <DeleteData
                                                            className='btn btn-xs btn-ghost text-red-500'
                                                            store={'program'}
                                                            id={program.id}
                                                            reduxFunction={removeProgram}
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
            </div>
        </React.Fragment>
    );
};

export default ProgramListContainer;
