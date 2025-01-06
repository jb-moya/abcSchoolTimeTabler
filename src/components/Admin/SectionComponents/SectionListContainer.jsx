import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';

import { fetchSections, addSection, editSection, removeSection } from '@features/sectionSlice';
import { fetchPrograms } from '@features/programSlice';
import { fetchSubjects } from '@features/subjectSlice';
import { fetchTeachers, editTeacher } from '@features/teacherSlice';
import { fetchBuildings, editBuilding } from '@features/buildingSlice';

import { getTimeSlotString, getTimeSlotIndex } from '@utils/timeSlotMapper';
import TimeSelector from '@utils/timeSelector';

import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

import { toast } from 'sonner';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

import ViewRooms from '../RoomsAndBuildings/ViewRooms';
import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import clsx from 'clsx';
import AdditionalScheduleForSection from './AdditionalScheduleForSection';
import AddSectionContainer from './SectionAdd';
import DeleteData from '../DeleteData';
import SectionEdit from './SectionEdit';


const SectionListContainer = ({ 
    numOfSchoolDays: externalNumOfSchoolDays, 
    editable = false,
    breakTimeDuration: externalBreakTimeDuration, 
}) => {

    const dispatch = useDispatch();

    //  =======================================================================================

    const { buildings, status: buildingStatus } = useSelector((state) => state.building);

    const { subjects, status: subjectStatus } = useSelector((state) => state.subject);

    const { sections, status: sectionStatus } = useSelector((state) => state.section);

    const { programs, status: programStatus } = useSelector((state) => state.program);

    const { teachers, status: teacherStatus } = useSelector((state) => state.teacher);

    //  =======================================================================================

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return externalNumOfSchoolDays ?? (Number(localStorage.getItem('numOfSchoolDays')) || 0);
    });

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

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState([]);

    //  =======================================================================================

    const [editSectionAdviser, setEditSectionAdviser] = useState('');
    const [editSectionProg, setEditSectionProg] = useState('');
    const [editSectionYear, setEditSectionYear] = useState('');
    const [editSectionId, setEditSectionId] = useState('');
    const [editSectionValue, setEditSectionValue] = useState('');
    const [editSectionSubjects, setEditSectionSubjects] = useState([]);
    const [editSectionShift, setEditSectionShift] = useState(0);
    const [editSectionStartTime, setEditSectionStartTime] = useState('');
    const [editSectionFixedDays, setEditSectionFixedDays] = useState({});
    const [editSectionFixedPositions, setEditSectionFixedPositions] = useState({});
    const [editAdditionalScheds, setEditAdditionalScheds] = useState([]);
    const [editRoomDetails, setEditRoomDetails] = useState({
        buildingId: -1,
        floorIdx: -1,
        roomIdx: -1,
    });

    //  =======================================================================================

    const [prevAdviser, setPrevAdviser] = useState('');

    const [currEditProgram, setCurrEditProgram] = useState('');
    const [currEditYear, setCurrEditYear] = useState('');

    //  =======================================================================================

    const [searchSectionResult, setSearchSectionResult] = useState(sections);
    const [searchSectionValue, setSearchSectionValue] = useState('');

    //  =======================================================================================

    const handleEditSectionClick = (section) => {
        setEditSectionId(section.id);
        setEditSectionValue(section.section);

        setEditSectionAdviser(section.teacher);
        setPrevAdviser(section.teacher);

        setEditSectionProg(section.program);
        setEditSectionYear(section.year);
        setEditSectionShift(section.shift);
        setEditSectionStartTime(getTimeSlotString(section.startTime));
        setEditSectionSubjects(section.subjects);
        setEditSectionFixedDays(section.fixedDays);
        setEditSectionFixedPositions(section.fixedPositions);
        setEditAdditionalScheds(section.additionalScheds);
        setEditRoomDetails({
            buildingId: section.roomDetails.buildingId,
            floorIdx: section.roomDetails.floorIdx,
            roomIdx: section.roomDetails.roomIdx,
        });

        setCurrEditProgram(section.program);
        setCurrEditYear(section.year);
    };

    const handleSaveSectionEditClick = (sectionId) => {
        if (
            !editSectionAdviser ||
            !editSectionValue ||
            !editSectionProg ||
            !editSectionYear ||
            editSectionSubjects.length === 0
        ) {
            toast.error('Please fill out all required fields.', {
                style: { backgroundColor: 'red', color: 'white' },
            });

            return;
        }

        const currentSection = sections[sectionId]?.section || '';
        const currentSectionAdviser = sections[sectionId]?.teacher || '';

        if (
            editSectionValue.trim().toLowerCase() === currentSection.trim().toLowerCase() &&
            editSectionAdviser === currentSectionAdviser
        ) {
            dispatch(
                editSection({
                    sectionId,
                    updatedSection: {
                        id: sectionId,
                        teacher: editSectionAdviser,
                        program: editSectionProg,
                        section: editSectionValue,
                        subjects: editSectionSubjects,
                        fixedDays: editSectionFixedDays,
                        fixedPositions: editSectionFixedPositions,
                        year: editSectionYear,
                        shift: editSectionShift,
                        startTime: getTimeSlotIndex(editSectionStartTime),
                        additionalScheds: editAdditionalScheds,
                        roomDetails: editRoomDetails,
                    },
                })
            );

            toast.success('Section updated successfully', {
                style: {
                    backgroundColor: 'green',
                    color: 'white',
                    bordercolor: 'green',
                },
            });

            resetStates();
        } else {
            const duplicateSection = Object.values(sections).find(
                (section) =>
                    section.section.trim().toLowerCase() === editSectionValue.trim().toLowerCase() &&
                    section.section.trim().toLowerCase() !== currentSection.trim().toLowerCase()
            );

            const duplicateAdviser = Object.values(sections).find((section) => section.teacher === editSectionAdviser);

            // console.log('duplicateAdviser: ', duplicateAdviser);

            if (duplicateSection) {
                toast.error('Section name already taken.', {
                    style: { backgroundColor: 'red', color: 'white' },
                });
                return;
            } else if (duplicateAdviser) {
                toast.error(`Adviser already assigned to section '${duplicateAdviser.section}'`, {
                    tyle: { backgroundColor: 'red', color: 'white' },
                });
            } else {
                const advisoryLoad = {
                    name: 'Advisory Load',
                    subject: 0,
                    duration: 60,
                    frequency: numOfSchoolDays,
                    shown: false,
                    time: 96,
                };

                if (prevAdviser !== editSectionAdviser) {
                    const prevSectionAdviser = structuredClone(teachers[prevAdviser]);

                    if (prevSectionAdviser.additionalTeacherScheds) {
                        prevSectionAdviser.additionalTeacherScheds = prevSectionAdviser.additionalTeacherScheds.filter(
                            (sched) => sched.name !== 'Advisory Load'
                        );
                    }

                    dispatch(
                        editTeacher({
                            id: prevAdviser,
                            updatedTeacher: prevSectionAdviser,
                        })
                    );
                }

                const teacher = structuredClone(teachers[editSectionAdviser]);
                teacher.additionalTeacherScheds = teacher.additionalTeacherScheds || [];
                teacher.additionalTeacherScheds.push(advisoryLoad);

                dispatch(
                    editTeacher({
                        teacherId: editSectionAdviser,
                        updatedTeacher: teacher,
                    })
                );

                dispatch(
                    editSection({
                        sectionId,
                        updatedSection: {
                            id: sectionId,
                            teacher: editSectionAdviser,
                            program: editSectionProg,
                            section: editSectionValue,
                            subjects: editSectionSubjects,
                            fixedDays: editSectionFixedDays,
                            fixedPositions: editSectionFixedPositions,
                            year: editSectionYear,
                            shift: editSectionShift,
                            startTime: getTimeSlotIndex(editSectionStartTime),
                            additionalScheds: editAdditionalScheds,
                            roomDetails: editRoomDetails,
                        },
                    })
                );

                resetStates();
            }
        }
    };

    const handleCancelSectionEditClick = () => {
        setEditSectionId(null);
        setEditSectionValue('');
        setEditSectionAdviser('');
        setEditSectionProg('');
        setEditSectionYear('');
        setEditSectionSubjects([]);
        setEditSectionFixedDays({});
        setEditSectionFixedPositions({});
        setEditAdditionalScheds([]);
        setEditRoomDetails({
            buildingId: -1,
            floorIdx: -1,
            roomIdx: -1,
        });

        setCurrEditProgram('');
        setCurrEditYear('');
    };

    //  =======================================================================================

    // HANDLING ADDITION AND DELETION OF ADDITIONAL SCHEDULES
    // const handleAddAdditionalSchedule = () => {
    //     setEditAdditionalScheds((prevScheds) => [
    //         ...prevScheds,
    //         {
    //             name: '',
    //             subject: 0,
    //             duration: 60,
    //             frequency: 1,
    //             shown: true,
    //             time: editSectionShift === 0 ? 192 : 96,
    //         },
    //     ]);
    // };

    // const handleDeleteAdditionalSchedule = (index) => {
    //     setEditAdditionalScheds((prevScheds) =>
    //         prevScheds.filter((_, i) => i !== index)
    //     );
    // };

    // RENDERING TIME OPTIONS
    // const renderTimeOptions = () => {
    //     const times =
    //         editSectionShift === 0
    //             ? Array.from({ length: 36 }, (_, i) => {
    //                   const hours = 6 + Math.floor(i / 6);
    //                   const minutes = (i % 6) * 10;
    //                   return `${String(hours).padStart(2, '0')}:${String(
    //                       minutes
    //                   ).padStart(2, '0')} AM`;
    //               })
    //             : ['01:00 PM']; // Only one option for PM

    //     return times.map((time) => (
    //         <option key={time} value={time}>
    //             {time}
    //         </option>
    //     ));
    // };

    //  =======================================================================================
    //  Handling ADD SECTION MODAL

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

    //  =======================================================================================
    //  Handling DELETE SECTION MODAL

    const deleteModal = (id) => {
        const deleteModalElement = document.getElementById('delete_modal');
        deleteModalElement.showModal(); // Show the modal

        const deleteButton = document.getElementById('delete_button');
        deleteButton.onclick = () => handleDelete(id); // Dynamically assign delete logic
    };

    const handleDelete = (id) => {
        // Remove ADVISORY LOAD of teacher assigned as the section's adviser
        const teacherId = sections[id].teacher;

        const prevSectionAdviser = structuredClone(teachers[teacherId]);

        if (prevSectionAdviser.additionalTeacherScheds) {
            prevSectionAdviser.additionalTeacherScheds = prevSectionAdviser.additionalTeacherScheds.filter(
                (sched) => sched.name !== 'Advisory Load'
            );
        }

        dispatch(
            editTeacher({
                id: teacherId,
                updatedTeacher: prevSectionAdviser,
            })
        );

        // Reset the room assigned to the section as AVAILABLE
        const buildingId = sections[id].roomDetails.buildingId;
        const floorIdx = sections[id].roomDetails.floorIdx;
        const roomIdx = sections[id].roomDetails.roomIdx;

        if (buildingId !== -1 && floorIdx !== -1 && roomIdx !== -1) {
            const building = structuredClone(buildings[buildingId]);

            building.rooms[floorIdx][roomIdx].isAvailable = true;

            dispatch(
                editBuilding({
                    buildingId,
                    updatedBuilding: building,
                })
            );
        }

        dispatch(removeSection(id)); // Perform the delete action
        document.getElementById('delete_modal').close(); // Close the modal after deleting
    };

    //  =======================================================================================

    const resetStates = () => {
        // Reset the editing state
        setEditSectionId('');
        setEditSectionValue('');
        setEditSectionProg('');
        setEditSectionYear('');
        setEditSectionSubjects([]);
        setEditSectionFixedDays({});
        setEditSectionFixedPositions({});
        setEditAdditionalScheds([]);

        setCurrEditProgram('');
        setCurrEditYear('');
    };

    const debouncedSearch = useCallback(
        debounce((searchValue, sections, subjects) => {
            setSearchSectionResult(
                filterObject(sections, ([, section]) => {
                    const escapedSearchValue = escapeRegExp(searchValue).split('\\*').join('.*');

                    const sectionSubjectsName = Object.keys(section.subjects)
                        .map((subjectID) => subjects[subjectID]?.subject || '')
                        .join(' ');

                    const pattern = new RegExp(escapedSearchValue, 'i');

                    // Check if program or year level matches the search value
                    const programMatches = pattern.test(section.program);
                    const yearLevelMatches = pattern.test(section.year); // Ensure `year` is the correct property name

                    return (
                        pattern.test(section.section) || programMatches || yearLevelMatches || pattern.test(sectionSubjectsName)
                    );
                })
            );
        }, 200),
        []
    );

    //  =======================================================================================

    useEffect(() => {
        if (buildingStatus === 'idle') {
            dispatch(fetchBuildings());
        }
    }, [buildingStatus, dispatch]);

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

    useEffect(() => {
        if (teacherStatus === 'idle') {
            dispatch(fetchTeachers());
        }
    }, [teacherStatus, dispatch]);

    //  =======================================================================================

    useEffect(() => {
        if (externalNumOfSchoolDays !== undefined) {
            setNumOfSchoolDays(externalNumOfSchoolDays);
        }
    }, [externalNumOfSchoolDays]);

    // Update fixed days, fixed positions, and additional schedules of sections upon program and/or year level change
    useEffect(() => {
        if (
            editSectionYear !== undefined &&
            editSectionProg !== undefined &&
            (currEditYear !== editSectionYear || currEditProgram !== editSectionProg)
        ) {
            setCurrEditProgram(editSectionProg);
            setCurrEditYear(editSectionYear);

            const program = Object.values(programs).find((p) => p.id === editSectionProg);

            if (program) {
                setEditSectionSubjects(program[editSectionYear]?.subjects || []);
                setEditSectionFixedDays(program[editSectionYear]?.fixedDays || {});
                setEditSectionFixedPositions(program[editSectionYear]?.fixedPositions || {});
                setEditAdditionalScheds(program[editSectionYear]?.additionalTeacherScheds || []);
            }
        }
    }, [editSectionYear, editSectionProg, programs]);

    //  =======================================================================================

    useEffect(() => {
        debouncedSearch(searchSectionValue, sections, subjects);
    }, [searchSectionValue, sections, debouncedSearch, subjects]);

    const itemsPerPage = 10; // Adjust this to change items per page
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages based on filtered sections
    const totalPages = Math.ceil(Object.values(searchSectionResult).length / itemsPerPage);

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchSectionResult).slice(indexOfFirstItem, indexOfLastItem);

    //  =======================================================================================

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
                                    handleCancelSectionEditClick();
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
                                    handleCancelSectionEditClick();
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

                    {/* Search Section */}
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

                            <dialog id='add_section_modal' className='modal modal-bottom sm:modal-middle'>
                                <div className='modal-box' style={{ width: '40%', maxWidth: 'none' }}>
                                    <AddSectionContainer
                                        close={handleClose}
                                        reduxField={['section', 'subjects', 'units']}
                                        reduxFunction={addSection}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        errorField={errorField}
                                        setErrorField={setErrorField}
                                        numOfSchoolDays={numOfSchoolDays}
                                        breakTimeDuration={breakTimeDuration}
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

                {/* Section Table */}
                <div className='overflow-x-auto'>
                    <table className='table table-sm table-zebra min-w-full'>
                        <thead>
                            <tr>
                                {/* <th className="w-8">#</th> */}
                                <th className='w-1/12'>Section ID</th>
                                <th className='w-3/12'>Section</th>
                                <th className='w-2/12'>Room Details</th>
                                {/* <th>Program</th> */}
                                {/* <th>Year</th> */}
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
                                        {/* <td>{index + indexOfFirstItem + 1}</td> */}

                                        {/* Section ID */}
                                        <td>{section.id}</td>

                                        {/* Section Name, Shift, and Start Time */}
                                        <td>
                                            {/* Section year and name */}
                                            <div className='text-base font-bold'>{`${section.year} -  ${section.section}`}</div>

                                            {/* Section program */}
                                            <div className='mt-1'>{`(${programs[section.program]?.program})`}</div>

                                            {/* Section shift and start time */}
                                            <div className='flex items-center mt-2'>
                                                <span className='inline-block bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-lg'>
                                                    {section.shift === 0 ? 'AM' : 'PM'}
                                                </span>
                                                <span className='ml-2 text-sm font-medium'>
                                                    {getTimeSlotString(section.startTime)} - {getTimeSlotString(section.endTime)}
                                                </span>
                                            </div>

                                            {/* Section Adviser */}
                                            <div className='flex flex-wrap mt-2'>
                                                <div className='w-1/4 p-2 font-bold flex items-center justify-center'>
                                                    Adviser:
                                                </div>
                                                <div className='w-2/3 flex items-center justify-center border border-base-content border-opacity-20 rounded-lg m-1'>
                                                    {teachers[section.teacher]?.teacher || 'Unknown Teacher'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Section room (work in progress) */}
                                        <td>
                                            <div>
                                                {/* Building */}
                                                <div className='mb-5 flex flex-col justify-start'>
                                                    <label className='h-1/2'>
                                                        <span className='label-text'>Building</span>
                                                    </label>
                                                    <div className='h-1/2 input input-bordered'>
                                                        {buildings[
                                                            editSectionId === section.id
                                                                ? editRoomDetails.buildingId
                                                                : section.roomDetails.buildingId
                                                        ]?.name || 'Unknown Building'}
                                                    </div>
                                                </div>

                                                {/* Floor */}
                                                <div className='mb-5 flex flex-col justify-start'>
                                                    <label className='h-1/2'>
                                                        <span className='label-text'>Floor</span>
                                                    </label>
                                                    <div className='h-1/2 input input-bordered'>
                                                        {(editSectionId === section.id
                                                            ? editRoomDetails.floorIdx + 1
                                                            : section.roomDetails.floorIdx + 1) || 'Unknown Floor'}
                                                    </div>
                                                </div>

                                                {/* Room */}
                                                <div className='mb-5 flex flex-col justify-start'>
                                                    <label className='h-1/2'>
                                                        <span className='label-text'>Room</span>
                                                    </label>
                                                    <div className='h-1/2 input input-bordered'>
                                                        {editSectionId === section.id
                                                            ? buildings[editRoomDetails.buildingId]?.rooms[
                                                                  editRoomDetails.floorIdx
                                                              ][editRoomDetails.roomIdx]?.roomName
                                                            : buildings[section.roomDetails.buildingId]?.rooms[
                                                                  section.roomDetails.floorIdx
                                                              ][section.roomDetails.roomIdx]?.roomName || 'Unknown Room'}
                                                    </div>
                                                </div>

                                                {/* {editSectionId === section.id && (
                                                    <div>
                                                        <div className='w-1/4 flex justify-start items-end'>
                                                            <button
                                                                className='btn btn-primary btn-sm'
                                                                onClick={() =>
                                                                    document
                                                                        .getElementById(
                                                                            `view_rooms_modal_viewMode(0)_section(${section.id})_building(0)`
                                                                        )
                                                                        .showModal()
                                                                }
                                                            >
                                                                Change Room
                                                            </button>
                                                        </div>

                                                        <ViewRooms
                                                            viewMode={0}
                                                            sectionId={section.id}
                                                            roomDetails={editRoomDetails}
                                                            setRoomDetails={setEditRoomDetails}
                                                        />
                                                    </div>
                                                )} */}
                                            </div>
                                        </td>

                                        {/* Subject Details */}
                                        <td className='flex gap-1 flex-wrap'>
                                            <div className='overflow-x-auto mt-2'>
                                                <table className='min-w-full border border-base-content border-opacity-20'>
                                                    <thead>
                                                        <tr>
                                                            <th className='py-2 px-4 border-b border-base-content border-opacity-20 font-normal text-left'>
                                                                Subject
                                                            </th>
                                                            <th className='py-2 px-4 border-b border-base-content border-opacity-20 font-normal text-left'>
                                                                Duration (min)
                                                            </th>
                                                            <th className='py-2 px-4 border-b border-base-content border-opacity-20 font-normal text-left'>
                                                                Weekly Minutes
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Array.isArray(section.subjects) && section.subjects.length > 0 ? (
                                                            section.subjects.map((subjectID, index) => (
                                                                <tr key={index} className='border-b border-base-content border-opacity-20'>
                                                                    {/* Subject Name */}
                                                                    <td className='py-2 px-4 border-b border-base-content border-opacity-20'>
                                                                        {subjects[subjectID]?.subject ||
                                                                            'Unknown Subject, ID: ' + subjectID}
                                                                    </td>

                                                                    {/* Duration */}
                                                                    <td className='py-2 px-4 border-b border-base-content border-opacity-20'>
                                                                        {subjects[subjectID]?.classDuration || ''}
                                                                    </td>

                                                                    {/* Weekly Minutes */}
                                                                    <td className='py-2 px-4 border-b border-base-content border-opacity-20'>
                                                                        {subjects[subjectID]?.weeklyMinutes || ''}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan='4'
                                                                    className='py-2 px-4 text-center border-b border-gray-200'
                                                                >
                                                                    No subjects selected
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>

                                                <div className='p-2 flex justify-center'>
                                                    <button
                                                        className='btn'
                                                        onClick={() =>
                                                            document
                                                                .getElementById(
                                                                    `assign_fixed_sched_modal_section(${section.id})-grade(${section.year})-view(1)`
                                                                )
                                                                .showModal()
                                                        }
                                                    >
                                                        View Fixed Schedules
                                                    </button>

                                                    <FixedScheduleMaker
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
                                                        numOfSchoolDays={numOfSchoolDays}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Additional Schedule */}
                                        <td>
                                            <div
                                                key={`edit-add-sched-view-section(${section.id})`}
                                                className='overflow-y-auto h-36 max-h-36 border border-base-content border-opacity-20 rounded-lg'
                                                style={{
                                                    scrollbarWidth: 'thin',
                                                    scrollbarColor: '#a0aec0 #edf2f7',
                                                }} // Optional for styled scrollbars
                                            >
                                                <div
                                                    className='font-bold p-2 border-b border-base-content border-opacity-20'
                                                    style={{
                                                        position: 'sticky',
                                                        top: 0,
                                                        zIndex: 1,
                                                    }}
                                                ></div>
                                                {section.additionalScheds.map((sched, index) => (
                                                    <div key={index} className='flex flex-wrap'>
                                                        <div className='w-1/12 text-xs font-bold bg-blue-100 flex text-center justify-center items-center p-2'>
                                                            {index + 1}
                                                        </div>
                                                        <div className='w-11/12'>
                                                            <button
                                                                className='w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-white'
                                                                onClick={() =>
                                                                    document
                                                                        .getElementById(
                                                                            `add_additional_sched_modal_1_grade-${section.year}_sec-${section.id}_idx-${index}`
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
                                                                                : subjects[sched.subject].subject}
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    // Content to show when either is empty
                                                                    <p>Untitled Schedule {index + 1}</p>
                                                                )}
                                                            </button>
                                                            <AdditionalScheduleForSection
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
                                                <div className='flex'>
                                                    <SectionEdit
                                                        section={section}
                                                        reduxField={['section', 'subjects', 'units']}
                                                        reduxFunction={editSection}
                                                        errorMessage={errorMessage}
                                                        setErrorMessage={setErrorMessage}
                                                        errorField={errorField}
                                                        setErrorField={setErrorField}
                                                        numOfSchoolDays={numOfSchoolDays}
                                                        breakTimeDuration={breakTimeDuration}
                                                    />

                                                    <DeleteData
                                                        id={section.id}
                                                        store={'section'}
                                                        reduxFunction={removeSection} 
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

export default SectionListContainer;
