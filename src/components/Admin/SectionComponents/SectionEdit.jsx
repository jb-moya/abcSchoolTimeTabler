import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import { toast } from 'sonner';

import { getTimeSlotString, getTimeSlotIndex } from '@utils/timeSlotMapper';

import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { IoWarningSharp } from 'react-icons/io5';

import { fetchPrograms } from '@features/programSlice';
import { fetchSubjects } from '@features/subjectSlice';
import { fetchTeachers, editTeacher } from '@features/teacherSlice';
import { fetchBuildings } from '@features/buildingSlice';
import { fetchSections } from '@features/sectionSlice';
import ViewRooms from '../RoomsAndBuildings/ViewRooms';
import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import AdditionalScheduleForSection from './AdditionalScheduleForSection';

import TimeSelector from '@utils/timeSelector';

const SectionEdit = ({
    section,
    reduxField,
    reduxFunction,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays,
    breakTimeDuration,
}) => {
    const dispatch = useDispatch();

    // ===============================================================

    const { buildings, status: buildingStatus } = useSelector((state) => state.building);

    const { subjects, status: subjectStatus } = useSelector((state) => state.subject);

    const { sections, status: sectionStatus } = useSelector((state) => state.section);

    const { programs, status: programStatus } = useSelector((state) => state.program);

    const { teachers, status: teacherStatus } = useSelector((state) => state.teacher);

    // ===============================================================================================

    const [editSectionAdviser, setEditSectionAdviser] = useState('');

    const [prevAdviser, setPrevAdviser] = useState('');

    const [editSectionProg, setEditSectionProg] = useState('');

    const [editSectionYear, setEditSectionYear] = useState('');

    const [editSectionId, setEditSectionId] = useState('');

    const [editSectionValue, setEditSectionValue] = useState('');

    const [editSectionSubjects, setEditSectionSubjects] = useState([]);

    const [editSectionShift, setEditSectionShift] = useState(0);

    const [editSectionStartTime, setEditSectionStartTime] = useState('');

    const [editSectionEndTime, setEditSectionEndTime] = useState('');

    const [editSectionFixedDays, setEditSectionFixedDays] = useState({});

    const [editSectionFixedPositions, setEditSectionFixedPositions] = useState({});

    const [editAdditionalScheds, setEditAdditionalScheds] = useState([]);

    const [editRoomDetails, setEditRoomDetails] = useState({
        buildingId: -1,
        floorIdx: -1,
        roomIdx: -1,
    });

    const [currEditProgram, setCurrEditProgram] = useState('');

    const [currEditYear, setCurrEditYear] = useState('');

    const [isEndTimeValid, setIsEndTimeValid] = useState(true);

    useEffect(() => {
        if (section) {
            setEditSectionId(section.id || '');
            setEditSectionValue(section.section || '');
            setEditSectionAdviser(section.teacher || '');
            setEditSectionProg(section.program || '');
            setEditSectionYear(section.year || '');
            setEditSectionShift(section.shift || 0);
            setEditSectionSubjects(section.subjects || []);
            setEditSectionStartTime(getTimeSlotString(section.startTime) || '');
            setEditSectionEndTime(getTimeSlotString(section.endTime) || '');
            setEditSectionFixedDays(section.fixedDays || {});
            setEditSectionFixedPositions(section.fixedPositions || {});
            setEditAdditionalScheds(section.additionalScheds || []);

            setCurrEditProgram(section.program || '');
            setCurrEditYear(section.year || '');

            setEditRoomDetails({
                buildingId: section.roomDetails.buildingId,
                floorIdx: section.roomDetails.floorIdx,
                roomIdx: section.roomDetails.roomIdx,
            });

            setPrevAdviser(section.teacher || '');
        }
    }, [section]);

    useEffect(() => {
        console.log('editSectionStartTime', editSectionStartTime);
        console.log('editSectionEndTime', editSectionEndTime);
    }, [editSectionStartTime, editSectionEndTime]);

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
                setEditSectionShift(program[editSectionYear]?.shift || 0);

                setEditSectionStartTime(getTimeSlotString(program[editSectionYear]?.startTime) || '');

                setEditSectionEndTime(getTimeSlotString(program[editSectionYear]?.endTime) || '');

                setEditSectionSubjects(program[editSectionYear]?.subjects || []);

                setEditSectionFixedDays(program[editSectionYear]?.fixedDays || {});

                setEditSectionFixedPositions(program[editSectionYear]?.fixedPositions || {});

                setEditAdditionalScheds(program[editSectionYear]?.additionalScheds || []);
            }
        }
    }, [editSectionYear, editSectionProg, programs]);

