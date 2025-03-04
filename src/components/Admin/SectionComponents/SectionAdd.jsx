import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { IoWarningSharp } from 'react-icons/io5';

import { fetchPrograms } from '@features/programSlice';
import { fetchSubjects } from '@features/subjectSlice';
import { fetchTeachers, editTeacher } from '@features/teacherSlice';
import { fetchBuildings } from '@features/buildingSlice';

import { toast } from 'sonner';
import ViewRooms from '../RoomsAndBuildings/ViewRooms';
import FixedScheduleMaker from '../FixedSchedules/fixedScheduleMaker';
import AdditionalScheduleForSection from './AdditionalScheduleForSection';
import TimeSelector from '@utils/timeSelector';

import { getTimeSlotString, getTimeSlotIndex } from '@utils/timeSlotMapper';

const AddSectionContainer = ({
    close,
    reduxField,
    reduxFunction,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays,
    breakTimeDuration,
}) => {
    const inputNameRef = useRef();
    const dispatch = useDispatch();

    // ===================================================================================================

    const { buildings, status: buildingStatus } = useSelector((state) => state.building);

    const { programs, status: programStatus } = useSelector((state) => state.program);

    const { subjects, status: subjectStatus } = useSelector((state) => state.subject);

    const { teachers, status: teacherStatus } = useSelector((state) => state.teacher);

    const { sections, status: sectionStatus } = useSelector((state) => state.section);

    // ===================================================================================================

    const [inputValue, setInputValue] = useState('');
    const [selectedAdviser, setSelectedAdviser] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedYearLevel, setSelectedYearLevel] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedShift, setSelectedShift] = useState('');
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    const [fixedDays, setFixedDays] = useState({});
    const [fixedPositions, setFixedPositions] = useState({});
    const [additionalScheds, setAdditionalScheds] = useState([]);
    const [roomDetails, setRoomDetails] = useState({
        buildingId: -1,
        floorIdx: -1,
        roomIdx: -1,
    });

    const [isEndTimeValid, setIsEndTimeValid] = useState(true);

    const isRoomSelectionDisabled = selectedShift === -1 && selectedStartTime === -1;

    useEffect(() => {
        if (selectedProgram && selectedYearLevel) {
            const program = Object.values(programs).find((p) => p.id === selectedProgram);

            if (program) {
                setSelectedSubjects(program[selectedYearLevel].subjects || []);
                setFixedDays(program[selectedYearLevel].fixedDays || {});
                setFixedPositions(program[selectedYearLevel].fixedPositions || {});
                setAdditionalScheds(program[selectedYearLevel].additionalScheds || []);
                setSelectedShift(program[selectedYearLevel].shift || 0);
                setSelectedStartTime(getTimeSlotString(program[selectedYearLevel].startTime) || '06:00 AM');
                setSelectedEndTime(getTimeSlotString(program[selectedYearLevel].endTime) || '06:00 PM');
            }
        }
    }, [selectedProgram, selectedYearLevel, programs]);

    useEffect(() => {
        console.log('selectedShift: ', selectedShift);
        console.log('selectedStartTime: ', selectedStartTime);
    }, [selectedShift, selectedStartTime]);

    // ===================================================================================================

    const [totalTimeslot, setTotalTimeslot] = useState(null);

    useEffect(() => {
        if (programStatus !== 'succeeded' || subjectStatus !== 'succeeded') {
            console.log('Programs or Subjects not loaded yet. Skipping gradeTotalTimeslot calculation.');
            return;
        }

        if (selectedProgram === '' || selectedYearLevel === '') {
            console.log('No program or year level selected. Skipping gradeTotalTimeslot calculation.');
            return;
        }

        console.log('sectionsssssssssss', sections);

        if (Object.keys(programs).length === 0) {
            console.log('No data to process');
            return;
        }

        let totalNumOfClasses = 0;

        programs[selectedProgram][selectedYearLevel].subjects.forEach((subject) => {
            totalNumOfClasses += Math.min(
                Math.ceil(subjects[subject].weeklyMinutes / subjects[subject].classDuration),
                numOfSchoolDays
            );
        });

        let totalTimeslot = Math.ceil(totalNumOfClasses / numOfSchoolDays);

        totalTimeslot += totalTimeslot >= 10 ? 2 : 1;

        setTotalTimeslot(totalTimeslot);
    }, [
        subjects,
        numOfSchoolDays,
        sections,
        sectionStatus,
        subjectStatus,
        programStatus,
        programs,
        selectedProgram,
        selectedYearLevel,
    ]);

    // ===================================================================================================

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleAddEntry = () => {
        if (
            inputValue === '' ||
            selectedAdviser === '' ||
            selectedProgram === '' ||
            selectedYearLevel === '' ||
            selectedSubjects.length === 0 ||
            roomDetails.buildingId === -1 ||
            roomDetails.floorIdx === -1 ||
            roomDetails.roomIdx === -1
        ) {
            const errorFields = [];
            if (inputValue === '') errorFields.push('name');
            if (selectedAdviser === '') errorFields.push('adviser');
            if (selectedProgram === '') errorFields.push('program');
            if (selectedYearLevel === '') errorFields.push('yearLevel');
            if (selectedSubjects.length === 0) errorFields.push('subjects');
            if (roomDetails.buildingId === -1 || roomDetails.floorIdx === -1 || roomDetails.roomIdx === -1)
                errorFields.push('room');

            if (errorFields.length > 0) {
                setErrorMessage('All fields are required.');
                setErrorField(errorFields);
                return;
            }
        }

        const duplicateSection = Object.values(sections).find(
            (section) => section.section.trim().toLowerCase() === inputValue.trim().toLowerCase()
        );

        const duplicateAdviser = Object.values(sections).find((section) => section.teacher === selectedAdviser);

        if (duplicateSection) {
            setErrorMessage('Section already exists.');
            setErrorField('name');
            return;
        } else if (duplicateAdviser) {
            setErrorMessage(`Teacher is already assigned as adviser of section '${duplicateAdviser.section}'`);
            setErrorField('adviser');
            // alert(`Teacher is already assigned as adviser of section '${duplicateAdviser.section}'`);
            return;
        } else {
            // Add advisory load to teacher
            const advisoryLoad = {
                name: 'Advisory Load',
                subject: -1,
                duration: 60,
                frequency: numOfSchoolDays,
                shown: false,
                time: 96,
            };

            const teacher = structuredClone(teachers[selectedAdviser]);
            teacher.additionalTeacherScheds = teacher.additionalTeacherScheds || [];
            teacher.additionalTeacherScheds.push(advisoryLoad);

            dispatch(
                editTeacher({
                    teacherId: selectedAdviser,
                    updatedTeacher: teacher,
                })
            );

            // Add section
            dispatch(
                reduxFunction({
                    [reduxField[0]]: inputValue,
                    teacher: selectedAdviser,
                    program: selectedProgram,
                    year: selectedYearLevel,
                    subjects: selectedSubjects,
                    fixedDays: fixedDays,
                    fixedPositions: fixedPositions,
                    shift: selectedShift,
                    startTime: getTimeSlotIndex(selectedStartTime || '06:00 AM'),
                    endTime: selectedEndTime,
                    additionalScheds: additionalScheds,
                    roomDetails: roomDetails,
                })
            );
            handleReset();
        }

        toast.success('Section added successfully', {
            style: {
                backgroundColor: 'green',
                color: 'white',
                bordercolor: 'green',
            },
        });

        handleReset();
        close();

        if (inputNameRef.current) {
            inputNameRef.current.focus();
            inputNameRef.current.select();
        }
    };

    // ===================================================================================================

    // End Times
    const handleEndTimeChange = () => {
        if (selectedSubjects.length === 0) return;

        const startTimeIdx = getTimeSlotIndex(selectedStartTime);
        const breakTimeCount = selectedSubjects.length > 10 ? 2 : 1;

        let totalDuration = breakTimeCount * breakTimeDuration;

        selectedSubjects.forEach((subId) => {
            totalDuration += subjects[subId].classDuration;
        });

        const endTimeIdx = Math.ceil(totalDuration / 5) + startTimeIdx;

        if (!getTimeSlotString(endTimeIdx)) {
            setIsEndTimeValid(false);
            return;
        }

        setIsEndTimeValid(true);

        setSelectedEndTime(endTimeIdx);
    };

    useEffect(() => {
        if (selectedSubjects.length === 0) return;

        handleEndTimeChange();
    }, [selectedSubjects, selectedStartTime, breakTimeDuration]);

    // Additional Schedules
    const handleAddAdditionalSchedule = () => {
        setAdditionalScheds((prevScheds) => [
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
        setAdditionalScheds((prevScheds) => prevScheds.filter((_, i) => i !== index));
    };

    // ===================================================================================================

    const handleReset = () => {
        setErrorMessage('');
        setErrorField([]);
        setInputValue('');
        setSelectedProgram('');
        setSelectedYearLevel('');
        setSelectedAdviser('');
        setSelectedSubjects([]);
        setSelectedShift(0);
        setSelectedStartTime('');
        setSelectedEndTime('');
        setFixedDays({});
        setFixedPositions({});
        setAdditionalScheds([]);
        setRoomDetails({ buildingId: -1, floorIdx: -1, roomIdx: -1 });
    };

    // ===================================================================================================

    useEffect(() => {
        if (buildingStatus === 'idle') {
            dispatch(fetchBuildings());
        }
    }, [buildingStatus, dispatch]);

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

    // ===================================================================================================

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    useEffect(() => {
        console.log('additionalScheds:', additionalScheds);
    }, [additionalScheds]);

    // ===================================================================================================

    return (
        <div>
            <div className='flex justify-center'>
                <h3 className='text-lg font-bold mb-4'>Add New Section</h3>
            </div>

            {/* Section Name */}
            <div className='mb-4'>
                <label className='label'>
                    <span className='label-text'>Section Name</span>
                </label>
                <input
                    type='text'
                    ref={inputNameRef}
                    placeholder={`${reduxField[0]} Name`}
                    required
                    className='input input-bordered input-sm w-full '
                    value={inputValue}
                    onChange={handleInputChange}
                />
            </div>

            {/* Section Adviser */}
            <div className='mt-3'>
                <label className='label'>
                    <span className='label-text'>Assign Adviser</span>
                </label>
                <select
                    className={`select select-bordered w-full ${errorField.includes('adviser') ? 'border-red-500' : ''}`}
                    value={selectedAdviser}
                    onChange={(e) => setSelectedAdviser(parseInt(e.target.value, 10))}
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
                    className={`select select-bordered w-full ${errorField.includes('program') ? 'border-red-500' : ''}`}
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(parseInt(e.target.value, 10))}
                >
                    <option value='' disabled>
                        Select a program
                    </option>
                    {Object.keys(programs).map((key) => (
                        <option key={programs[key].id} value={programs[key].id}>
                            {programs[key].program}
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
                    className={`select select-bordered w-full ${errorField.includes('yearLevel') ? 'border-red-500' : ''}`}
                    value={selectedYearLevel}
                    onChange={(e) => setSelectedYearLevel(parseInt(e.target.value, 10))}
                >
                    <option value='' disabled>
                        Select a year level
                    </option>
                    {[7, 8, 9, 10].map((level) => (
                        <option key={level} value={level}>
                            Grade {level}
                        </option>
                    ))}
                </select>
            </div>

            {/* Section Shift */}
            <div className='mt-5'>
                <label className='mr-2'>Shift:</label>
                <label className='mr-2'>
                    <input
                        type='radio'
                        value={selectedShift}
                        checked={selectedShift === 0}
                        onChange={() => {
                            setSelectedShift(0); // PM shift
                            setSelectedStartTime('06:00 AM'); // Reset to default AM start time
                        }}
                    />
                    AM
                </label>
                <label>
                    <input
                        type='radio'
                        value={selectedShift}
                        checked={selectedShift === 1}
                        onChange={() => {
                            setSelectedShift(1); // PM shift
                            setSelectedStartTime('01:00 PM'); // Reset to default PM start time
                        }}
                    />
                    PM
                </label>
            </div>

            {/* Section Start Time (AM or PM) */}
            <div className='mt-2 flex flex-wrap'>
                <label className='w-1/4 mr-2 p-2 text-sm flex items-center justify-end font-bold'>START TIME</label>
                <div className='w-2/3 pl-2'>
                    <TimeSelector
                        key={`start-time-section(0)`}
                        interval={5}
                        time={selectedStartTime}
                        setTime={setSelectedStartTime}
                        am={selectedShift === 0 ? 1 : 0}
                        pm={selectedShift === 1 ? 1 : 0}
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

            {/* Room Details */}
            <div className='mt-3'>
                <label className='label'>
                    <span className='label-text'>Room Details</span>
                </label>

                <div className='flex flex-wrap'>
                    {/* Building */}
                    <div className='w-1/4 flex flex-col justify-start'>
                        <label className='label'>
                            <span className='label-text'>Building</span>
                        </label>
                        <input
                            type='text'
                            value={buildings[roomDetails.buildingId]?.name || ''}
                            className='input input-bordered input-sm w-5/6'
                            readOnly
                        />
                    </div>

                    {/* Floor */}
                    <div className='w-1/4 flex flex-col justify-start'>
                        <label className='label'>
                            <span className='label-text'>Floor</span>
                        </label>
                        <input
                            type='text'
                            value={roomDetails.floorIdx !== -1 ? roomDetails.floorIdx + 1 : ''}
                            className='input input-bordered input-sm w-5/6'
                            readOnly
                        />
                    </div>

                    {/* Room */}
                    <div className='w-1/4 flex flex-col justify-start'>
                        <label className='label'>
                            <span className='label-text'>Room</span>
                        </label>
                        <input
                            type='text'
                            value={
                                buildings[roomDetails.buildingId]?.rooms[roomDetails.floorIdx][roomDetails.roomIdx].roomName || ''
                            }
                            className='input input-bordered input-sm w-5/6'
                            readOnly
                        />
                    </div>

                    <div className='w-1/4 flex justify-start items-end'>
                        <button
                            className={`btn btn-primary btn-sm}`}
                            onClick={() =>
                                document.getElementById(`view_rooms_modal_viewMode(0)_section(0)_building(0)`).showModal()
                            }
                            data-tip='Select a room'
                            disabled={isRoomSelectionDisabled}
                        >
                            Select Room
                        </button>
                        {isRoomSelectionDisabled && (
                            <div
                                className='w-auto flex ml-2 items-center tooltip text-yellow-500'
                                data-tip='Select program and year level first'
                            >
                                <IoWarningSharp size={35} />
                            </div>
                        )}
                    </div>

                    <ViewRooms
                        viewMode={0}
                        roomDetails={roomDetails}
                        setRoomDetails={setRoomDetails}
                        startTime={getTimeSlotIndex(selectedStartTime)}
                        endTime={selectedEndTime}
                    />
                </div>
            </div>

            {/* Subjects and Fixed Schedules */}
            {selectedSubjects.length > 0 && (
                <>
                    <div className='mt-4 text-sm'>
                        <table className='min-w-full font-normal border border-base-content border-opacity-20'>
                            <thead className=''>
                                <tr className=''>
                                    {['Subject', 'Duration (min)', 'Weekly Minutes', '# of Classes'].map((header) => (
                                        <th key={header} className='p-3 font-normal'>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedSubjects.map((subjectID) => (
                                    <tr key={subjectID}>
                                        <td className='p-2'>
                                            {subjects[subjectID]?.subject || 'Unknown Subject, ID: ' + subjectID}
                                        </td>
                                        <td className='p-2'>{subjects[subjectID]?.classDuration || 'N/A'}</td>
                                        <td className='p-2'>{subjects[subjectID]?.weeklyMinutes || 'N/A'}</td>
                                        <td>
                                            {Math.min(
                                                Math.ceil(
                                                    subjects[subjectID]?.weeklyMinutes / subjects[subjectID]?.classDuration
                                                ),
                                                numOfSchoolDays
                                            ) || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        className='btn'
                        onClick={() =>
                            document
                                .getElementById(`assign_fixed_sched_modal_section(0)-grade(${selectedYearLevel})-view(0)`)
                                .showModal()
                        }
                    >
                        Edit Section Fixed Schedule(s)
                    </button>

                    <FixedScheduleMaker
                        key={selectedYearLevel}
                        viewingMode={0}
                        isForSection={true}
                        pvs={1}
                        section={0}
                        grade={selectedYearLevel}
                        // totalTimeslot={totalTimeslot}
                        selectedSubjects={selectedSubjects}
                        fixedDays={fixedDays}
                        setFixedDays={setFixedDays}
                        fixedPositions={fixedPositions}
                        setFixedPositions={setFixedPositions}
                        numOfSchoolDays={numOfSchoolDays}
                    />
                </>
            )}

            {/* Additional Schedules */}
            {additionalScheds.length > 0 && (
                <div className='mt-4 flex flex-col justify-center items-center'>
                    <div
                        className='w-1/2 flex flex-wrap'
                        style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            backgroundColor: 'white',
                        }}
                    >
                        <div className='w-9/12 font-bold p-2 border-b border-gray-300 rounded-tl-lg'>Additional Schedules</div>
                        <div className='w-3/12 flex justify-center items-center border-b border-gray-300 rounded-tr-lg'>
                            <button
                                className='w-3/4 bg-green-700 m-2 font-bold text-white rounded-lg hover:bg-green-500'
                                onClick={handleAddAdditionalSchedule}
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div
                        className='w-1/2 overflow-y-auto max-h-36 border border-gray-300 rounded-b-lg'
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#a0aec0 #edf2f7',
                        }} // Optional for styled scrollbars
                    >
                        {additionalScheds.map((sched, index) => (
                            <div key={index} className='flex flex-wrap'>
                                <button
                                    className='w-1/12 border rounded-bl-lg hover:bg-gray-200 flex items-center justify-center'
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
                                                    `add_additional_sched_modal_1_grade-${selectedYearLevel}_sec-0_idx-${index}`
                                                )
                                                .showModal()
                                        }
                                    >
                                        {sched.name ? (
                                            // Content to show when both are not empty
                                            <>
                                                <p>Name: {sched.name}</p>
                                                <p>Subject: {sched.subject === -1 ? 'N/A' : subjects[sched.subject].subject}</p>
                                            </>
                                        ) : (
                                            // Content to show when either is empty
                                            <p>Untitled Schedule {index + 1}</p>
                                        )}
                                    </button>
                                    <AdditionalScheduleForSection
                                        viewingMode={1}
                                        sectionID={0}
                                        grade={selectedYearLevel}
                                        arrayIndex={index}
                                        additionalSchedsOfSection={sched}
                                    />
                                </div>
                                <div className='w-1/12  flex items-center justify-center border rounded-br-lg hover:bg-gray-200'>
                                    <button
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    `add_additional_sched_modal_0_grade-${selectedYearLevel}_sec-0_idx-${index}`
                                                )
                                                .showModal()
                                        }
                                    >
                                        <RiEdit2Fill size={15} />
                                    </button>
                                    <AdditionalScheduleForSection
                                        viewingMode={0}
                                        sectionID={0}
                                        grade={selectedYearLevel}
                                        arrayIndex={index}
                                        numOfSchoolDays={numOfSchoolDays}
                                        sectionSubjects={selectedSubjects}
                                        additionalSchedsOfSection={sched}
                                        setAdditionalScheds={setAdditionalScheds}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {errorMessage && <p className='text-red-500 text-sm my-4 font-medium select-none '>{errorMessage}</p>}

            <div className='flex justify-center gap-4 mt-4'>
                <button className='btn btn-secondary' onClick={handleReset}>
                    Reset
                </button>
                <button className='btn btn-primary' onClick={handleAddEntry} disabled={!isEndTimeValid}>
                    Add Section
                </button>
            </div>
        </div>
    );
};

export default AddSectionContainer;
