import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

import { getTimeSlotString, getTimeSlotIndex } from '@utils/timeSlotMapper';
import TimeSelector from '@utils/timeSelector';

import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { IoWarningSharp } from 'react-icons/io5';

import ViewRooms from '../RoomsAndBuildings/ViewRooms';
import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import AdditionalScheduleForSection from './AdditionalScheduleForSection';

import { editDocument } from '../../../hooks/firebaseCRUD/editDocument';
import { COLLECTION_ABBREVIATION } from '../../../constants';
import { useSelector } from 'react-redux';

const SectionEdit = ({
    // STORES
    sections,
    programs,
    subjects,
    teachers,
    buildings,
    // STORES
    section,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays = 5,
    breakTimeDuration,
}) => {
    const { user: currentUser } = useSelector((state) => state.user);

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
    const [editSectionClassModality, setEditSectionClassModality] = useState(new Array(numOfSchoolDays).fill(1));
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
            setEditSectionClassModality(section.modality || new Array(numOfSchoolDays).fill(1));
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

                setEditSectionClassModality(program[editSectionYear]?.modality || new Array(numOfSchoolDays).fill(1));

                setEditAdditionalScheds(program[editSectionYear]?.additionalScheds || []);
            }
        }
    }, [editSectionYear, editSectionProg, programs]);

    // ===============================================================================================

    const handleSaveSectionEditClick = async (sectionId) => {
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

        console.log('editSectionValue: ', editSectionValue);
        console.log('currentSection: ', currentSection);
        console.log('editSectionAdviser: ', editSectionAdviser);
        console.log('currentSectionAdviser: ', currentSectionAdviser);

        if (
            String(editSectionValue).trim().toLowerCase() === String(currentSection).trim().toLowerCase() &&
            editSectionAdviser === currentSectionAdviser
        ) {
            console.log('check_1!');

            try {

                const section_schedules = editAdditionalScheds.map((sched) => ({
                    n: sched.name,
                    su: sched.subject,
                    d: sched.duration,
                    f: sched.frequency,
                    sh: sched.shown,
                }));

                await editDocument({
                    collectionName: 'sections',
                    collectionAbbreviation: COLLECTION_ABBREVIATION.SECTIONS,
                    userName: currentUser?.username || 'unknown user',
                    itemName: 'a section' || 'an item',
                    docId: sectionId,
                    entryData: {
                        s: editSectionValue,
                        t: editSectionAdviser,
                        p: editSectionProg,
                        y: editSectionYear,
                        ss: editSectionSubjects,
                        fd: editSectionFixedDays,
                        fp: editSectionFixedPositions,
                        m: editSectionClassModality,
                        sh: editSectionShift,
                        st: getTimeSlotIndex(editSectionStartTime),
                        et: editSectionEndTime,
                        as: section_schedules,
                        rd: editRoomDetails,
                    },
                });
            } catch (error) {
                console.log(error);
            } finally {
                toast.success('Section updated successfully', {
                    style: {
                        backgroundColor: 'green',
                        color: 'white',
                        bordercolor: 'green',
                    },
                });

                resetStates();
                closeModal();
            }
        } else {
            const duplicateSection = Object.values(sections).find(
                (section) =>
                    String(section.section).trim().toLowerCase() === editSectionValue.trim().toLowerCase() &&
                    String(section.section).trim().toLowerCase() !== currentSection.trim().toLowerCase() &&
                    section.id !== sectionId
            );

            const duplicateAdviser = Object.values(sections).find(
                (section) => section.teacher === editSectionAdviser && section.id !== sectionId
            );

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
                try {
                    // ===================== ADVISORY LOAD =====================

                    const advisoryLoad = {
                        name: 'Advisory Load',
                        subject: -1,
                        duration: 60,
                        frequency: numOfSchoolDays,
                        shown: false,
                        time: getTimeSlotIndex(editSectionStartTime),
                    };

                    if (prevAdviser !== editSectionAdviser) {
                        console.log('prevAdviser: ', prevAdviser);

                        const prevSectionAdviser = structuredClone(teachers[prevAdviser]);
                        const prevAdviserID = teachers[prevAdviser].id;

                        if (prevSectionAdviser.additionalTeacherScheds) {
                            prevSectionAdviser.additionalTeacherScheds = prevSectionAdviser.additionalTeacherScheds.filter(
                                (sched) => sched.name !== 'Advisory Load'
                            );
                        }

                        await editDocument({
                            collectionName: 'teachers',
                            collectionAbbreviation: COLLECTION_ABBREVIATION.TEACHERS,
                            userName: currentUser?.username || 'unknown user',
                            itemName: 'a teacher' || 'an item',
                            docId: prevAdviserID,
                            entryData: {
                                at: prevSectionAdviser.additionalTeacherScheds,
                            },
                        });
                    }

                    const teacher = structuredClone(teachers[editSectionAdviser]);
                    const teacher_id = teachers[editSectionAdviser].id;
                    teacher.additionalTeacherScheds = teacher.additionalTeacherScheds || [];
                    teacher.additionalTeacherScheds.push(advisoryLoad);

                    const teacher_schedules = teacher.additionalTeacherScheds.map((sched) => ({
                        n: sched.name,
                        su: sched.subject,
                        d: sched.duration,
                        f: sched.frequency,
                        sh: sched.shown,
                        t: sched.time,
                    }));

                    await editDocument({
                        collectionName: 'teachers',
                        collectionAbbreviation: COLLECTION_ABBREVIATION.TEACHERS,
                        userName: currentUser?.username || 'unknown user',
                        itemName: 'a teacher' || 'an item',
                        docId: teacher_id,
                        entryData: {
                            as: teacher_schedules,
                        },
                    });

                    const section_schedules = editAdditionalScheds.map((sched) => ({
                        n: sched.name,
                        su: sched.subject,
                        d: sched.duration,
                        f: sched.frequency,
                        sh: sched.shown,
                    }));

                    await editDocument({
                        collectionName: 'sections',
                        collectionAbbreviation: COLLECTION_ABBREVIATION.SECTIONS,
                        userName: currentUser?.username || 'unknown user',
                        itemName: 'a section' || 'an item',
                        docId: sectionId,
                        entryData: {
                            s: editSectionValue,
                            t: editSectionAdviser,
                            p: editSectionProg,
                            y: editSectionYear,
                            ss: editSectionSubjects,
                            fd: editSectionFixedDays,
                            fp: editSectionFixedPositions,
                            m: editSectionClassModality,
                            sh: editSectionShift,
                            st: getTimeSlotIndex(editSectionStartTime),
                            et: editSectionEndTime,
                            as: section_schedules,
                            rd: editRoomDetails,
                        },
                    });
                } catch (error) {
                    console.log(error);
                } finally {
                    toast.success('Section updated successfully', {
                        style: {
                            backgroundColor: 'green',
                            color: 'white',
                            bordercolor: 'green',
                        },
                    });

                    resetStates();
                    closeModal();
                }
            }
        }
    };

    // =============================================================================================

    // End Times
    const handleEndTimeChange = () => {
        if (editSectionSubjects.length === 0) return;

        const startTimeIdx = getTimeSlotIndex(editSectionStartTime);
        const breakTimeCount = editSectionSubjects.length > 10 ? 2 : 1;

        let noOfClassBlocks = 0;
        const classDurations = [];

        editSectionSubjects.forEach((subId) => {
            const duration = subjects[subId].classDuration;
            classDurations.push(duration);
            noOfClassBlocks += Math.ceil(subjects[subId].weeklyMinutes / subjects[subId].classDuration);
        });

        let noOfRows = breakTimeCount + Math.ceil(noOfClassBlocks / numOfSchoolDays);

        const topDurations = classDurations.sort((a, b) => b - a).slice(0, noOfRows);

        let totalDuration = breakTimeCount * breakTimeDuration + topDurations.reduce((sum, duration) => sum + duration, 0);

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

    // Modality
    const handleModalityChange = (index) => {
        setEditSectionClassModality((prevState) => prevState.map((value, i) => (i === index ? (value === 1 ? 0 : 1) : value)));
    };

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
        setEditSectionClassModality(section.classModality || {});
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

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    // ===============================================================================================

    return (
        <div className=''>
            {/* Trigger Button */}
            <label htmlFor={`sectionEdit_modal_${section.id}`} className='btn btn-xs btn-ghost text-blue-500'>
                <RiEdit2Fill size={20} />
            </label>

            {/* Modal */}
            <input type='checkbox' id={`sectionEdit_modal_${section.id}`} className='modal-toggle' />
            <div className='modal'>
                <div className='modal-box relative' style={{ width: '60%', maxWidth: 'none' }}>
                    <label onClick={closeModal} className='btn btn-sm btn-circle absolute right-2 top-2'>
                        ✕
                    </label>

                    <div>
                        <div className='flex justify-center'>
                            <h3 className='text-lg font-bold mb-4'>Edit Section</h3>
                        </div>

                        <hr className='mb-4'></hr>

                        {/* Section Details */}
                        <div className='p-4 border rounded-lg shadow-md mb-4'>
                            {/* Section Name */}
                            <div className='mb-4'>
                                <label className='label'>
                                    <span className='label-text'>Section Name</span>
                                </label>
                                <input
                                    type='text'
                                    id='section-name'
                                    value={editSectionValue}
                                    onChange={(e) => setEditSectionValue(e.target.value)}
                                    className='input input-bordered text-sm w-full'
                                />
                            </div>

                            {/* Section Adviser */}
                            <div className='mt-3'>
                                <label className='label'>
                                    <span className='label-text'>Assign Adviser</span>
                                </label>
                                <select
                                    className={`select select-bordered w-full ${
                                        errorField.includes('adviser') ? 'border-red-500' : ''
                                    }`}
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

                            {/* Program */}
                            <div className='mt-3'>
                                <label className='label'>
                                    <span className='label-text'>Select Program</span>
                                </label>
                                <select
                                    value={editSectionProg}
                                    onChange={(e) => {
                                        const newProgram = parseInt(e.target.value, 10);
                                        setEditSectionProg(newProgram);
                                    }}
                                    className='select select-bordered w-full'
                                >
                                    {Object.entries(programs).map(([key, program]) => (
                                        <option key={key} value={key}>
                                            {program.program}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Level */}
                            <div className='mt-3'>
                                <label className='label'>
                                    <span className='label-text'>Select Year Level</span>
                                </label>
                                <select
                                    value={editSectionYear}
                                    onChange={(e) => {
                                        const newYear = parseInt(e.target.value, 10);
                                        setEditSectionYear(newYear);
                                    }}
                                    className='select select-bordered w-full'
                                >
                                    {[7, 8, 9, 10].map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Shift and Time */}
                        <div className='p-4 border rounded-lg shadow-md mb-4'>
                            <div className='text-lg font-semibold rounded-lg flex justify-center items-center'>
                                Schedule Details
                            </div>
                            <hr className='my-2'></hr>

                            {/* Section Shift */}
                            <div className='flex mt-5'>
                                <label className='w-1/4 font-semibold text-base text-center mr-4'>SHIFT:</label>
                                <label className='flex items-center space-x-6 text-base mr-2'>
                                    <input
                                        type='radio'
                                        className='mr-2'
                                        value={editSectionShift}
                                        checked={editSectionShift === 0}
                                        onChange={() => {
                                            setEditSectionShift(0); // PM shift
                                            setEditSectionStartTime('06:00 AM'); // Reset to default AM start time
                                        }}
                                    />
                                    AM
                                </label>
                                <label className='flex items-center space-x-6 text-base mr-2'>
                                    <input
                                        type='radio'
                                        className='mr-2'
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
                            <div className='mt-2 flex flex-wrap'>
                                <label className='w-1/4 mr-2 p-2 text-sm flex items-center justify-end font-bold'>
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
                        </div>

                        {/* Room Details */}
                        <div className='p-4 border rounded-lg shadow-md mb-4'>
                            <div className=''>
                                <div className='text-lg font-semibold rounded-lg flex items-center justify-center'>
                                    Room Details
                                </div>
                                <hr className='my-2'></hr>

                                <div className='flex flex-wrap'>
                                    {/* Building */}
                                    <div className='w-1/4 flex flex-col justify-start'>
                                        <label className='label'>
                                            <span className='label-text'>Building</span>
                                        </label>
                                        <span className='input input-bordered text-sm w-5/6'>
                                            {buildings[
                                                editSectionId === section.id
                                                    ? editRoomDetails.buildingId
                                                    : section.roomDetails.buildingId
                                            ]?.name || ''}
                                        </span>
                                    </div>

                                    {/* Floor */}
                                    <div className='w-1/4 flex flex-col justify-start'>
                                        <label className='label'>
                                            <span className='label-text'>Floor</span>
                                        </label>
                                        <span className='input input-bordered text-sm w-5/6'>
                                            {(editSectionId === section.id
                                                ? editRoomDetails.floorIdx + 1
                                                : section.roomDetails.floorIdx + 1) || ''}
                                        </span>
                                    </div>

                                    {/* Room */}
                                    <div className='w-1/4 flex flex-col justify-start'>
                                        <label className='label'>
                                            <span className='label-text'>Room</span>
                                        </label>
                                        <span className='input input-bordered text-sm w-5/6'>
                                            {editSectionId === section.id
                                                ? buildings[editRoomDetails.buildingId]?.rooms[editRoomDetails.floorIdx][
                                                      editRoomDetails.roomIdx
                                                  ]?.roomName
                                                : buildings[section.roomDetails.buildingId]?.rooms[section.roomDetails.floorIdx][
                                                      section.roomDetails.roomIdx
                                                  ]?.roomName || ''}
                                        </span>
                                    </div>

                                    {editSectionId === section.id && (
                                        <div>
                                            <div className='w-1/4 flex justify-start items-start mt-9 '>
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
                                                buildings={buildings}
                                                sections={sections}
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
                            </div>
                        </div>

                        {/* Subjects and Fixed Schedules */}
                        {section.subjects.length > 0 && (
                            <div className='p-4 border rounded-lg shadow-md mb-4 '>
                                <>
                                    <div className='text-lg  font-semibold rounded-lg  flex items-center justify-center'>
                                        Fixed Schedules
                                    </div>
                                    <hr className='my-2'></hr>
                                    <div className='mt-4 text-sm'>
                                        <table className='min-w-full bg-white font-normal border border-gray-300'>
                                            <thead>
                                                <tr>
                                                    <th className='py-2 px-4 border-b border-gray-200 font-normal text-left'>
                                                        Subject
                                                    </th>
                                                    <th className='py-2 px-4 border-b border-gray-200 font-normal text-left'>
                                                        Duration (min)
                                                    </th>
                                                    <th className='py-2 px-4 border-b border-gray-200 font-normal text-left'>
                                                        Weekly Minutes
                                                    </th>
                                                    <th className='py-2 px-4 border-b border-gray-200 font-normal text-left'>
                                                        # of Classes
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {section.subjects.map((subjectID) => (
                                                    <tr key={subjectID}>
                                                        <td className='p-2'>
                                                            {subjects[subjectID]?.subject || 'Unknown Subject, ID: ' + subjectID}
                                                        </td>
                                                        <td className='p-2'>{subjects[subjectID]?.classDuration || 'N/A'}</td>
                                                        <td className='p-2'>{subjects[subjectID]?.weeklyMinutes || 'N/A'}</td>
                                                        <td>
                                                            {Math.min(
                                                                Math.ceil(
                                                                    subjects[subjectID]?.weeklyMinutes /
                                                                        subjects[subjectID]?.classDuration
                                                                ),
                                                                numOfSchoolDays
                                                            ) || 'N/A'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className='flex items-center justify-center'>
                                        <button
                                            className='btn mt-4 '
                                            onClick={() =>
                                                document
                                                    .getElementById(
                                                        `assign_fixed_sched_modal_section(${section.id})-grade(${editSectionYear})-view(0)`
                                                    )
                                                    .showModal()
                                            }
                                        >
                                            Edit Section Fixed Schedule(s)
                                        </button>
                                    </div>
                                    <FixedScheduleMaker
                                        subjectsStore={subjects}
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
                                </>
                            </div>
                        )}

                        {/* Class Modality */}
                        <div className='rounded-lg shadow-md border space-y-2 p-4 mb-4'>
                            <div className='font-semibold text-lg text-center'>Class Modality</div>
                            <hr className='my-2'></hr>

                            <table className='table'>
                                <thead>
                                    <tr>
                                        {Array.from({ length: numOfSchoolDays }, (_, index) => (
                                            <th
                                                key={index}
                                                className='text-center border border-gray-300'
                                                style={{ width: `${100 / numOfSchoolDays}%` }} // Ensures equal width for all days
                                            >
                                                {days[index]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {Array.from({ length: numOfSchoolDays }, (_, index) => (
                                            <td
                                                key={index}
                                                className='text-center border border-gray-300'
                                                style={{ width: `${100 / numOfSchoolDays}%` }} // Ensures equal width for all days
                                            >
                                                <button
                                                    key={`day-${index}`}
                                                    className={`btn w-full h-full flex items-center justify-center ${
                                                        editSectionClassModality[index] === 1 ? 'bg-green-500' : 'bg-red-500'
                                                    }`}
                                                    onClick={() => handleModalityChange(index)}
                                                >
                                                    {editSectionClassModality[index] === 1 ? 'ONSITE' : 'OFFSITE'}
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Additional Schedules */}
                        <div className='p-4 rounded-lg shadow-md border'>
                            <div className='text-center font-semibold text-lg'>Additional Schedules</div>
                            <hr className='my-2'></hr>

                            {/* Button to add schedules */}
                            <button
                                onClick={handleAddAdditionalSchedule}
                                className='flex flex-wrap items-right text-sm mt-2 bg-primary p-4 text-white px-2 py-1 rounded-lg hover:bg-blue-600'
                            >
                                Add Schedule
                            </button>

                            {/* Render the ScheduleComponent as many times as specified */}
                            <div
                                className='mt-2 overflow-y-auto max-h-36 border border-gray-300 rounded-lg'
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#a0aec0 #edf2f7',
                                }} // Optional for styled scrollbars
                            >
                                {editAdditionalScheds.map((sched, index) => (
                                    <div key={index} className='flex flex-wrap'>
                                        <button
                                            className='w-1/12 border rounded-l-lg hover:bg-gray-200 flex items-center justify-center'
                                            onClick={() => handleDeleteAdditionalSchedule(index)}
                                        >
                                            <RiDeleteBin7Line size={15} />
                                        </button>
                                        <div className='w-10/12'>
                                            <button
                                                className='w-full bg-gray-100 p-2 border shadow-sm hover:bg-gray-200'
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
                                                            Subject:{' '}
                                                            {sched.subject === -1 ? 'N/A' : subjects[sched.subject].subject}
                                                        </p>
                                                    </>
                                                ) : (
                                                    // Content to show when either is empty
                                                    <p>Untitled Schedule {index + 1}</p>
                                                )}
                                            </button>
                                            <AdditionalScheduleForSection
                                                subjects={subjects}
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
                                        <div className='w-1/12 flex items-center justify-center border rounded-r-lg hover:bg-gray-200'>
                                            <button
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
                                                subjects={subjects}
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
                        </div>

                        {errorMessage && <p className='text-red-500 text-sm my-4 font-medium select-none '>{errorMessage}</p>}

                        {/* Add button centered at the bottom */}
                        <div className='flex mt-6 justify-center gap-2'>
                            <div className='flex justify-end space-x-2'>
                                <button
                                    className='btn btn-primary'
                                    onClick={async () => await handleSaveSectionEditClick(section.id)}
                                    disabled={!isEndTimeValid}
                                >
                                    <div>Update Section</div>
                                </button>
                            </div>
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