// ===============================================================================================

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
                reduxFunction({
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
                        endTime: editSectionEndTime,
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

            // resetStates();
        } else {
            const duplicateSection = Object.values(sections).find(
                (section) =>
                    section.section.trim().toLowerCase() === editSectionValue.trim().toLowerCase() &&
                    section.section.trim().toLowerCase() !== currentSection.trim().toLowerCase() &&
                    section.id !== sectionId
            );

            const duplicateAdviser = Object.values(sections).find(
                (section) => 
                    section.teacher === editSectionAdviser &&
                    section.id !== sectionId
            );

            console.log('editSectionEndTime: ', editSectionEndTime);

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
                    subject: -1,
                    duration: 60,
                    frequency: numOfSchoolDays,
                    shown: false,
                    time: 96,
                };

                if (prevAdviser !== editSectionAdviser) {
                    const prevSectionAdviser = structuredClone(teachers[prevAdviser]);

                    console.log('prevSectionAdviser: ', prevSectionAdviser);

                    if (prevSectionAdviser.additionalTeacherScheds) {
                        prevSectionAdviser.additionalTeacherScheds = prevSectionAdviser.additionalTeacherScheds.filter(
                            (sched) => sched.name !== 'Advisory Load'
                        );
                    }

                    dispatch(
                        editTeacher({
                            teacherId: prevAdviser,
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
                    reduxFunction({
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
                            endTime: editSectionEndTime,
                            additionalScheds: editAdditionalScheds,
                            roomDetails: editRoomDetails,
                        },
                    })
                );

                // resetStates();
            }
        }

        resetStates();
        closeModal();
    };

// =============================================================================================

    // End Times
        const handleEndTimeChange = () => {
            if (editSectionSubjects.length === 0) return;

            const startTimeIdx = getTimeSlotIndex(editSectionStartTime);
            const breakTimeCount = editSectionSubjects.length > 10 ? 2 : 1;

            let totalDuration = breakTimeCount * breakTimeDuration;

            editSectionSubjects.forEach((subId) => {
                totalDuration += subjects[subId].classDuration;
            });

            const endTimeIdx = Math.ceil(totalDuration / 5) + startTimeIdx;

            if (!getTimeSlotString(endTimeIdx)) {
                setIsEndTimeValid(false);
                return;
            }
            
            // console.log('getTimeSlotString(endTimeIdx): ', getTimeSlotString(endTimeIdx));

            setIsEndTimeValid(true);

            setEditSectionEndTime(endTimeIdx);
        };
    
        useEffect(() => {
            if (editSectionSubjects.length === 0) return;
    
            handleEndTimeChange();
        }, [editSectionSubjects, editSectionStartTime, breakTimeDuration]);

    // Additional Schedules
        const handleAddAdditionalSchedule = () => {
            setEditAdditionalScheds((prevScheds) => [
                ...prevScheds,
                {
                    name: '',
                    subject: -1,
                    duration: 60,
                    frequency: 1,
                    shown: true,
                },
            ]);
        };

    const handleDeleteAdditionalSchedule = (index) => {
        setEditAdditionalScheds((prevScheds) => prevScheds.filter((_, i) => i !== index));
    };

// =============================================================================================

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

