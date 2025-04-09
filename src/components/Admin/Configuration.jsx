import { useState, useEffect } from 'react';
import TimeSelector from '@utils/timeSelector';
import { setMaxTeacherLoad, setMinTeacherLoad } from '@features/configurationSlice';
import { useDispatch, useSelector } from 'react-redux';
import { editDocument } from '../../hooks/CRUD/editDocument';

function Configuration() {
    const dispatch = useDispatch();

    const { configurations, loading } = useSelector((state) => state.configuration);

    const [editMode, setEditMode] = useState(false);
    const [tempValues, setTempValues] = useState({});

    const defaultValues = configurations[1] || {};

    const [defaultNumberOfSchoolDays, setDefaultNumberOfSchoolDays] = useState(() => {
        return defaultValues.defaultNumberOfSchoolDays || 5;
    });

    const [defaultBreakTimeDuration, setDefaultBreakTimeDuration] = useState(() => {
        return defaultValues.defaultBreakTimeDuration || 10;
    });

    const [defaultClassDuration, setDefaultClassDuration] = useState(() => {
        return defaultValues.defaultClassDuration || 10;
    });

    const [defaultMorningStart, setDefaultMorningStart] = useState(() => {
        return defaultValues.defaultMorningStart || '06:00 AM';
    });

    const [defaultAfternoonStart, setDefaultAfternoonStart] = useState(() => {
        return defaultValues.defaultAfternoonStart || '01:00 PM';
    });

    const [defaultMinimumTeachingLoad, setDefaultMinimumTeachingLoad] = useState(() => {
        return defaultValues.defaultMinimumTeachingLoad || 1300;
    });

    const [defaultMaximumTeachingLoad, setDefaultMaximumTeachingLoad] = useState(() => {
        return defaultValues.defaultMaximumTeachingLoad || 1800;
    });

    useEffect(() => {
        if (configurations) {
            setDefaultNumberOfSchoolDays(configurations[1].defaultNumOfSchoolDays || 5);
            setDefaultBreakTimeDuration(configurations[1].defaultBreakTimeDuration || 10);
            setDefaultClassDuration(configurations[1].defaultClassDuration || 10);
            setDefaultMorningStart(configurations[1].defaultMorningStart || '06:00 AM');
            setDefaultAfternoonStart(configurations[1].defaultAfternoonStart || '01:00 PM');
            setDefaultMinimumTeachingLoad(configurations[1].defaultMinimumTeachingLoad || 1300);
            setDefaultMaximumTeachingLoad(configurations[1].defaultMaximumTeachingLoad || 1800);
        }
    }, [configurations]);

    const timeInterval = 5;
    const workloadInterval = 100;
    const minWorkloadBound = 100;
    const maxDuration = 1000;
    const minNumOfSchoolDays = 1;
    const maxNumOfSchoolDays = 7;

    const handleChangeDefaultSubjectClassDuration = (e, setter) => {
        const value = parseInt(e.target.value, 10);
        if (value >= timeInterval && value <= maxDuration) {
            setter(value);
        } else if (value < timeInterval) {
            setter(timeInterval);
        } else if (value > maxDuration) {
            setter(maxDuration);
        }
    };

    const handleChangeMinTeachingLoad = (e) => {
        let value = parseInt(e.target.value, 10);

        if (value < 100) {
            value = 100;
        } else if (value > defaultMaximumTeachingLoad) {
            value = defaultMaximumTeachingLoad;
        }

        setDefaultMinimumTeachingLoad(value);
        dispatch(setMinTeacherLoad(value));
    };

    const handleChangeMaxTeachingLoad = (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= defaultMinimumTeachingLoad) {
            setDefaultMaximumTeachingLoad(value);
            dispatch(setMaxTeacherLoad(value));
        }
    };

    const handleChangeNumOfSchoolDays = (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= minNumOfSchoolDays && value <= maxNumOfSchoolDays) {
            setDefaultNumberOfSchoolDays(value);
        }
    };

    const handleSetTempValues = () => {
        setTempValues({
            defaultClassDuration,
            morningStartTime: defaultMorningStart,
            afternoonStartTime: defaultAfternoonStart,
            defaultMinimumTeachingLoad,
            defaultMaximumTeachingLoad,
            defaultNumOfSchoolDays: defaultNumberOfSchoolDays,
            defaultBreakTimeDuration,
        });
    };

    const handleEdit = () => {
        handleSetTempValues();
        setEditMode(true);
    };

    const handleCancel = () => {
        setDefaultClassDuration(tempValues.defaultClassDuration);
        setDefaultMorningStart(tempValues.morningStartTime);
        setDefaultAfternoonStart(tempValues.afternoonStartTime);
        setDefaultMinimumTeachingLoad(tempValues.minTeachingLoad);
        setDefaultMaximumTeachingLoad(tempValues.maxTeachingLoad);
        setDefaultNumberOfSchoolDays(tempValues.defaultNumOfSchoolDays);
        setDefaultBreakTimeDuration(tempValues.defaultBreakTimeDuration);
        setEditMode(false);
    };

    const handleConfirm = () => {
        editDocument('timetableConfiguration', 1, {
            defaultClassDuration: defaultClassDuration,
            defaultMorningStart: defaultMorningStart,
            defaultAfternoonStart: defaultAfternoonStart,
            defaultMinimumTeachingLoad: defaultMinimumTeachingLoad,
            defaultMaximumTeachingLoad: defaultMaximumTeachingLoad,
            defaultNumberOfSchoolDays: defaultNumberOfSchoolDays,
            defaultBreakTimeDuration: defaultBreakTimeDuration,
        });
        setEditMode(false);
    };

    if (loading) {
        console.log('Loading timetable configuration...');
        return <div>Loading configuration...</div>;
    }

    return (
        <div className='mb-10 px-6'>
            <h1 className='divider text-2xl font-bold text-center mb-10'>Configuration</h1>

            <div className='flex justify-end mb-4'>
                {!editMode ? (
                    <button className='btn btn-primary' onClick={handleEdit}>
                        Edit
                    </button>
                ) : (
                    <div className='flex gap-2'>
                        <button className='btn btn-primary' onClick={handleConfirm}>
                            Confirm Changes
                        </button>
                        <button className='btn btn-secondary' onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <div className='grid grid-cols-1 gap-6'>
                <div className='flex flex-row form-control'>
                    <label className='w-[250px] label font-medium'>Number of Days in a Week</label>
                    <div className='w-[200px]'>
                        <input
                            type='number'
                            placeholder='e.g., 5 (Mon-Fri)'
                            className='input input-bordered disabled:text-base-content w-full'
                            value={loading ? 'Loading...' : defaultNumberOfSchoolDays}
                            onChange={handleChangeNumOfSchoolDays}
                            max={maxNumOfSchoolDays}
                            min={minNumOfSchoolDays}
                            disabled={!editMode || loading}
                        />
                    </div>
                </div>

                <div className='flex flex-row form-control'>
                    <label className='w-[250px] label font-medium'>Default Class Duration</label>
                    <div className='w-[200px]'>
                        <label className='input input-bordered flex items-center gap-2'>
                            <input
                                type='number'
                                placeholder='Default class duration (mins)'
                                className='w-full disabled:text-base-content'
                                value={loading ? 'Loading...' : defaultClassDuration}
                                onChange={(e) => handleChangeDefaultSubjectClassDuration(e, setDefaultClassDuration)}
                                max={maxDuration}
                                min={timeInterval}
                                step={timeInterval}
                                disabled={!editMode || loading}
                            />
                            <span className='opacity-60'>mins</span>
                        </label>
                    </div>
                </div>

                <div className='flex flex-row form-control'>
                    <label className='w-[250px] label font-medium'>Break Time Duration</label>
                    <div className='w-[200px]'>
                        <label className='input input-bordered flex items-center gap-2'>
                            <input
                                type='number'
                                placeholder='Break Time Duration'
                                className='w-full disabled:text-base-content'
                                value={loading ? 'Loading...' : defaultBreakTimeDuration}
                                onChange={(e) => handleChangeDefaultSubjectClassDuration(e, setDefaultBreakTimeDuration)}
                                max={maxDuration}
                                min={timeInterval}
                                step={timeInterval}
                                disabled={!editMode || loading}
                            />
                            <span className='opacity-60'>mins</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 gap-6 mt-6'>
                <div className='flex flex-row form-control'>
                    <label className='w-[250px] label font-medium'>Start Times</label>
                    <div className='w-[400px] flex flex-col sm:flex-row gap-4'>
                        <div className='flex-1'>
                            <label className='label text-sm'>Morning</label>
                            <div className='w-[200px]'>
                                <TimeSelector
                                    key='morningStartTime'
                                    interval={timeInterval}
                                    time={loading ? 'Loading...' : defaultMorningStart}
                                    setTime={setDefaultMorningStart}
                                    disabled={!editMode || loading}
                                />
                            </div>
                        </div>
                        <div className='flex-1'>
                            <label className='label text-sm'>Afternoon</label>
                            <div className='w-[200px]'>
                                <TimeSelector
                                    key='afternoonStartTime'
                                    interval={timeInterval}
                                    time={loading ? 'Loading...' : defaultAfternoonStart}
                                    setTime={setDefaultAfternoonStart}
                                    disabled={!editMode || loading}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex flex-row form-control'>
                    <label className='w-[250px] label font-medium'>Teaching Load</label>
                    <div className='w-[400px] flex flex-col sm:flex-row gap-4'>
                        <div className='flex-1'>
                            <label className='label text-sm'>Minimum</label>
                            <div className='w-[200px]'>
                                <label className='input input-bordered flex items-center gap-2'>
                                    <input
                                        type='number'
                                        placeholder='e.g., 1300'
                                        className='w-full disabled:text-base-content'
                                        value={loading ? 'Loading...' : defaultMinimumTeachingLoad}
                                        onChange={handleChangeMinTeachingLoad}
                                        max={defaultMaximumTeachingLoad}
                                        min={minWorkloadBound}
                                        step={workloadInterval}
                                        disabled={!editMode || loading}
                                    />
                                    <span className='opacity-60'>mins</span>
                                </label>
                            </div>
                        </div>
                        <div className='flex-1'>
                            <label className='label text-sm'>Maximum</label>
                            <div className='w-[200px]'>
                                <label className='input input-bordered flex items-center gap-2'>
                                    <input
                                        type='number'
                                        placeholder='e.g., 1800'
                                        className='w-full disabled:text-base-content'
                                        value={loading ? 'Loading...' : defaultMaximumTeachingLoad}
                                        onChange={handleChangeMaxTeachingLoad}
                                        min={defaultMinimumTeachingLoad}
                                        step={workloadInterval}
                                        disabled={!editMode || loading}
                                    />
                                    <span className='opacity-60'>mins</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='divider mt-10'></div>
        </div>
    );
}

export default Configuration;
