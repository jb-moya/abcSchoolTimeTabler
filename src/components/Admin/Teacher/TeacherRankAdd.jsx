import { useState, useEffect, useRef } from 'react';

import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';

import { toast } from 'sonner';
import AdditionalScheduleForTeacherRank from './AdditionalScheduleForTeacherRank';

import { addDocument } from '../../../hooks/CRUD/addDocument';

const AddTeacherRankContainer = ({
    // STORES
    ranks,
    // STORES
    close,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    numOfSchoolDays,
}) => {

    const inputNameRef = useRef();

// =============================================================================================================

    const [rankValue, setRankValue] = useState('');
    const [additionalRankScheds, setAdditionalRankScheds] = useState([]);

// ============================================================================================================

    const handleAddRank = () => {

        if (!rankValue.trim()) {
            setErrorMessage('All fields are required.');
            if (rankValue === '') {
                setErrorField('rank');
            } else {
                setErrorField('load');
            }
            return;
        }

        const duplicateRank = Object.values(ranks).find((r) => r.rank.trim().toLowerCase() === rankValue.trim().toLowerCase());

        if (duplicateRank) {
            setErrorMessage('Rank already exists.');
            setErrorField('rank');
            return;
        }

        try {
            addDocument('ranks', {
                rank: rankValue,
                additionalRankScheds: additionalRankScheds,
            });
        } catch (error) {
            console.error('Error adding rank:', error);
        } finally {
            toast.success('Rank added successfully', {
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
        //         rank: rankValue,
        //         additionalRankScheds: additionalRankScheds,
        //     })
        // );

    };

    const handleAddTeacherAdditionalSchedules = () => {
        setAdditionalRankScheds((prevScheds) => [
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
        setAdditionalRankScheds((prevScheds) => prevScheds.filter((_, i) => i !== index));
    };

    const handleReset = () => {
        setErrorField('');
        setErrorMessage('');

        setRankValue('');
        setAdditionalRankScheds([]);
    };

    // useEffect(() => {
    // 	console.log('additionalRankScheds', additionalRankScheds);
    // }, [additionalRankScheds]);

    // useEffect(() => {
    //     if (rankStatus === 'idle') {
    //         dispatch(fetchRanks());
    //     }
    // }, [rankStatus, dispatch]);

    // useEffect(() => {
    //     if (subjectStatus === 'idle') {
    //         dispatch(fetchSubjects());
    //     }
    // }, [subjectStatus, dispatch]);

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    return (
        <div className='justify-left'>
            <div className='flex justify-center mb-4'>
                <h3 className='text-xl font-bold'>Add New Rank</h3>
            </div>

            <hr className='mb-4'></hr>

            {/* Rank Name */}
            <div className='mb-4'>
                <label className='block text-sm font-medium mb-1' htmlFor='rankName'>
                    Rank Name:
                </label>
                <input
                    id='rankName'
                    type='text'
                    className={`input input-bordered w-full ${errorField === 'rank' ? 'border-red-500' : ''}`}
                    value={rankValue}
                    onChange={(e) => setRankValue(e.target.value)}
                    placeholder='Enter rank name'
                    aria-label='Rank Name'
                    ref={inputNameRef}
                />
            </div>

            <div className='p-4 border rounded-lg shadow-md'>
                <div className='text-lg font-semibold rounded-lg'> Additional Teacher Schedules</div>
                <b> (Optional) </b>:
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
                    {additionalRankScheds.map((sched, index) => (
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
                                            <p>Subject: {'N/A'}</p>
                                        </>
                                    ) : (
                                        // Content to show when either is empty
                                        <p className='text-sm'>Untitled Schedule {index + 1}</p>
                                    )}
                                </button>
                                <AdditionalScheduleForTeacherRank
                                    viewingMode={1}
                                    teacherID={0}
                                    arrayIndex={index}
                                    additionalSchedsOfTeacher={sched}
                                />
                            </div>
                            <div className='w-1/12 flex items-center justify-center border rounded-r-lg hover:bg-gray-200'>
                                <button
                                     onClick={() =>
                                        document.getElementById(`add_additional_sched_modal_0_tr-0_idx-${index}`).showModal()
                                    }
                                >
                                    <RiEdit2Fill size={15} />
                                </button>
                                <AdditionalScheduleForTeacherRank
                                    viewingMode={0}
                                    rankID={0}
                                    arrayIndex={index}
                                    numOfSchoolDays={numOfSchoolDays}
                                    additionalSchedsOfRank={sched}
                                    setAdditionalScheds={setAdditionalRankScheds}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {errorMessage && <p className='text-red-500 text-sm my-4 font-medium select-none '>{errorMessage}</p>}

            <div className='flex justify-center gap-2 mt-4'>
                <button className='btn btn-primary' onClick={handleAddRank}>
                    Add Rank
                </button>
                <button className='btn btn-error' onClick={handleReset}>
                    Reset
                </button>
            </div>
        </div>
    );
};

export default AddTeacherRankContainer;
