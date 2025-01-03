import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchSubjects } from '@features/subjectSlice';
import { fetchRanks } from '@features/rankSlice';
import { fetchDepartments } from '@features/departmentSlice';
import SearchableDropdownToggler from '../searchableDropdown';

import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import AdditionalScheduleForTeacher from './AdditionalScheduleForTeacher';

import { toast } from 'sonner';

const AddTeacherContainer = ({
    close,
    reduxFunction,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays,
}) => {
    const inputNameRef = useRef();

    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );

    const { ranks, status: rankStatus } = useSelector((state) => state.rank);

    const { departments, status: departmentStatus } = useSelector(
        (state) => state.department
    );

    const { teachers } = useSelector((state) => state.teacher);

    const dispatch = useDispatch();

    const [teacherName, setTeacherName] = useState('');
    const [teacherRank, setTeacherRank] = useState(null);
    const [teacherDepartment, setTeacherDepartment] = useState(null);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [assignedYearLevels, setAssignedYearLevels] = useState([]);
    const [additionalTeacherScheds, setAdditionalTeacherScheds] = useState([]);

    const handleAddTeacher = () => {
        if (!teacherName.trim()) {
            setErrorMessage('Teacher name cannot be empty.');
            setErrorField('name');
            return;
        } else if (teacherRank === null) {
            setErrorMessage('Please assign teacher rank.');
            setErrorField('rank');
            return;
        } else if (teacherDepartment === null) {
            setErrorMessage('Please assign teacher department.');
            setErrorField('department');
            return;
        } else if (selectedSubjects.length === 0) {
            setErrorMessage('Please assign subject specialization(s).');
            setErrorField('specialization');
            return;
        } else if (assignedYearLevels.length === 0) {
            setErrorMessage('Please assign year level assignment(s).');
            setErrorField('assignment');
            return;
        }

        const duplicateTeacher = Object.values(teachers).find(
            (teacher) =>
                teacher.teacher.trim().toLowerCase() ===
                teacherName.trim().toLowerCase()
        );

        if (duplicateTeacher) {
            setErrorField('name');
            setErrorMessage('Teacher already exists.');
            return;
        } else {
            dispatch(
                reduxFunction({
                    teacher: teacherName,
                    rank: teacherRank,
                    department: teacherDepartment,
                    subjects: selectedSubjects,
                    yearLevels: assignedYearLevels,
                    additionalTeacherScheds: additionalTeacherScheds,
                })
            );
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

    const handleRankChange = (event) => {
        setTeacherRank(parseInt(event.target.value));
    };

    const handleDepartmentChange = (event) => {
        setTeacherDepartment(parseInt(event.target.value));
    };

    const handleYearLevelChange = (yearLevel) => {
        setAssignedYearLevels((prevLevels) => {
            if (prevLevels.includes(yearLevel)) {
                return prevLevels.filter((level) => level !== yearLevel);
            } else {
                return [...prevLevels, yearLevel];
            }
        });
    };

    const handleAddTeacherAdditionalSchedules = () => {
        setAdditionalTeacherScheds((prevScheds) => [
            ...prevScheds,
            {
                name: '',
                subject: 0,
                duration: 60,
                frequency: 1,
                shown: true,
                time: 72,
            },
        ]);
    };

    const handleDeleteTeacherAdditionalSchedule = (index) => {
        setAdditionalTeacherScheds((prevScheds) =>
            prevScheds.filter((_, i) => i !== index)
        );
    };

    const handleReset = () => {
        setErrorField('');
        setErrorMessage('');
        setTeacherName('');
        setTeacherDepartment(null);
        setSelectedSubjects([]);
        setAssignedYearLevels([]);
        setTeacherRank(null);
    };

    useEffect(() => {
        if (teacherRank) {
            const rank = Object.values(ranks).find(
                (rank) => rank.id === teacherRank
            );

            if (rank) {
                setAdditionalTeacherScheds(rank.additionalRankScheds);
            }
        }
    }, [teacherRank]);

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (subjectStatus === 'idle') {
            dispatch(fetchSubjects());
        }
    }, [dispatch, subjectStatus]);

    useEffect(() => {
        if (rankStatus === 'idle') {
            dispatch(fetchRanks());
        }
    }, [dispatch, rankStatus]);

    useEffect(() => {
        if (departmentStatus === 'idle') {
            dispatch(fetchDepartments());
        }
    }, [dispatch, departmentStatus]);

    return (
        <div className="justify-left">
            <div className="flex justify-center mb-4">
                <h3 className="text-xl font-bold">Add New Teacher</h3>
            </div>

            {/* Teacher Name */}
            <div className="mb-4">
                <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="teacherName"
                >
                    Teacher Name:
                </label>
                <input
                    id="teacherName"
                    type="text"
                    className={`input input-bordered w-2/3 ${
                        errorField === 'name' ? 'border-red-500' : ''
                    }`}
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Enter teacher name"
                    aria-label="Teacher Name"
                    ref={inputNameRef}
                />
            </div>

            {/* Teacher Rank */}
            <div className="mb-4">
                <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="teacherRank"
                >
                    Select Rank:
                </label>
                <select
                    id="teacherRank"
                    className="input input-bordered w-2/3"
                    value={teacherRank || ''}
                    onChange={handleRankChange}
                >
                    <option value="" disabled>
                        Select rank
                    </option>
                    {ranks && Object.keys(ranks).length > 0 ? (
                        Object.values(ranks).map((rank) => (
                            <option key={rank.id} value={rank.id}>
                                {rank.rank}
                            </option>
                        ))
                    ) : (
                        <option disabled>No ranks available</option>
                    )}
                </select>
            </div>

            {/* Departments */}
            <div className="mb-4">
                <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="teacherDepartment"
                >
                    Select Department:
                </label>
                <select
                    id="teacherDepartment"
                    className="input input-bordered w-2/3"
                    value={teacherDepartment || ''}
                    onChange={handleDepartmentChange}
                >
                    <option value="" disabled>
                        Select department
                    </option>
                    {departments && Object.keys(departments).length > 0 ? (
                        Object.values(departments).map((department) => (
                            <option key={department.id} value={department.id}>
                                {`${department.name || ''}${
                                    teachers[department.head]?.teacher
                                        ? ` - ${
                                              teachers[department.head]?.teacher
                                          }`
                                        : ''
                                }`}
                            </option>
                        ))
                    ) : (
                        <option disabled>No departments available</option>
                    )}
                </select>
            </div>

            {/* Assigning of Subjects and Grade Levels to Teach */}
            <div className="flex flex-wrap mb-4">
                <div className="w-1/2 flex flex-col items-center justify-center">
                    <div className="w-5/6 flex flex-wrap bg-gray-200 rounded-t-lg">
                        <div className="w-5/12 flex items-center justify-center font-bold">
                            Subjects
                        </div>
                        <div>
                            <SearchableDropdownToggler
                                selectedList={selectedSubjects}
                                setSelectedList={setSelectedSubjects}
                            />
                        </div>
                    </div>
                    <div className="w-5/6 p-2 border border-gray-200 rounded-b-lg ">
                        <div className="flex flex-wrap gap-2 p-1 bg-gray-100">
                            {selectedSubjects.length === 0 ? (
                                <span className="w-full text-gray-500 mt-1">
                                    No subjects selected
                                </span>
                            ) : (
                                selectedSubjects.map((subjectID) => (
                                    <div
                                        key={subjectID}
                                        className="p-1 bg-green-700 text-white rounded-lg"
                                    >
                                        {subjects[subjectID].subject}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="w-1/2 flex justify-center">
                    <div className="w-5/6">
                        <div className="p-2 font-bold bg-gray-200 rounded-t-lg">
                            Grade Levels to Teach
                        </div>
                        <div className="flex flex-col items-center justify-center border border-gray-200 rounded-b-lg">
                            <div className="w-1/3 flex justify-start">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={assignedYearLevels.includes(0)}
                                        onChange={() =>
                                            handleYearLevelChange(0)
                                        }
                                    />
                                    Grade 7
                                </label>
                            </div>

                            <div className="w-1/3 flex justify-start">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={assignedYearLevels.includes(1)}
                                        onChange={() =>
                                            handleYearLevelChange(1)
                                        }
                                    />
                                    Grade 8
                                </label>
                            </div>

                            <div className="w-1/3 flex justify-start">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={assignedYearLevels.includes(2)}
                                        onChange={() =>
                                            handleYearLevelChange(2)
                                        }
                                    />
                                    Grade 9
                                </label>
                            </div>

                            <div className="w-1/3 flex justify-start">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={assignedYearLevels.includes(3)}
                                        onChange={() =>
                                            handleYearLevelChange(3)
                                        }
                                    />
                                    Grade 10
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center p-1 rounded-lg">
                <div className="w-2/3 p-1 block text-sm font-medium">
                    Additional Teacher Schedules
                    <b> (Optional) </b>:
                </div>

                <div className="mt-2 w-2/3 h-auto flex justify-end items-center border border-gray-300 rounded-t-lg">
                    {/* Button to add schedules */}
                    <button
                        onClick={handleAddTeacherAdditionalSchedules}
                        className="font-bold items-right text-xs m-1 bg-blue-900 text-white px-2 py-1 rounded-lg hover:bg-blue-600"
                    >
                        + Add Schedule
                    </button>
                </div>

                <div
                    className="overflow-y-auto w-2/3 min-h-5 max-h-36 border border-gray-300 rounded-b-lg"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#a0aec0 #edf2f7',
                    }} // Optional for styled scrollbars
                >
                    {additionalTeacherScheds.map((sched, index) => (
                        <div key={index} className="flex flex-wrap">
                            <button
                                className="w-1/12 border rounded-l-lg hover:bg-gray-200 flex items-center justify-center"
                                onClick={() =>
                                    handleDeleteTeacherAdditionalSchedule(index)
                                }
                            >
                                <RiDeleteBin7Line size={15} />
                            </button>
                            <div className="w-10/12">
                                <button
                                    className="w-full bg-gray-100 p-2 border shadow-sm hover:bg-gray-200"
                                    onClick={() =>
                                        document
                                            .getElementById(
                                                `add_additional_sched_modal_1_teacher-0_idx-${index}`
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
                                                {sched.subject === 0
                                                    ? 'N/A'
                                                    : subjects[sched.subject]
                                                          .subject}
                                            </p>
                                        </>
                                    ) : (
                                        // Content to show when either is empty
                                        <p>Untitled Schedule {index + 1}</p>
                                    )}
                                </button>
                                <AdditionalScheduleForTeacher
                                    viewingMode={1}
                                    teacherID={0}
                                    arrayIndex={index}
                                    additionalSchedsOfTeacher={sched}
                                />
                            </div>
                            <div className="w-1/12  flex items-center justify-center border rounded-r-lg hover:bg-gray-200">
                                <button
                                    onClick={() =>
                                        document
                                            .getElementById(
                                                `add_additional_sched_modal_0_teacher-0_idx-${index}`
                                            )
                                            .showModal()
                                    }
                                >
                                    <RiEdit2Fill size={15} />
                                </button>
                                <AdditionalScheduleForTeacher
                                    viewingMode={0}
                                    teacherID={0}
                                    arrayIndex={index}
                                    teacherSubjects={selectedSubjects}
                                    numOfSchoolDays={numOfSchoolDays}
                                    additionalSchedsOfTeacher={sched}
                                    setAdditionalScheds={
                                        setAdditionalTeacherScheds
                                    }
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {errorMessage && (
                <p className="text-red-500 text-sm my-4 font-medium select-none ">
                    {errorMessage}
                </p>
            )}

            <div className="flex justify-center gap-2 mt-4">
                <button
                    className="btn btn-primary"
                    onClick={handleAddTeacher}
                >
                    Add Teacher
                </button>
                <button className="btn btn-error" onClick={handleReset}>
                    Reset
                </button>
            </div>

        </div>
    );
};

export default AddTeacherContainer;
