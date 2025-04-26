import { useState, useEffect, useRef } from 'react';

import SearchableDropdownToggler from '../searchableDropdown';

import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import AdditionalScheduleForTeacher from './AdditionalScheduleForTeacher';

import { useAddDocument } from '../../../hooks/firebaseCRUD/useAddDocument';

import { toast } from 'sonner';
import { COLLECTION_ABBREVIATION } from '../../../constants';
import { useSelector } from 'react-redux';
import LoadingButton from '../../LoadingButton';

const AddTeacherContainer = ({
    // STORES
    teachers,
    subjects,
    ranks,
    departments,
    // STORES
    close,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays = 5,
}) => {
    const { addDocument, loading: isAddLoading, error: addError } = useAddDocument();


    const inputNameRef = useRef();

    const { user: currentUser } = useSelector((state) => state.user);

    const [teacherName, setTeacherName] = useState('');

    const [teacherRank, setTeacherRank] = useState(null);

    const [teacherDepartment, setTeacherDepartment] = useState(null);

    const [selectedSubjects, setSelectedSubjects] = useState([]);

    const [assignedYearLevels, setAssignedYearLevels] = useState([]);

    const [additionalTeacherScheds, setAdditionalTeacherScheds] = useState([]);

    // =============================================================================================================

    const handleAddTeacher = async () => {
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
            (teacher) => teacher.teacher.trim().toLowerCase() === teacherName.trim().toLowerCase()
        );

        if (duplicateTeacher) {
            setErrorField('name');
            setErrorMessage('Teacher already exists.');
            return;
        }

        try {
            const schedules = additionalTeacherScheds.map((sched) => ({
                n: sched.name,
                su: sched.subject,
                d: sched.duration,
                f: sched.frequency,
                sh: sched.shown,
                t: sched.time,
            }));

            await addDocument({
                collectionName: 'teachers',
                collectionAbbreviation: COLLECTION_ABBREVIATION.TEACHERS,
                userName: currentUser?.username || 'unknown user',
                itemName: teacherName || 'an item',
                entryData: {
                    t: teacherName,
                    r: teacherRank,
                    d: teacherDepartment,
                    s: selectedSubjects,
                    y: assignedYearLevels,
                    at: schedules,
                },
            });
        } catch (error) {
            console.error('Error adding teacher:', error);
        } finally {
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
        }

        // dispatch(
        //     reduxFunction({
        //         teacher: teacherName,
        //         rank: teacherRank,
        //         department: teacherDepartment,
        //         subjects: selectedSubjects,
        //         yearLevels: assignedYearLevels,
        //         additionalTeacherScheds: additionalTeacherScheds,
        //     })
        // );
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
                subject: -1,
                duration: 60,
                frequency: 1,
                shown: true,
                time: 72,
            },
        ]);
    };

    const handleDeleteTeacherAdditionalSchedule = (index) => {
        setAdditionalTeacherScheds((prevScheds) => prevScheds.filter((_, i) => i !== index));
    };

    // ============================================================================================================

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
        console.log('ranks: ', ranks);

        if (teacherRank) {
            console.log('teacherRank: ', teacherRank);

            const rank = Object.values(ranks).find((rank) => rank.id === teacherRank);

            console.log('rank: ', rank);

            if (rank) {
                setAdditionalTeacherScheds(rank.additionalRankScheds);
            }
        }
    }, [teacherRank]);

    // =============================================================================================================

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    // ============================================================================================================

    return (
        <div className='justify-left'>
            <div className='flex justify-center mb-4'>
                <h3 className='text-xl font-bold'>Add New Teacher</h3>
            </div>

            <hr className=''></hr>

            <div className='rounded-lg shadow-md md:shadow-lg sm:shadow-sm space-y-4 mb-4 p-4'>
                {/* Teacher Name */}
                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-1' htmlFor='teacherName'>
                        Teacher Name:
                    </label>
                    <input
                        id='teacherName'
                        type='text'
                        className={`input input-bordered w-full ${errorField === 'name' ? 'border-red-500' : ''}`}
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder='Enter teacher name'
                        aria-label='Teacher Name'
                        ref={inputNameRef}
                    />
                </div>

                {/* Teacher Rank */}
                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-1' htmlFor='teacherRank'>
                        Select Rank:
                    </label>
                    <div className='relative'>
                        <select
                            id='teacherRank'
                            className='select select-bordered w-full'
                            value={teacherRank || ''}
                            onChange={handleRankChange}
                        >
                            <option value='' disabled>
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
                </div>

                {/* Departments */}
                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-1' htmlFor='teacherDepartment'>
                        Select Department:
                    </label>
                    <div className='relative'>
                        <select
                            id='teacherDepartment'
                            className='select select-bordered w-full'
                            value={teacherDepartment || ''}
                            onChange={handleDepartmentChange}
                        >
                            <option value='' disabled>
                                Select department
                            </option>
                            {departments && Object.keys(departments).length > 0 ? (
                                Object.values(departments).map((department) => (
                                    <option key={department.id} value={department.id}>
                                        {`${department.name || ''}${
                                            teachers[department.head]?.teacher ? ` - ${teachers[department.head]?.teacher}` : ''
                                        }`}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No departments available</option>
                            )}
                        </select>
                    </div>
                </div>

                {/* Assigning of Subjects and Grade Levels to Teach */}
                <div className='flex flex-wrap mb-4 '>
                    {/* Subjects Section */}
                    <div className='w-full sm:w-1/2 p-2'>
                        <div className='rounded-lg border p-4 shadow-md'>
                            <h4 className='font-semibold text-sm text-left'>Subjects</h4>
                            <hr className='my-2'></hr>
                            <SearchableDropdownToggler selectedList={selectedSubjects} setSelectedList={setSelectedSubjects} />
                            <div className='mt-2'>
                                <p className='font-medium text-left text-sm mb-2'>Selected Subjects:</p>
                                {selectedSubjects.length === 0 ? (
                                    <p className='text-gray-500 text-left text-sm'>No selected subject</p>
                                ) : (
                                    <div className='flex flex-wrap gap-2'>
                                        {selectedSubjects.map((subjectID) => (
                                            <span
                                                key={subjectID}
                                                className='bg-secondary text-white text-sm px-2 py-1 rounded-lg'
                                            >
                                                {subjects[subjectID].subject}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grade Levels */}
                    <div className='w-full sm:w-1/2 p-2'>
                        <div className='rounded-lg border p-4 shadow-md'>
                            <h4 className='font-semibold text-sm text-left '>Grade Levels</h4>
                            <hr className='my-2'></hr>
                            <div className='grid grid-cols-2 gap-2 mt-2 text-sm'>
                                {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map((grade, index) => (
                                    <label key={index} className='flex items-center gap-2'>
                                        <input
                                            type='checkbox'
                                            checked={assignedYearLevels.includes(index)}
                                            onChange={() => handleYearLevelChange(index)}
                                        />
                                        {grade}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Schedules */}
            <div className='p-4 border rounded-lg shadow-md'>
                <div className='text-lg font-semibold rounded-lg'>Additional Teacher Schedules</div>
                <hr className='my-2'></hr>

                {/* Button to add schedules */}
                <button
                    onClick={handleAddTeacherAdditionalSchedules}
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
                    {additionalTeacherScheds.map((sched, index) => (
                        <div key={index} className='flex flex-wrap'>
                            <button
                                className='w-1/12 border rounded-l-lg hover:bg-gray-200 flex items-center justify-center'
                                onClick={() => handleDeleteTeacherAdditionalSchedule(index)}
                            >
                                <RiDeleteBin7Line size={15} />
                            </button>
                            <div className='w-10/12'>
                                <button
                                    className='w-full bg-gray-100 p-2 border shadow-sm hover:bg-gray-200'
                                    onClick={() =>
                                        document.getElementById(`add_additional_sched_modal_1_teacher-0_idx-${index}`).showModal()
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
                                        <p className='text-sm'>Untitled Schedule {index + 1}</p>
                                    )}
                                </button>
                                <AdditionalScheduleForTeacher
                                    subjects={subjects}
                                    viewingMode={1}
                                    teacherID={0}
                                    arrayIndex={index}
                                    additionalSchedsOfTeacher={sched}
                                />
                            </div>
                            <div className='w-1/12 flex items-center justify-center border rounded-r-lg hover:bg-gray-200'>
                                <button
                                    onClick={() =>
                                        document.getElementById(`add_additional_sched_modal_0_teacher-0_idx-${index}`).showModal()
                                    }
                                >
                                    <RiEdit2Fill size={15} />
                                </button>
                                <AdditionalScheduleForTeacher
                                    subjects={subjects}
                                    viewingMode={0}
                                    teacherID={0}
                                    arrayIndex={index}
                                    teacherSubjects={selectedSubjects}
                                    numOfSchoolDays={numOfSchoolDays}
                                    additionalSchedsOfTeacher={sched}
                                    setAdditionalScheds={setAdditionalTeacherScheds}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {errorMessage && <p className='text-red-500 text-sm my-4 font-medium select-none '>{errorMessage}</p>}

            <div className='flex justify-center gap-2 mt-4'>
                <LoadingButton
                    onClick={handleAddTeacher}
                    isLoading={isAddLoading}
                    loadingText='Adding Teacher...'
                    disabled={isAddLoading}
                    className='btn btn-primary'
                >
                    Add Teacher
                </LoadingButton>

                <button className='btn btn-error' onClick={handleReset}>
                    Reset
                </button>
            </div>
        </div>
    );
};

export default AddTeacherContainer;
