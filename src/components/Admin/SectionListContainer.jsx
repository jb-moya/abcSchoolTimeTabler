import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import {
    fetchSections,
    addSection,
    editSection,
    removeSection,
} from '@features/sectionSlice';
import { fetchPrograms } from '@features/programSlice';
import { fetchSubjects } from '@features/subjectSlice';
import { fetchTeachers } from '@features/teacherSlice';
import { getTimeSlotString, getTimeSlotIndex } from './timeSlotMapper';
import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

import { toast } from 'sonner';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

import FixedScheduleMaker from './FixedSchedules/fixedScheduleMaker';

const AdditionalScheduleForSection = ({
    viewingMode = 0,
    sectionID = 0,
    grade = 0,

    arrayIndex = 0,

    sectionSubjects = [],

    numOfSchoolDays = 1,

    additionalSchedsOfSection = [],
    setAdditionalScheds = () => {},
}) => {

    const subjects = useSelector((state) => state.subject.subjects);

    const [schedName, setSchedName] = useState(additionalSchedsOfSection.name);
    const [schedSubject, setSchedSubject] = useState(additionalSchedsOfSection.subject);
    const [schedDuration, setSchedDuration] = useState(additionalSchedsOfSection.duration);
    const [schedFrequency, setSchedFrequency] = useState(additionalSchedsOfSection.frequency);
    const [schedShown, setSchedShown] = useState(false);

    const handleSave = () => {
        const newSched = {
            name: schedName,
            subject: schedSubject,
            duration: schedDuration,
            frequency: schedFrequency,
            shown: schedShown,
        };

        // console.log('Old Sched: ', additionalSchedsOfSection);

        setAdditionalScheds((prev) => {
            const updatedScheds = [ ...prev];
            updatedScheds[arrayIndex] = newSched;

            // console.log('Updated Scheds:', updatedScheds);

            return updatedScheds;
        });        

        resetStates();
           
        document.getElementById(`add_additional_sched_modal_${viewingMode}_grade-${grade}_sec-${sectionID}_idx-${arrayIndex}`).close();
    };

    const handleClose = () => {
        const modal = document.getElementById(`add_additional_sched_modal_${viewingMode}_grade-${grade}_sec-${sectionID}_idx-${arrayIndex}`);

        resetStates();

        if (modal) {
            modal.close();
        }
    };

    const resetStates = () => {
        setSchedName(additionalSchedsOfSection.name);
        setSchedSubject(additionalSchedsOfSection.subject);
        setSchedDuration(additionalSchedsOfSection.duration);
        setSchedFrequency(additionalSchedsOfSection.frequency);
        setSchedShown(additionalSchedsOfSection.frequency);
    };

    useEffect(() => {
        setSchedName(additionalSchedsOfSection.name || '');
        setSchedSubject(additionalSchedsOfSection.subject || 0);
        setSchedDuration(additionalSchedsOfSection.duration || 0);
        setSchedFrequency(additionalSchedsOfSection.frequency || '');
        setSchedShown(additionalSchedsOfSection.shown || false);
    }, [additionalSchedsOfSection]);
    

    // useEffect(() => {
    //     console.log('schedName', schedName);
    //     console.log('schedSubject', schedSubject);
    //     console.log('typeof schedSubject', typeof schedSubject);
    //     console.log('schedDuration', schedDuration);
    //     console.log('schedFrequency', schedFrequency);
    //     console.log('schedShown', schedShown);
    // }, [schedName, schedSubject, schedDuration, schedFrequency, schedShown]);

    return (
        <dialog
            id={`add_additional_sched_modal_${viewingMode}_grade-${grade}_sec-${sectionID}_idx-${arrayIndex}`}
            className='modal modal-bottom sm:modal-middle'
        >
            <div
                className='modal-box'
            >

                <div>
                    <div className='mb-3 text-center text-lg font-bold'>
                        {viewingMode === 1 ? (
                            <div>View Mode</div>
                        ) : (
                            <div>Edit Mode</div>
                        )}
                    </div>
                
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Schedule Name:
                        </label>
                        <input
                            type="text"
                            // ref={inputNameRef}
                            className="input input-bordered w-full"
                            value={schedName}
                            onChange={(e) => setSchedName(e.target.value)}
                            placeholder="Enter schedule name"
                            readOnly={viewingMode !== 0}
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-1'>
                            Subject:
                        </label>
                        {viewingMode === 0 ? (
                            <select
                                className='input input-bordered w-full'
                                value={schedSubject === 0 ? 0 : schedSubject}
                                onChange={(e) => setSchedSubject(Number(e.target.value))}
                            >
                                <option
                                    value={0}
                                    className='text-gray-400'
                                >
                                    N/A
                                </option>
                                {sectionSubjects.map((id) => (
                                    <option key={id} value={id}>
                                        {subjects[id]?.subject}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type='text'
                                className='input input-bordered w-full'
                                value={
                                    subjects[schedSubject]?.subject || 'N/A'
                                }
                                readOnly
                            />
                        )}
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-1'>
                            Duration (in minutes):
                        </label>
                        <input
                            type='number'
                            className='input input-bordered w-full'
                            value={schedDuration}
                            onChange={(e) => setSchedDuration(Number(e.target.value))}
                            placeholder='Enter duration'
                            readOnly={viewingMode !== 0}
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-1'>
                            Frequency:
                        </label>
                        <input
                            type='number'
                            className='input input-bordered w-full'
                            value={schedFrequency}
                            onChange={(e) => setSchedFrequency(Number(e.target.value))}
                            placeholder='Enter frequency'
                            min={1}
                            max={numOfSchoolDays}
                            readOnly={viewingMode !== 0}
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-1'>
                            Must Appear on Schedule:
                        </label>
                        <select
                            className='input input-bordered w-full'
                            value={schedShown ? 'Yes' : 'No'}
                            onChange={(e) => setSchedShown(e.target.value === 'Yes')}
                            readOnly={viewingMode !== 0}
                        >
                            <option value='Yes'>Yes</option>
                            <option value='No'>No</option>
                        </select>
                    </div>

                    <div className='mt-4 text-center text-lg font-bold'>
                        {viewingMode !== 1 && (
                            <div
                                className='flex flex-wrap gap-2 justify-center'
                            >
                                <button
                                    className='btn btn-sm rounded-lg bg-green-600 text-white hover:bg-green-500'
                                    onClick={handleSave}
                                >
                                    Save
                                </button>
                                <button
                                    className='btn btn-sm rounded-lg bg-red-600 text-white hover:bg-red-500'
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-action w-full mt-0">
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        onClick={handleClose}
                    >
                        ✕
                    </button>
                </div>

            </div>
        </dialog>
    );
};

const AddSectionContainer = ({
    close,
    reduxField,
    reduxFunction,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays,
}) => {
    const inputNameRef = useRef();
    const dispatch = useDispatch();

    const { programs, status: programStatus } = useSelector(
        (state) => state.program
    );
    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );
    const { teachers, status: teacherStatus } = useSelector(
        (state) => state.teacher
    );
    const { sections, status: sectionStatus } = useSelector(
        (state) => state.section
    );

    // const numOfSchoolDays = parseInt(localStorage.getItem('numOfSchoolDays'), 10);

    const [inputValue, setInputValue] = useState('');
    const [selectedAdviser, setSelectedAdviser] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedYearLevel, setSelectedYearLevel] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedShift, setSelectedShift] = useState(0);
    const [selectedStartTime, setSelectedStartTime] = useState(0);
    const [fixedDays, setFixedDays] = useState({});
    const [fixedPositions, setFixedPositions] = useState({});
    const [additionalScheds, setAdditionalScheds] = useState([]);

    const [totalTimeslot, setTotalTimeslot] = useState(null);

    useEffect(() => {
        if (programStatus !== 'succeeded' || subjectStatus !== 'succeeded') {
            console.log(
                'Programs or Subjects not loaded yet. Skipping gradeTotalTimeslot calculation.'
            );
            return;
        }

        if (selectedProgram === '' || selectedYearLevel === '') {
            console.log(
                'No program or year level selected. Skipping gradeTotalTimeslot calculation.'
            );
            return;
        }

        console.log('sectionsssssssssss', sections);

        if (Object.keys(programs).length === 0) {
            console.log('No data to process');
            return;
        }

        let totalNumOfClasses = 0;

        programs[selectedProgram][selectedYearLevel].subjects.forEach(
            (subject) => {
                totalNumOfClasses += Math.min(
                    Math.ceil(
                        subjects[subject].weeklyMinutes /
                            subjects[subject].classDuration
                    ),
                    numOfSchoolDays
                );
            }
        );

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

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleAddEntry = () => {
        if (
            inputValue === '' ||
            selectedAdviser === '' ||
            selectedProgram === '' ||
            selectedYearLevel === '' ||
            selectedSubjects.length === 0
        ) {
            const errorFields = [];
            if (inputValue === '') errorFields.push('name');
            if (selectedAdviser === '') errorFields.push('adviser');
            if (selectedProgram === '') errorFields.push('program');
            if (selectedYearLevel === '') errorFields.push('yearLevel');
            if (selectedSubjects.length === 0) errorFields.push('subjects');

            if (errorFields.length > 0) {
                setErrorMessage('All fields are required.');
                setErrorField(errorFields);
                return;
            }
        }

        const duplicateSection = Object.values(sections).find(
            (section) =>
                section.section.trim().toLowerCase() ===
                inputValue.trim().toLowerCase()
        );

        const duplicateAdviser = Object.values(sections).find(
            (section) => section.teacher === selectedAdviser
        );

        if (duplicateSection) {
            setErrorMessage('Section already exists.');
            setErrorField('name');
            return;
        } else if (duplicateAdviser) {
            setErrorMessage(
                `Teacher is already assigned as adviser of section '${duplicateAdviser.section}'`
            );
            setErrorField('adviser');
            // alert(`Teacher is already assigned as adviser of section '${duplicateAdviser.section}'`);
            return;
        } else {
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
                startTime: selectedStartTime,
                additionalScheds: additionalScheds,
                })
            );
            handleReset();
        }

        toast.success('Teacher added successfully', {
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

    const handleReset = () => {
        setErrorMessage('');
        setErrorField([]);
        setInputValue('');
        setSelectedProgram('');
        setSelectedYearLevel('');
        setSelectedAdviser('');
        setSelectedSubjects([]);
        setSelectedShift(0);
        setSelectedStartTime(0);
        setFixedDays({});
        setFixedPositions({});
        setAdditionalScheds([]);
    };

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    useEffect(() => {
        console.log('additionalScheds:', additionalScheds);
    }, [additionalScheds]);

    useEffect(() => {
        if (selectedProgram && selectedYearLevel) {
            const program = Object.values(programs).find(
                (p) => p.id === selectedProgram
            );

            if (program) {
                setSelectedSubjects(
                    program[selectedYearLevel].subjects || []
                );
                setFixedDays(
                    program[selectedYearLevel].fixedDays || {}
                );
                setFixedPositions(
                    program[selectedYearLevel].fixedPositions || {}
                );
                setAdditionalScheds(
                    program[selectedYearLevel].additionalScheds || []
                );
                setSelectedShift(
                    program[selectedYearLevel].shift || 0
                );
                setSelectedStartTime(
                    program[selectedYearLevel].startTime || 0
                );
            }
        }
    }, [selectedProgram, selectedYearLevel, programs]);

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

    return (
        <div>
            <div className="flex justify-center">
                <h3 className="text-lg font-bold mb-4">Add New Section</h3>
            </div>

            <div className="mb-4">
                <label className="label">
                    <span className="label-text">Section Name</span>
                </label>
                <input
                    type="text"
                    ref={inputNameRef}
                    placeholder={`${reduxField[0]} Name`}
                    required
                    className="input input-bordered input-sm w-full "
                    value={inputValue}
                    onChange={handleInputChange}
                />
            </div>

            <div className="mt-3">
                <label className="label">
                    <span className="label-text">Assign Adviser</span>
                </label>
                <select
                    className={`select select-bordered w-full ${
                        errorField.includes('adviser') ? 'border-red-500' : ''
                    }`}
                    value={selectedAdviser}
                    onChange={(e) =>
                        setSelectedAdviser(parseInt(e.target.value, 10))
                    }
                >
                    <option value="" disabled>
                        Assign an adviser
                    </option>
                    {Object.keys(teachers).map((key) => (
                        <option key={teachers[key].id} value={teachers[key].id}>
                            {teachers[key].teacher}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-3">
                <label className="label">
                    <span className="label-text">Select Program</span>
                </label>
                <select
                    className={`select select-bordered w-full ${
                        errorField.includes('program') ? 'border-red-500' : ''
                    }`}
                    value={selectedProgram}
                    onChange={(e) =>
                        setSelectedProgram(parseInt(e.target.value, 10))
                    }
                >
                    <option value="" disabled>
                        Select a program
                    </option>
                    {Object.keys(programs).map((key) => (
                        <option key={programs[key].id} value={programs[key].id}>
                            {programs[key].program}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-3">
                <label className="label">
                    <span className="label-text">Select Year Level</span>
                </label>
                <select
                    className={`select select-bordered w-full ${
                        errorField.includes('yearLevel') ? 'border-red-500' : ''
                    }`}
                    value={selectedYearLevel}
                    onChange={(e) =>
                        setSelectedYearLevel(parseInt(e.target.value, 10))
                    }
                >
                    <option value="" disabled>
                        Select a year level
                    </option>
                    {[7, 8, 9, 10].map((level) => (
                        <option key={level} value={level}>
                            Grade {level}
                        </option>
                    ))}
                </select>
            </div>

            {selectedSubjects.length > 0 && (
                <>
                    <div className="mt-4 text-sm">
                        <table className="min-w-full bg-white font-normal border border-gray-300">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">
                                        Subject
                                    </th>
                                    <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">
                                        Duration (min)
                                    </th>
                                    <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">
                                        Weekly Minutes
                                    </th>
                                    <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">
                                        # of Classes
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedSubjects.map((subjectID) => (
                                    <tr key={subjectID}>
                                        <td className="p-2">
                                            {subjects[subjectID]?.subject ||
                                                'Unknown Subject, ID: ' +
                                                    subjectID}
                                        </td>
                                        <td className="p-2">
                                            {subjects[subjectID]
                                                ?.classDuration || 'N/A'}
                                        </td>
                                        <td className="p-2">
                                            {subjects[subjectID]
                                                ?.weeklyMinutes || 'N/A'}
                                        </td>
                                        <td>
                                            {Math.min(
                                                Math.ceil(
                                                    subjects[subjectID]
                                                        ?.weeklyMinutes /
                                                        subjects[subjectID]
                                                            ?.classDuration
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
                        className="btn"
                        onClick={() =>
                            document
                                .getElementById(
                                    `assign_fixed_sched_modal_section(0)-grade(${selectedYearLevel})`
                                )
                                .showModal()
                        }
                    >
                        Edit Section Fixed Schedule(s)
                    </button>

                    <FixedScheduleMaker
                        key={selectedYearLevel}
                        addingMode={0}
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

            { 
                additionalScheds.length > 0 &&
                <div
                    className='flex flex-col justify-center items-center'
                >
                    <div
                        className='mt-2 w-1/4 border border-gray-300 rounded-t-lg font-bold'
                    >
                        Additional Schedules
                    </div>
                    <div
                        className='w-1/4 overflow-y-auto max-h-36 border border-gray-300 rounded-b-lg'
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#a0aec0 #edf2f7' }} // Optional for styled scrollbars
                    >
                        {additionalScheds.map((sched, index) => (
                            <div
                                key={index}
                                className='flex flex-wrap'
                            >
                                <button
                                    className='w-1/12 border rounded-l-lg hover:bg-gray-200 flex items-center justify-center'
                                    // onClick={() => handleDeleteAdditionalSchedule(grade, index)}
                                >
                                    <RiDeleteBin7Line
                                        size={15}
                                    />
                                </button>
                                <div
                                    className='w-10/12'
                                >
                                    <button
                                        className="w-full bg-gray-100 p-2 border shadow-sm hover:bg-gray-200"
                                        onClick={() => document
                                            .getElementById(
                                                `add_additional_sched_modal_1_grade-${selectedYearLevel}_sec-0_idx-${index}`
                                            )
                                            .showModal()}
                                    >
                                        {sched.name || sched.subject ? (
                                            // Content to show when both are not empty
                                            <>
                                                <p>Name: {sched.name}</p>
                                                <p>Subject: {sched.subject === 0 ? 'N/A' : subjects[sched.subject].subject}</p>
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
                                <div 
                                    className='w-1/12  flex items-center justify-center border rounded-r-lg hover:bg-gray-200'
                                >
                                    <button
                                        onClick={() => document
                                            .getElementById(
                                                `add_additional_sched_modal_0_grade-${selectedYearLevel}_sec-0_idx-${index}`
                                            )
                                            .showModal()}
                                    >
                                        <RiEdit2Fill
                                            size={15}
                                        />
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
            }
            

            {errorMessage && (
                <p className="text-red-500 text-sm my-4 font-medium select-none ">
                    {errorMessage}
                </p>
            )}

            <div className="flex justify-center gap-4 mt-4">
                <button className="btn btn-secondary" onClick={handleReset}>
                    Reset
                </button>
                <button className="btn btn-primary" onClick={handleAddEntry}>
                    Add Section
                </button>
            </div>
        </div>
    );
};

const SectionListContainer = ({
    numOfSchoolDays: externalNumOfSchoolDays,
    editable = false,
}) => {
    const dispatch = useDispatch();
    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );
    const { sections, status: sectionStatus } = useSelector(
        (state) => state.section
    );
    const { programs, status: programStatus } = useSelector(
        (state) => state.program
    );
    const { teachers, status: teacherStatus } = useSelector(
        (state) => state.teacher
    );

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return (
            externalNumOfSchoolDays ??
            (Number(localStorage.getItem('numOfSchoolDays')) || 0)
        );
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState([]);

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

    const [sectionTotalTimeslot, setSectionTotalTimeslot] = useState({});

    // useEffect(() => {
    //     if (sectionStatus !== 'succeeded' || subjectStatus !== 'succeeded') {
    //         console.log(
    //             'Programs or Subjects not loaded yet. Skipping gradeTotalTimeslot calculation.'
    //         );
    //         return;
    //     }

    //     const newSectionTotalTimeslot = {};

    //     console.log('sectionsssssssssss', sections);

    //     if (Object.keys(sections).length === 0) {
    //         console.log('No data to process');
    //         return;
    //     }

    //     Object.entries(sections).forEach(([sectionID, section]) => {
    //         console.log('>', sectionID, 'section', sections);

    //         let sectionSubjects = section.subjects;

    //         let totalNumOfClasses = 0;

    //         console.log('gradeInfo.subjects', sectionSubjects);

    //         sectionSubjects.forEach((subject) => {
    //             totalNumOfClasses += Math.min(Math.ceil(
    //                 subjects[subject].weeklyMinutes /
    //                     subjects[subject].classDuration
    //             ), numOfSchoolDays);
    //         });

    //         console.log("heheheh eh ehe");

    //         let totalTimeslot = Math.ceil(totalNumOfClasses / numOfSchoolDays);

    //         console.log('totalTimeslot', totalTimeslot);
    //         newSectionTotalTimeslot[sectionID] = totalTimeslot;
    //     });

    //     console.log('newGradeTotalTimeslot', newSectionTotalTimeslot);

    //     setSectionTotalTimeslot(newSectionTotalTimeslot);
    // }, [subjects, numOfSchoolDays, sections, sectionStatus, subjectStatus]);

    const [searchSectionResult, setSearchSectionResult] = useState(sections);
    const [searchSectionValue, setSearchSectionValue] = useState('');

    const [currEditProgram, setCurrEditProgram] = useState('');
    const [currEditYear, setCurrEditYear] = useState('');

    const handleEditSectionClick = (section) => {
        setEditSectionId(section.id);
        setEditSectionValue(section.section);
        setEditSectionAdviser(section.teacher);
        setEditSectionProg(section.program);
        setEditSectionYear(section.year);
        setEditSectionShift(section.shift);
        setEditSectionStartTime(getTimeSlotString(section.startTime));
        setEditSectionSubjects(section.subjects);
        setEditSectionFixedDays(section.fixedDays);
        setEditSectionFixedPositions(section.fixedPositions);
        setEditAdditionalScheds(section.additionalScheds);

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
            editSectionValue.trim().toLowerCase() ===
                currentSection.trim().toLowerCase() &&
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
                },
                })
            );

            toast.success('Section added successfully', {
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
                    section.section.trim().toLowerCase() ===
                    editSectionValue.trim().toLowerCase()
            );

            const duplicateAdviser = Object.values(sections).find(
                (section) => section.teacher === editSectionAdviser
            );

            // console.log('duplicateAdviser: ', duplicateAdviser);

            if (duplicateSection) {
                toast.error('Section name already taken.', {
                    style: { backgroundColor: 'red', color: 'white' },
                });
                return;
            } else if (duplicateAdviser) {
                toast.error(
                    `Adviser already assigned to section '${duplicateAdviser.section}'`,
                    {
                        tyle: { backgroundColor: 'red', color: 'white' },
                    }
                );
            } else {
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

        setCurrEditProgram('');
        setCurrEditYear('');
    };

    const handleAddAdditionalSchedule = () => {
        setEditAdditionalScheds((prevScheds) => [
            ...prevScheds,
            { 
                name: '', 
                subject: 0,
                duration: 60,
                frequency: 1,
                shown: true,
            },
        ]);
    };
    
    const handleDeleteAdditionalSchedule = (index) => {
        setEditAdditionalScheds((prevScheds) =>
            prevScheds.filter((_, i) => i !== index)
        );
    };
    
    const renderTimeOptions = () => {
        const times =
            editSectionShift === 0
                ? Array.from({ length: 36 }, (_, i) => {
                      const hours = 6 + Math.floor(i / 6);
                      const minutes = (i % 6) * 10;
                      return `${String(hours).padStart(2, '0')}:${String(
                          minutes
                      ).padStart(2, '0')} AM`;
                  })
                : ['01:00 PM']; // Only one option for PM

        return times.map((time) => (
            <option key={time} value={time}>
                {time}
            </option>
        ));
    };

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

    const deleteModal = (id) => {
        const deleteModalElement = document.getElementById('delete_modal');
        deleteModalElement.showModal(); // Show the modal

        const deleteButton = document.getElementById('delete_button');
        deleteButton.onclick = () => handleDelete(id); // Dynamically assign delete logic
    };

    const handleDelete = (id) => {
        dispatch(removeSection(id)); // Perform the delete action
        document.getElementById('delete_modal').close(); // Close the modal after deleting
    };

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
                    const escapedSearchValue = escapeRegExp(searchValue)
                        .split('\\*')
                        .join('.*');

                    const sectionSubjectsName = Object.keys(section.subjects)
                        .map((subjectID) => subjects[subjectID]?.subject || '')
                        .join(' ');

                    const pattern = new RegExp(escapedSearchValue, 'i');

                    // Check if program or year level matches the search value
                    const programMatches = pattern.test(section.program);
                    const yearLevelMatches = pattern.test(section.year); // Ensure `year` is the correct property name

                    return (
                        pattern.test(section.section) ||
                        programMatches ||
                        yearLevelMatches ||
                        pattern.test(sectionSubjectsName)
                    );
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        if (externalNumOfSchoolDays !== undefined) {
            setNumOfSchoolDays(externalNumOfSchoolDays);
        }
    }, [externalNumOfSchoolDays]);

    useEffect(() => {
        console.log('numOfSchoolDays:', numOfSchoolDays);
    }, [numOfSchoolDays]);

    useEffect(() => {
        debouncedSearch(searchSectionValue, sections, subjects);
    }, [searchSectionValue, sections, debouncedSearch, subjects]);

    useEffect(() => {
        if (
            editSectionYear !== undefined &&
            editSectionProg !== undefined &&
            (currEditYear !== editSectionYear ||
                currEditProgram !== editSectionProg)
        ) {
            setCurrEditProgram(editSectionProg);
            setCurrEditYear(editSectionYear);

            const program = Object.values(programs).find(
                (p) => p.id === editSectionProg
            );

            if (program) {
                setEditSectionSubjects(
                    program[editSectionYear]?.subjects || []
                );
                setEditSectionFixedDays(
                    program[editSectionYear]?.fixedDays || {}
                );
                setEditSectionFixedPositions(
                    program[editSectionYear]?.fixedPositions || {}
                );
            }
        }
    }, [editSectionYear, editSectionProg, programs]); // Add `programs` as a dependency

    useEffect(() => {
        console.log('editSectionSubjects:', editSectionSubjects);
        console.log('editSectionFixedDays:', editSectionFixedDays);
        console.log('editSectionFixedPositions:', editSectionFixedPositions);
    }, [editSectionSubjects, editSectionFixedDays, editSectionFixedPositions]);

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

    useEffect(() => {
        console.log('editSectionAdviser: ', editSectionAdviser);
    }, [editSectionAdviser]);

    const itemsPerPage = 10; // Adjust this to change items per page
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages based on filtered sections
    const totalPages = Math.ceil(
        Object.values(searchSectionResult).length / itemsPerPage
    );

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchSectionResult).slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    return (
        <React.Fragment>
            <div className="w-full">
                <div className="flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5">
                    {/* Pagination */}
                    {currentItems.length > 0 && (
                        <div className="join flex justify-center mb-4 md:mb-0">
                            <button
                                className={`join-item btn ${
                                    currentPage === 1 ? 'btn-disabled' : ''
                                }`}
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
                            <button className="join-item btn">
                                Page {currentPage} of {totalPages}
                            </button>
                            <button
                                className={`join-item btn ${
                                    currentPage === totalPages
                                        ? 'btn-disabled'
                                        : ''
                                }`}
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
                        <div className="hidden">
                            {setCurrentPage(currentPage - 1)}
                        </div>
                    )}

                    {/* Search Section */}
                    <div className="flex-grow w-full md:w-1/3 lg:w-1/4">
                        <label className="input input-bordered flex items-center gap-2 w-full">
                            <input
                                type="text"
                                className="grow p-3 text-sm w-full"
                                placeholder="Search Section"
                                value={searchSectionValue}
                                onChange={(e) =>
                                    setSearchSectionValue(e.target.value)
                                }
                            />
                            <IoSearch className="text-xl" />
                        </label>
                    </div>

                    {editable && (
                        <div className="w-full mt-4 md:mt-0 md:w-auto">
                            <button
                                className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
                                onClick={() =>
                                    document
                                        .getElementById('add_section_modal')
                                        .showModal()
                                }
                            >
                                Add Section <IoAdd size={20} className="ml-2" />
                            </button>

                            <dialog
                                id="add_section_modal"
                                className="modal modal-bottom sm:modal-middle"
                            >
                                <div
                                    className="modal-box"
                                    style={{ width: '50%', maxWidth: 'none' }}
                                >
                                    <AddSectionContainer
                                        close={handleClose}
                                        reduxField={[
                                            'section',
                                            'subjects',
                                            'units',
                                        ]}
                                        reduxFunction={addSection}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        errorField={errorField}
                                        setErrorField={setErrorField}
                                        numOfSchoolDays={numOfSchoolDays}
                                    />
                                    <div className="modal-action">
                                        <button
                                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
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
                <div className="overflow-x-auto">
                    <table className="table table-sm table-zebra min-w-full">
                        <thead>
                            <tr>
                                {/* <th className="w-8">#</th> */}
                                <th className="w-1">Section ID</th>
                                <th className="w-48">Section</th>
                                <th className="w-40">Adviser</th>
                                {/* <th>Program</th> */}
                                {/* <th>Year</th> */}
                                <th className="w-72">Subjects</th>
                                <th className="w-48">Additional Schedules</th>
                                {editable && (
                                    <th className="w-12 text-right">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        No sections found
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map(([, section], index) => (
                                    <tr
                                        key={section.id}
                                        className="group hover"
                                    >
                                        {/* <td>{index + indexOfFirstItem + 1}</td> */}

                                        {/* Section ID */}
                                        <td>{section.id}</td>

                                        {/* Section Name, Shift, and Start Time */}
                                        <td>
                                            {editSectionId === section.id ? (
                                                <>
                                                    {/* Section Name */}
                                                    <div className="flex items-center mb-2">
                                                        <label
                                                            htmlFor="section-name"
                                                            className="mr-2"
                                                        >
                                                            Name:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="section-name"
                                                            value={
                                                                editSectionValue
                                                            }
                                                            onChange={(e) =>
                                                                setEditSectionValue(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="input input-bordered input-sm w-full"
                                                        />
                                                    </div>

                                                    {/* Section Program */}
                                                    <div className="flex items-center mb-2">
                                                        <label
                                                            htmlFor="section-name"
                                                            className="mr-2"
                                                        >
                                                            Program:
                                                        </label>
                                                        <select
                                                            value={
                                                                editSectionProg
                                                            }
                                                            onChange={(e) => {
                                                                const newProgram =
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                        10
                                                                    );
                                                                setEditSectionProg(
                                                                    newProgram
                                                                );
                                                            }}
                                                            className="select select-bordered"
                                                        >
                                                            {Object.entries(
                                                                programs
                                                            ).map(
                                                                ([
                                                                    key,
                                                                    program,
                                                                ]) => (
                                                                    <option
                                                                        key={
                                                                            key
                                                                        }
                                                                        value={
                                                                            key
                                                                        }
                                                                    >
                                                                        {
                                                                            program.program
                                                                        }
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </div>

                                                    {/* Section Year */}
                                                    <div className="flex items-center mb-2">
                                                        <label
                                                            htmlFor="section-name"
                                                            className="mr-2"
                                                        >
                                                            Year:
                                                        </label>
                                                        <select
                                                            value={
                                                                editSectionYear
                                                            }
                                                            onChange={(e) => {
                                                                const newYear =
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                        10
                                                                    );
                                                                setEditSectionYear(
                                                                    newYear
                                                                );
                                                            }}
                                                            className="select select-bordered"
                                                        >
                                                            {[7, 8, 9, 10].map(
                                                                (year) => (
                                                                    <option
                                                                        key={
                                                                            year
                                                                        }
                                                                        value={
                                                                            year
                                                                        }
                                                                    >
                                                                        {year}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </div>

                                                    {/* Section Shift */}
                                                    <div className="mt-2">
                                                        <label className="mr-2">
                                                            Shift:
                                                        </label>
                                                        <label className="mr-2">
                                                            <input
                                                                type="radio"
                                                                value={
                                                                    editSectionShift
                                                                }
                                                                checked={
                                                                    editSectionShift ===
                                                                    0
                                                                }
                                                                onChange={() => {
                                                                    setEditSectionShift(
                                                                        0
                                                                    ); // PM shift
                                                                    setEditSectionStartTime(
                                                                        '06:00 AM'
                                                                    ); // Reset to default AM start time
                                                                }}
                                                            />
                                                            AM
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                value={
                                                                    editSectionShift
                                                                }
                                                                checked={
                                                                    editSectionShift ===
                                                                    1
                                                                }
                                                                onChange={() => {
                                                                    setEditSectionShift(
                                                                        1
                                                                    ); // PM shift
                                                                    setEditSectionStartTime(
                                                                        '01:00 PM'
                                                                    ); // Reset to default PM start time
                                                                }}
                                                            />
                                                            PM
                                                        </label>
                                                    </div>

                                                    {/* Section Start Time (AM or PM) */}
                                                    <div>
                                                        <label>
                                                            Start Time:
                                                        </label>
                                                        <select
                                                            value={
                                                                editSectionStartTime
                                                            }
                                                            onChange={(e) =>
                                                                setEditSectionStartTime(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                        >
                                                            {renderTimeOptions()}
                                                        </select>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-base font-bold">
                                                        {`${section.year} -  ${section.section}`}
                                                    </div>
                                                    <div className="mt-1">
                                                        {`(${
                                                            programs[
                                                                section.program
                                                            ]?.program
                                                        })`}
                                                    </div>
                                                    <div className="flex items-center mt-2">
                                                        <span className="inline-block bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-lg">
                                                            {section.shift === 0
                                                                ? 'AM'
                                                                : 'PM'}
                                                        </span>
                                                        <span className="ml-2 text-sm font-medium">
                                                            {getTimeSlotString(
                                                                section.startTime
                                                            )}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </td>

                                        {/* Adviser */}
                                        <td>
                                            {editSectionId === section.id ? (
                                                <select
                                                    className="select select-bordered w-full"
                                                    value={editSectionAdviser}
                                                    onChange={(e) =>
                                                        setEditSectionAdviser(
                                                            parseInt(
                                                                e.target.value,
                                                                10
                                                            )
                                                        )
                                                    }
                                                >
                                                    <option value="" disabled>
                                                        Assign an adviser
                                                    </option>
                                                    {Object.keys(teachers).map(
                                                        (key) => (
                                                            <option
                                                                key={
                                                                    teachers[
                                                                        key
                                                                    ].id
                                                                }
                                                                value={
                                                                    teachers[
                                                                        key
                                                                    ].id
                                                                }
                                                            >
                                                                {
                                                                    teachers[
                                                                        key
                                                                    ].teacher
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            ) : (
                                                teachers[section.teacher]
                                                    ?.teacher ||
                                                'Unknown Teacher'
                                            )}
                                        </td>

                                        {/* Subject Details */}
                                        <td className="flex gap-1 flex-wrap">
                                            <div className="overflow-x-auto mt-2">
                                                <table className="min-w-full bg-white border border-gray-300">
                                                    <thead>
                                                        <tr>
                                                            <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">
                                                                Subject
                                                            </th>
                                                            <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">
                                                                Duration (min)
                                                            </th>
                                                            <th className="py-2 px-4 border-b border-gray-200 font-normal text-left">
                                                                Weekly Minutes
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Array.isArray(
                                                            section.subjects
                                                        ) &&
                                                        section.subjects
                                                            .length > 0 ? (
                                                            section.subjects.map(
                                                                (
                                                                    subjectID,
                                                                    index
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="border-b border-gray-200"
                                                                    >
                                                                        {/* Subject Name */}
                                                                        <td className="py-2 px-4 border-b border-gray-200">
                                                                            {subjects[
                                                                                subjectID
                                                                            ]
                                                                                .subject ||
                                                                                'Unknown Subject, ID: ' +
                                                                                    subjectID}
                                                                        </td>

                                                                        {/* Duration */}
                                                                        <td className="py-2 px-4 border-b border-gray-200">
                                                                            {subjects[
                                                                                subjectID
                                                                            ]
                                                                                .classDuration ||
                                                                                ''}
                                                                        </td>

                                                                        {/* Weekly Minutes */}
                                                                        <td className="py-2 px-4 border-b border-gray-200">
                                                                            {subjects[
                                                                                subjectID
                                                                            ]
                                                                                .weeklyMinutes ||
                                                                                ''}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan="4"
                                                                    className="py-2 px-4 text-center border-b border-gray-200"
                                                                >
                                                                    No subjects
                                                                    selected
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>

                                                {editSectionId ===
                                                section.id ? (
                                                    <div className="p-2 flex justify-center">
                                                        <button
                                                            className="btn"
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        `assign_fixed_sched_modal_section(${section.id})-grade(${editSectionYear})`
                                                                    )
                                                                    .showModal()
                                                            }
                                                        >
                                                            View Fixed Schedules
                                                        </button>

                                                        <FixedScheduleMaker
                                                            key={
                                                                editSectionYear
                                                            }
                                                            viewingMode={0}
                                                            isForSection={true}
                                                            pvs={1}
                                                            section={section.id}
                                                            grade={
                                                                editSectionYear
                                                            }
                                                            selectedSubjects={
                                                                editSectionSubjects
                                                            }
                                                            fixedDays={
                                                                editSectionFixedDays
                                                            }
                                                            // totalTimeslot={
                                                            //     sectionTotalTimeslot[
                                                            //         section.id
                                                            //     ]
                                                            // }
                                                            setFixedDays={
                                                                setEditSectionFixedDays
                                                            }
                                                            fixedPositions={
                                                                editSectionFixedPositions
                                                            }
                                                            setFixedPositions={
                                                                setEditSectionFixedPositions
                                                            }
                                                            numOfSchoolDays={
                                                                numOfSchoolDays
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="p-2 flex justify-center">
                                                        <button
                                                            className="btn"
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        `assign_fixed_sched_modal_section(${section.id})-grade(${section.year})`
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
                                                            selectedSubjects={
                                                                section.subjects ||
                                                                []
                                                            }
                                                            fixedDays={
                                                                section.fixedDays ||
                                                                {}
                                                            }
                                                            // totalTimeslot={
                                                            //     sectionTotalTimeslot[
                                                            //         section.id
                                                            //     ]
                                                            // }
                                                            fixedPositions={
                                                                section.fixedPositions ||
                                                                {}
                                                            }
                                                            numOfSchoolDays={
                                                                numOfSchoolDays
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            {editSectionId === section.id ? (
                                                <> 
                                                    <div
                                                        key={`edit-add-sched-edit-section(${editSectionId})`}
                                                        className='mt-2 overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg'
                                                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#a0aec0 #edf2f7' }} // Optional for styled scrollbars
                                                    >
                                                        <div
                                                            className='flex flex-wrap'
                                                            style={{
                                                                position: 'sticky',
                                                                top: 0,
                                                                zIndex: 1,
                                                                backgroundColor: 'white',
                                                            }}
                                                        >
                                                            <div
                                                                className='w-9/12 font-bold p-2 border-b border-gray-300'
                                                                
                                                            >
                                                                Grade {editSectionYear}
                                                            </div>
                                                            <div
                                                                className='w-3/12 flex justify-center items-center border-b border-gray-300'
                                                            >
                                                                <button
                                                                    className='w-3/4 bg-green-700 m-2 font-bold text-white rounded-lg hover:bg-green-500'
                                                                    onClick={handleAddAdditionalSchedule}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {
                                                            editAdditionalScheds.map((sched, index) => (
                                                                <div
                                                                    key={index}
                                                                    className='flex flex-wrap'
                                                                >
                                                                    <button
                                                                        className='w-1/12 border rounded-l-lg bg-blue-200 hover:bg-blue-100 flex items-center justify-center'
                                                                        onClick={() => handleDeleteAdditionalSchedule(index)}
                                                                    >
                                                                        <RiDeleteBin7Line
                                                                            size={15}
                                                                        />
                                                                    </button>
                                                                    <div
                                                                        className='w-10/12'
                                                                    >
                                                                        <button
                                                                            className="w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-gray-200"
                                                                            onClick={() => document
                                                                                .getElementById(
                                                                                    `add_additional_sched_modal_1_grade-${editSectionYear}_sec-${editSectionId}_idx-${index}`
                                                                                )
                                                                                .showModal()}
                                                                        >
                                                                            {sched.name || sched.subject ? (
                                                                                // Content to show when both are not empty
                                                                                <>
                                                                                    <p>Name: {sched.name}</p>
                                                                                    <p>Subject: {sched.subject === 0 ? 'N/A' : subjects[sched.subject].subject}</p>
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
                                                                    <div
                                                                        className='w-1/12 text-xs font-bold rounded-r-lg bg-blue-200 hover:bg-blue-100 flex text-center justify-center items-center p-2 cursor-pointer'
                                                                    >
                                                                        <button
                                                                            onClick={() => document
                                                                                .getElementById(
                                                                                    `add_additional_sched_modal_0_grade-${editSectionYear}_sec-${editSectionId}_idx-${index}`
                                                                                )
                                                                                .showModal()}
                                                                        >
                                                                            <RiEdit2Fill
                                                                                size={15}
                                                                            />
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
                                                            )
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div
                                                        key={`edit-add-sched-view-section(${section.id})`}
                                                        className='overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg'
                                                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#a0aec0 #edf2f7' }} // Optional for styled scrollbars
                                                    >
                                                        <div
                                                            className='font-bold p-2 border-b border-gray-300 bg-gray-300'
                                                            style={{
                                                                position: 'sticky',
                                                                top: 0,
                                                                zIndex: 1,
                                                            }}
                                                        >
                                                        </div>
                                                        {
                                                        section.additionalScheds.map((sched, index) => (
                                                            <div
                                                                key={index}
                                                                className='flex flex-wrap'
                                                            >
                                                                <div
                                                                    className='w-1/12 text-xs font-bold bg-blue-100 flex text-center justify-center items-center p-2'
                                                                >
                                                                    {index + 1}
                                                                </div>
                                                                <div
                                                                    className='w-11/12'
                                                                >
                                                                    <button
                                                                        className="w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-white"
                                                                        onClick={() => document
                                                                            .getElementById(
                                                                                `add_additional_sched_modal_1_grade-${section.year}_sec-${section.id}_idx-${index}`
                                                                            )
                                                                            .showModal()}
                                                                    >
                                                                        {sched.name || sched.subject ? (
                                                                            // Content to show when both are not empty
                                                                            <>
                                                                                <p>Name: {sched.name}</p>
                                                                                <p>Subject: {sched.subject === 0 ? 'N/A' : subjects[sched.subject].subject}</p>
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
                                                            )
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </td>

                                        {editable && (
                                        <td className="w-28 text-right">
                                            {editSectionId === section.id ? (
                                            <>
                                                <button
                                                className="btn btn-xs btn-ghost text-green-500"
                                                onClick={() => handleSaveSectionEditClick(section.id)}
                                                >
                                                Save
                                                </button>
                                                <button
                                                className="btn btn-xs btn-ghost text-red-500"
                                                onClick={() => handleCancelSectionEditClick()}
                                                >
                                                Cancel
                                                </button>
                                            </>
                                            ) : (
                                            <>
                                                <button
                                                className="btn btn-xs btn-ghost text-blue-500"
                                                onClick={() => handleEditSectionClick(section)}
                                                >
                                                <RiEdit2Fill />
                                                </button>
                                                <button
                                                className="btn btn-xs btn-ghost text-red-500"
                                                onClick={() => deleteModal(section.id)} // Call deleteModal with the section.id
                                                >
                                                <RiDeleteBin7Line />
                                                </button>

                                                        <dialog
                                                            id="delete_modal"
                                                            className="modal modal-bottom sm:modal-middle"
                                                        >
                                                            <form
                                                                method="dialog"
                                                                className="modal-box"
                                                            >
                                                                <div className="flex flex-col items-center justify-center">
                                                                    <TrashIcon
                                                                        className="text-red-500 mb-4"
                                                                        width={
                                                                            40
                                                                        }
                                                                        height={
                                                                            40
                                                                        }
                                                                    />
                                                                    <h3 className="font-bold text-lg text-center">
                                                                        Are you
                                                                        sure you
                                                                        want to
                                                                        delete
                                                                        this
                                                                        section?
                                                                    </h3>
                                                                    <p className="text-sm text-gray-500 text-center">
                                                                        This
                                                                        action
                                                                        cannot
                                                                        be
                                                                        undone.
                                                                    </p>
                                                                </div>
                                                                <div className="modal-action flex justify-center">
                                                                    <button
                                                                        className="btn btn-sm btn-ghost"
                                                                        onClick={() =>
                                                                            document
                                                                                .getElementById(
                                                                                    'delete_modal'
                                                                                )
                                                                                .close()
                                                                        }
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        id="delete_button"
                                                                        className="btn btn-sm btn-error text-white"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        </dialog>
                                                    </>
                                                )}
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
