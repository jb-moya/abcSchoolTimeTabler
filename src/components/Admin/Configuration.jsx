import { useState, useEffect } from 'react';
import TimeSelector from '@utils/timeSelector';
import { useSelector } from 'react-redux';
import { useEditDocument } from '../../hooks/firebaseCRUD/useEditDocument';
import { COLLECTION_ABBREVIATION } from '../../constants';
import LoadingButton from '../LoadingButton';
import { BiInfoCircle } from 'react-icons/bi';

const configuration_invalid_values_code = {
    minimum_workload_above_maximum: 'Minimum workload cannot be greater than maximum workload',
    minimum_workload_below_lower_bound: 'Minimum workload cannot be less than or equal to zero',
    maximum_workload_less_than_minimum: 'Maximum workload cannot be less than minimum workload',
    maximum_workload_less_than_zero: 'Maximum workload cannot be less than or equal to zero',
    max_abc_iteration_less_than_zero: 'Max iteration of ABC algorithm cannot be less than or equal to zero',
    max_abc_iteration_greater_than_max: 'Max iteration of ABC algorithm cannot be greater than 10,000,000',
};
// import ModifyTimetable from '@features/admin/modify-timetable';

function Configuration() {
    const { editDocument, loading: isEditLoading, error: editError } = useEditDocument();

    const { configurations, loading } = useSelector((state) => state.configuration);
    const { user: currentUser } = useSelector((state) => state.user);

    const [editMode, setEditMode] = useState(false);
    const [tempValues, setTempValues] = useState({});

    const [validationError, setValidationErrors] = useState('');

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

    const [defaultABCMaxIteration, setDefaultABCMaxIteration] = useState(() => {
        return defaultValues.defaultABCMaxIteration || 10000;
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
            setDefaultABCMaxIteration(configurations[1].defaultABCMaxIteration || 10000);
        }
    }, [configurations]);

    const timeInterval = 5;
    const workloadInterval = 100;
    const minWorkloadBound = 0;
    const maxDuration = 1000;
    const minNumOfSchoolDays = 1;
    const maxNumOfSchoolDays = 7;
    const maxABCIteration = 10000000;

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

    const handleChangeMaxABCIteration = (e) => {
        const value = parseInt(e.target.value, 10);
        setDefaultABCMaxIteration(value);
    };

    const handleChangeMinTeachingLoad = (e) => {
        let value = parseInt(e.target.value, 10);

        // if (value < 100) {
        //     value = 100;
        // } else if (value > defaultMaximumTeachingLoad) {
        //     value = defaultMaximumTeachingLoad;
        // }

        setDefaultMinimumTeachingLoad(value);
    };

    const handleChangeMaxTeachingLoad = (e) => {
        const value = parseInt(e.target.value, 10);
        // if (value >= defaultMinimumTeachingLoad) {
        setDefaultMaximumTeachingLoad(value);
        // }
    };

    const handleChangeNumOfSchoolDays = (e) => {
        const value = parseInt(e.target.value, 10);
        // if (value >= minNumOfSchoolDays && value <= maxNumOfSchoolDays) {
        setDefaultNumberOfSchoolDays(value);
        // }
    };

    const handleSetTempValues = () => {
        setTempValues({
            defaultClassDuration: defaultClassDuration,
            morningStartTime: defaultMorningStart,
            afternoonStartTime: defaultAfternoonStart,
            minTeachingLoad: defaultMinimumTeachingLoad,
            maxTeachingLoad: defaultMaximumTeachingLoad,
            defaultNumOfSchoolDays: defaultNumberOfSchoolDays,
            defaultBreakTimeDuration: defaultBreakTimeDuration,
            defaultABCMaxIteration: defaultABCMaxIteration,
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
        setDefaultABCMaxIteration(tempValues.defaultABCMaxIteration);
        setEditMode(false);
        setValidationErrors('');
    };

    const handleConfirm = async () => {
        try {
            if (defaultMinimumTeachingLoad > defaultMaximumTeachingLoad) {
                throw new Error(configuration_invalid_values_code.minimum_workload_above_maximum);
            } else if (defaultMinimumTeachingLoad <= minWorkloadBound) {
                throw new Error(configuration_invalid_values_code.minimum_workload_below_lower_bound);
            } else if (defaultMaximumTeachingLoad < defaultMinimumTeachingLoad) {
                throw new Error(configuration_invalid_values_code.maximum_workload_less_than_minimum);
            } else if (defaultMaximumTeachingLoad <= minWorkloadBound) {
                throw new Error(configuration_invalid_values_code.maximum_workload_less_than_zero);
            } else if (defaultABCMaxIteration <= 0) {
                throw new Error(configuration_invalid_values_code.max_abc_iteration_less_than_zero);
            } else if (defaultABCMaxIteration > maxABCIteration) {
                throw new Error(configuration_invalid_values_code.max_abc_iteration_greater_than_max);
            }

            await editDocument({
                collectionName: 'timetableConfiguration',
                collectionAbbreviation: COLLECTION_ABBREVIATION.TIMETABLE_CONFIGURATIONS,
                userName: currentUser?.username || 'unknown user',
                itemName: 'Timetable Configuration',
                docId: 1,
                entryData: {
                    defaultClassDuration: defaultClassDuration,
                    defaultMorningStart: defaultMorningStart,
                    defaultAfternoonStart: defaultAfternoonStart,
                    defaultMinimumTeachingLoad: defaultMinimumTeachingLoad,
                    defaultMaximumTeachingLoad: defaultMaximumTeachingLoad,
                    defaultNumberOfSchoolDays: defaultNumberOfSchoolDays,
                    defaultBreakTimeDuration: defaultBreakTimeDuration,
                    defaultABCMaxIteration: defaultABCMaxIteration,
                },
            });

            setEditMode(false);
        } catch (error) {
            setValidationErrors(error.message);
        }
    };

    if (loading) {
        console.log('Loading timetable configuration...');
        return <div>Loading configuration...</div>;
    }

    return (
        <div className='mb-10 px-6'>
            <h1 className='divider text-2xl font-bold text-center mb-10'>Configuration</h1>

            <div>
                {validationError && (
                    <div className='mb-4'>
                        <div className='alert alert-error shadow-lg'>
                            <div>
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    className='stroke-current flex-shrink-0 h-6 w-6'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth='2'
                                        d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                            </div>
                            <div className='flex flex-col gap-2'>
                                <div>
                                    <span>{validationError}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className='grid sm:grid-cols-2 grid-cols-1 gap-6 text-left'>
                <div className='flex flex-col gap-2'>
                    <div className='flex flex-row form-control items-center'>
                        <label className='w-[350px] label'>Number of Days in a Week (fixed)</label>
                        <label className='input input-sm w-[350px] input-bordered flex gap-2'>
                            <input
                                type='number'
                                placeholder='e.g., 5 (Mon-Fri)'
                                className='font-semibold w-full disabled:text-base-content'
                                value={loading ? 'Loading...' : defaultNumberOfSchoolDays}
                                onChange={handleChangeNumOfSchoolDays}
                                max={maxNumOfSchoolDays}
                                min={minNumOfSchoolDays}
                                disabled={true}
                            />
                            <span className='opacity-60'>days</span>
                        </label>
                    </div>

                    <div className='flex flex-row form-control items-center'>
                        <label className='w-[350px] label'>Default Class Duration</label>
                        <label className='input input-sm w-[350px] input-bordered flex gap-2'>
                            <input
                                type='number'
                                placeholder='Default class duration (mins)'
                                className='font-semibold w-full disabled:text-base-content'
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

                    <div className='flex flex-row form-control items-center'>
                        <label className='w-[350px] label'>Break Time Duration</label>
                        <label className='input input-sm w-[350px] input-bordered flex gap-2'>
                            <input
                                type='number'
                                placeholder='Break Time Duration'
                                className='font-semibold w-full disabled:text-base-content'
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

                    <div className='flex flex-row form-control items-center'>
                        <label className='w-[350px] label flex justify-start gap-2'>
                            <span>Max Timetable Generation Iteration</span>
                            <span
                                className='tooltip'
                                data-tip='
                                The maximum number of iterations for the ABC algorithm to generate a timetable. 
                                The algorithm will stop generating timetables if it reaches this number of iterations.
                                Higher value means longer computation time, but potentially better timetables.'
                            >
                                <BiInfoCircle size={20} className='opacity-60' />
                            </span>
                        </label>
                        <label className='input input-sm w-[350px] input-bordered flex gap-2'>
                            <input
                                type='number'
                                placeholder='Max Timetable Generation Iteration'
                                className='font-semibold w-full disabled:text-base-content'
                                value={loading ? 'Loading...' : defaultABCMaxIteration}
                                onChange={(e) => handleChangeMaxABCIteration(e, setDefaultABCMaxIteration)}
                                max={maxABCIteration}
                                min={0}
                                step={1}
                                disabled={!editMode || loading}
                            />
                            <span className='opacity-60'>mins</span>
                        </label>
                    </div>
                </div>

                <div className='flex flex-col gap-2'>
                    <div className='flex flex-row form-control items-center'>
                        <label className='w-[350px] label'>Morning Start Times</label>
                        <label className='flex items-center gap-2'>
                            <div className='w-[200px]'>
                                <TimeSelector
                                    key='morningStartTime'
                                    interval={timeInterval}
                                    time={loading ? 'Loading...' : defaultMorningStart}
                                    setTime={setDefaultMorningStart}
                                    disabled={!editMode || loading}
                                />
                            </div>
                        </label>
                    </div>

                    <div className='flex flex-row form-control items-center'>
                        <label className='w-[350px] label'>Afternoon Start Times</label>
                        <label className='flex items-center gap-2'>
                            <div className='w-[200px]'>
                                <TimeSelector
                                    key='afternoonStartTime'
                                    interval={timeInterval}
                                    time={loading ? 'Loading...' : defaultAfternoonStart}
                                    setTime={setDefaultAfternoonStart}
                                    disabled={!editMode || loading}
                                />
                            </div>
                        </label>
                    </div>

                    <div className='flex flex-row form-control items-center'>
                        <label className='w-[350px] label font-medium'>Minimum Teaching Load</label>
                        <div className='flex flex-col sm:flex-row gap-4'>
                            <div className='flex-1'>
                                <div className='w-[200px]'>
                                    <label className='input input-sm input-bordered flex gap-2'>
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
                        </div>
                    </div>

                    <div className='flex flex-row form-control items-center'>
                        <label className='w-[350px] label font-medium'>Maximum Teaching Load</label>
                        <div className='flex-1'>
                            <div className='w-[200px]'>
                                <label className='input input-sm input-bordered flex gap-2'>
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

                    <div className='flex justify-end mb-4'>
                        {!editMode ? (
                            <button className='btn btn-primary' onClick={handleEdit}>
                                Edit
                            </button>
                        ) : (
                            <div className='flex gap-2'>
                                <LoadingButton
                                    onClick={handleConfirm}
                                    disabled={isEditLoading}
                                    isLoading={isEditLoading}
                                    loadingText='Changing ...'
                                    className='btn btn-primary'
                                >
                                    Confirm Changes
                                </LoadingButton>

                                <button className='btn btn-secondary' onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className='divider mt-10'></div>
        </div>
    );
}

export default Configuration;