// ===============================================================================================

    const resetStates = () => {
        // Reset the editing state
        setEditSectionId(section.id || '');
        setEditSectionValue(section.section || '');
        setEditSectionAdviser(section.teacher || '');
        setEditSectionProg(section.program || '');
        setEditSectionYear(section.year || '');
        setEditSectionShift(section.shift || 0);
        setEditSectionSubjects(section.subjects || []);
        setEditSectionStartTime(getTimeSlotString(section.startTime) || '');
        setEditSectionFixedDays(section.fixedDays || {});
        setEditSectionFixedPositions(section.fixedPositions || {});
        setEditAdditionalScheds(section.additionalScheds || []);

        setCurrEditProgram(section.program || '');
        setCurrEditYear(section.year || '');

        setEditRoomDetails({
            buildingId: section.roomDetails.buildingId,
            floorIdx: section.roomDetails.floorIdx,
            roomIdx: section.roomDetails.roomIdx,
        });
    };

    const closeModal = () => {
        const modalCheckbox = document.getElementById(`sectionEdit_modal_${section.id}`);
        if (modalCheckbox) {
            modalCheckbox.checked = false; // Uncheck the modal toggle
        }
        // handleReset();
    };

    // ===============================================================================================

    return (
        <div className='flex items-center justify-center'>
            {/* Trigger Button */}
            <label htmlFor={`sectionEdit_modal_${section.id}`} className='btn btn-xs btn-ghost text-blue-500'>
                <RiEdit2Fill size={20} />
            </label>

            {/* Modal */}
            <input type='checkbox' id={`sectionEdit_modal_${section.id}`} className='modal-toggle' />
            <div className='modal'>
                <div className='modal-box relative' style={{ width: '50%', maxWidth: 'none' }}>
                    <label onClick={closeModal} className='btn btn-sm btn-circle absolute right-2 top-2'>
                        ✕
                    </label>
                    <h3 className='flex justify-center text-lg font-bold mb-4'>Edit Section</h3>
                    <hr className='mb-4' />
                    <div className='p-6'>

                        {/* Section Name */}
                        <div className='flex items-center mb-2'>
                            <label htmlFor='section-name' className='mr-2'>
                                Name:
                            </label>
                            <input
                                type='text'
                                id='section-name'
                                value={editSectionValue}
                                onChange={(e) => setEditSectionValue(e.target.value)}
                                className='input input-bordered input-sm w-full'
                            />
                        </div>

                        {/* Section Program */}
                        <div className='flex items-center mb-2'>
                            <label htmlFor='section-name' className='mr-2'>
                                Program:
                            </label>
                            <select
                                value={editSectionProg}
                                onChange={(e) => {
                                    const newProgram = parseInt(e.target.value, 10);
                                    setEditSectionProg(newProgram);
                                }}
                                className='select select-bordered'
                            >
                                {Object.entries(programs).map(([key, program]) => (
                                    <option key={key} value={key}>
                                        {program.program}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section Year */}
                        <div className='flex items-center mb-2'>
                            <label htmlFor='section-name' className='mr-2'>
                                Year:
                            </label>
                            <select
                                value={editSectionYear}
                                onChange={(e) => {
                                    const newYear = parseInt(e.target.value, 10);
                                    setEditSectionYear(newYear);
                                }}
                                className='select select-bordered'
                            >
                                {[7, 8, 9, 10].map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section Shift */}
                        <div className='mt-2'>
                            <label className='mr-2'>Shift:</label>
                            <label className='mr-2'>
                                <input
                                    type='radio'
                                    value={editSectionShift}
                                    checked={editSectionShift === 0}
                                    onChange={() => {
                                        setEditSectionShift(0); // PM shift
                                        setEditSectionStartTime('06:00 AM'); // Reset to default AM start time
                                    }}
                                />
                                AM
                            </label>
                            <label>
                                <input
                                    type='radio'
                                    value={editSectionShift}
                                    checked={editSectionShift === 1}
                                    onChange={() => {
                                        setEditSectionShift(1); // PM shift
                                        setEditSectionStartTime('01:00 PM'); // Reset to default PM start time
                                    }}
                                />
                                PM
                            </label>
                        </div>

                        {/* Section Start Time (AM or PM) */}
                        <div className="mt-2 flex flex-wrap">
                            <label className="w-1/4 mr-2 p-2 text-sm flex items-center justify-end font-bold">
                                START TIME  
                            </label>
                            <div className='w-2/3 pl-2'>
                                <TimeSelector 
                                    key={`start-time-section(${editSectionId})`}
                                    interval={5}
                                    time={editSectionStartTime}
                                    setTime={setEditSectionStartTime}
                                    am={editSectionShift === 0 ? 1 : 0}
                                    pm={editSectionShift === 1 ? 1 : 0}
                                />
                            </div>
                            {!isEndTimeValid && (
                                <div
                                    className='w-auto flex ml-2 items-center tooltip text-red-500'
                                    data-tip='Total class time exceeds the day, consider adjusting the start time.'
                                >
                                    <IoWarningSharp size={35} />
                                </div>
                            )}
                        </div>

                        {/* Section Adviser */}
                        <div className='flex flex-wrap mt-2'>
                            <div className='w-1/4 p-2 font-bold flex items-center justify-center'>Adviser:</div>
                            <select
                                className='w-3/4 select select-bordered'
                                value={editSectionAdviser}
                                onChange={(e) => setEditSectionAdviser(parseInt(e.target.value, 10))}
                            >
                                <option value='' disabled>
                                    Assign an adviser
                                </option>
                                {Object.keys(teachers).map((key) => (
                                    <option key={teachers[key].id} value={teachers[key].id}>
                                        {teachers[key].teacher}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Room Details */}
                        <div>
                            {/* Building */}
                            <div className='mb-5 flex flex-col justify-start'>
                                <label className='h-1/2'>
                                    <span className='label-text'>Building</span>
                                </label>
                                <div className='h-1/2 input input-bordered'>
                                    {buildings[
                                        editSectionId === section.id ? editRoomDetails.buildingId : section.roomDetails.buildingId
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
                                        ? buildings[editRoomDetails.buildingId]?.rooms[editRoomDetails.floorIdx][
                                              editRoomDetails.roomIdx
                                          ]?.roomName
                                        : buildings[section.roomDetails.buildingId]?.rooms[section.roomDetails.floorIdx][
                                              section.roomDetails.roomIdx
                                          ]?.roomName || 'Unknown Room'}
                                </div>
                            </div>

                            {editSectionId === section.id && (
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
                                        startTime={getTimeSlotIndex(editSectionStartTime)}
                                        endTime={editSectionEndTime}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Subject Details */}
                        <div className='overflow-x-auto mt-2'>
                            <table className='min-w-full border border-base-content border-opacity-20'>
                                <thead>
                                    <tr className='border-b border-base-content border-opacity-20'>
                                        <th className='py-2 px-4 font-normal text-left'>Subject</th>
                                        <th className='py-2 px-4 font-normal text-left'>Duration (min)</th>
                                        <th className='py-2 px-4 font-normal text-left'>Weekly Minutes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(section.subjects) && section.subjects.length > 0 ? (
                                        section.subjects.map((subjectID, index) => (
                                            <tr key={index} className='border-b border-base-content border-opacity-20'>
                                                {/* Subject Name */}
                                                <td className='py-2 px-4'>
                                                    {subjects[subjectID]?.subject || 'Unknown Subject, ID: ' + subjectID}
                                                </td>

                                                {/* Duration */}
                                                <td className='py-2 px-4'>{subjects[subjectID]?.classDuration || ''}</td>

                                                {/* Weekly Minutes */}
                                                <td className='py-2 px-4'>{subjects[subjectID]?.weeklyMinutes || ''}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan='4'
                                                className='py-2 px-4 text-center border-b border-base-content border-opacity-20'
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
                                                `assign_fixed_sched_modal_section(${section.id})-grade(${editSectionYear})-view(0)`
                                            )
                                            .showModal()
                                    }
                                >
                                    View Fixed Schedules
                                </button>

                                <FixedScheduleMaker
                                    key={editSectionYear}
                                    viewingMode={0}
                                    isForSection={true}
                                    pvs={1}
                                    section={section.id}
                                    grade={editSectionYear}
                                    selectedSubjects={editSectionSubjects}
                                    fixedDays={editSectionFixedDays}
                                    additionalSchedules={editAdditionalScheds || []}
                                    // totalTimeslot={
                                    //     sectionTotalTimeslot[
                                    //         section.id
                                    //     ]
                                    // }
                                    setFixedDays={setEditSectionFixedDays}
                                    fixedPositions={editSectionFixedPositions}
                                    setFixedPositions={setEditSectionFixedPositions}
                                    numOfSchoolDays={numOfSchoolDays}
                                />
                            </div>
                        </div>

                        {/* Additional Schedules */}
                        <div
                            key={`edit-add-sched-edit-section(${editSectionId})`}
                            className='mt-2 overflow-y-auto h-36 max-h-36 border bg-base-100 border-opacity-20 rounded-lg'
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#a0aec0 #edf2f7',
                            }} // Optional for styled scrollbars
                        >
                            <div
                                className='flex flex-wrap bg-base-200 border-b border-opacity-20'
                                style={{
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                    // backgroundColor: 'white',
                                }}
                            >
                                <div className='w-9/12 font-bold p-2'>Grade {editSectionYear}</div>
                                <div className='w-3/12 flex justify-center items-center'>
                                    <button
                                        className='w-3/4 bg-green-700 m-2 font-bold  rounded-lg'
                                        onClick={handleAddAdditionalSchedule}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            {editAdditionalScheds.map(
                                (sched, index) => (
                                    <div
                                        key={`edit-add-sched-${editSectionId}-${index}`}
                                    >
                                        <div className="flex flex-wrap">
                                            <button
                                                className="w-1/12 border rounded-bl-lg hover:bg-gray-200 flex items-center justify-center"
                                                onClick={() => handleDeleteAdditionalSchedule(index)}
                                            >
                                                <RiDeleteBin7Line size={15} />
                                            </button>
                                            <button
                                                className='w-full text-xs  p-2 shadow-sm '
                                                onClick={() =>
                                                    document
                                                        .getElementById(
                                                            `add_additional_sched_modal_1_grade-${editSectionYear}_sec-${editSectionId}_idx-${index}`
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
                                            <AdditionalScheduleForSection
                                                viewingMode={1}
                                                sectionID={editSectionId}
                                                grade={editSectionYear}
                                                arrayIndex={index}
                                                additionalSchedsOfSection={sched}
                                            />
                                        </div>
                                        <div className='w-1/12 text-xs font-bold rounded-r-lg   flex text-center justify-center items-center p-2 cursor-pointer'>
                                            <button
                                                className='hover:text-primary'
                                                onClick={() =>
                                                    document
                                                        .getElementById(
                                                            `add_additional_sched_modal_0_grade-${editSectionYear}_sec-${editSectionId}_idx-${index}`
                                                        )
                                                        .showModal()
                                                }
                                            >
                                                <RiEdit2Fill size={15} />
                                            </button>
                                            <AdditionalScheduleForSection
                                                viewingMode={0}
                                                sectionID={editSectionId}
                                                grade={editSectionYear}
                                                arrayIndex={index}
                                                numOfSchoolDays={numOfSchoolDays}
                                                sectionSubjects={editSectionSubjects}
                                                additionalSchedsOfSection={sched}
                                                setAdditionalScheds={setEditAdditionalScheds}
                                            />
                                        </div>
                                    </div>
                            ))}
                        </div>

                        {/* Error Message */}
                        {errorMessage && <p className='text-red-500 text-sm my-4 font-medium'>{errorMessage}</p>}

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-2 mt-4">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSaveSectionEditClick(section.id)}
                                disabled={!isEndTimeValid}
                            >
                                Update Section
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

export default SectionEdit;
