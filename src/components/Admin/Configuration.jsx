import React, { useState, useEffect } from 'react';
import TimeSelector from '@utils/timeSelector';
import { setMaxTeacherLoad, setMinTeacherLoad } from '@features/configurationSlice';
import { useDispatch } from 'react-redux';

function Configuration({ numOfSchoolDays, setNumOfSchoolDays, breakTimeDuration, setBreakTimeDuration }) {
    const dispatch = useDispatch();

    const [defaultSubjectClassDuration, setDefaultSubjectClassDuration] = useState(() => {
        return localStorage.getItem('defaultSubjectClassDuration') || 10;
    });

    const [morningStartTime, setMorningStartTime] = useState(() => {
        return localStorage.getItem('morningStartTime') || '06:00 AM';
    });

    const [afternoonStartTime, setAfternoonStartTime] = useState(() => {
        return localStorage.getItem('afternoonStartTime') || '01:00 PM';
    });

    const [minTeachingLoad, setMinTeachingLoad] = useState(() => {
        return localStorage.getItem('minTeachingLoad') || 1300;
    });

    const [maxTeachingLoad, setMaxTeachingLoad] = useState(() => {
        return localStorage.getItem('maxTeachingLoad') || 1800;
    });

    useEffect(() => {
        localStorage.setItem('numOfSchoolDays', numOfSchoolDays);
    }, [numOfSchoolDays]);

    useEffect(() => {
        localStorage.setItem('breakTimeDuration', breakTimeDuration);
    }, [breakTimeDuration]);

    useEffect(() => {
        localStorage.setItem('defaultSubjectClassDuration', defaultSubjectClassDuration);
    }, [defaultSubjectClassDuration]);

    useEffect(() => {
        localStorage.setItem('morningStartTime', morningStartTime);
    }, [morningStartTime]);

    useEffect(() => {
        localStorage.setItem('afternoonStartTime', afternoonStartTime);
    }, [afternoonStartTime]);

    useEffect(() => {
        localStorage.setItem('minTeachingLoad', minTeachingLoad);
    }, [minTeachingLoad]);

    useEffect(() => {
        localStorage.setItem('maxTeachingLoad', maxTeachingLoad);
    }, [maxTeachingLoad]);

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
        } else if (value > maxTeachingLoad) {
            value = maxTeachingLoad;
        } 

        setMinTeachingLoad(value);
        dispatch(setMinTeacherLoad(value));
    };

    const handleChangeMaxTeachingLoad = (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= minTeachingLoad) {
            setMaxTeachingLoad(value);
            dispatch(setMaxTeacherLoad(value));
        }
    };

    const handleChangeNumOfSchoolDays = (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= minNumOfSchoolDays && value <= maxNumOfSchoolDays) {
            setNumOfSchoolDays(value);
        }
    };

    return (
        <div className="mb-10 px-6">
        <h1 className="divider text-2xl font-bold text-center mb-10">Configuration</h1>
    
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Number of Days in Week */}
            <div className="form-control">
                <label className="label font-medium">Number of Days in a Week</label>
                <input
                    type="number"
                    placeholder="e.g., 5 (Mon-Fri)"
                    className="input input-bordered w-full"
                    value={numOfSchoolDays}
                    onChange={handleChangeNumOfSchoolDays}
                    max={maxNumOfSchoolDays}
                    min={minNumOfSchoolDays}
                />
            </div>
    
            {/* Default Class Duration */}
            <div className="form-control">
                <label className="label font-medium">Default Class Duration (mins)</label>
                <input
                    type="number"
                    placeholder="Default class duration (mins)"
                    className="input input-bordered w-full"
                    value={defaultSubjectClassDuration}
                    onChange={(e) => handleChangeDefaultSubjectClassDuration(e, setDefaultSubjectClassDuration)}
                    max={maxDuration}
                    min={timeInterval}
                    step={timeInterval}
                />
            </div>
    
            {/* Break Time Duration */}
            <div className="form-control">
                <label className="label font-medium">Break Time Duration (mins)</label>
                <input
                    type="number"
                    placeholder="Break Time Duration"
                    className="input input-bordered w-full"
                    value={breakTimeDuration}
                    onChange={(e) => handleChangeDefaultSubjectClassDuration(e, setBreakTimeDuration)}
                    max={maxDuration}
                    min={timeInterval}
                    step={timeInterval}
                />
            </div>
        </div>
    
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            {/* Start Times */}
            <div className="form-control">
                <label className="label font-medium">Start Times</label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="label text-sm">Morning</label>
                        <TimeSelector
                            key="morningStartTime"
                            interval={timeInterval}
                            time={morningStartTime}
                            setTime={setMorningStartTime}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="label text-sm">Afternoon</label>
                        <TimeSelector
                            key="afternoonStartTime"
                            interval={timeInterval}
                            time={afternoonStartTime}
                            setTime={setAfternoonStartTime}
                        />
                    </div>
                </div>
            </div>
    
            {/* Teaching Load */}
            <div className="form-control">
                <label className="label font-medium">Teaching Load</label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="label text-sm">Minimum</label>
                        <input
                            type="number"
                            placeholder="e.g., 1300"
                            className="input input-bordered w-full"
                            value={minTeachingLoad}
                            onChange={handleChangeMinTeachingLoad}
                            max={maxTeachingLoad}
                            min={minWorkloadBound}
                            step={workloadInterval}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="label text-sm">Maximum</label>
                        <input
                            type="number"
                            placeholder="e.g., 1800"
                            className="input input-bordered w-full"
                            value={maxTeachingLoad}
                            onChange={handleChangeMaxTeachingLoad}
                            min={minTeachingLoad}
                            step={workloadInterval}
                        />
                    </div>
                </div>
            </div>
        </div>
    
        <div className="divider mt-10"></div>
    </div>
    
    
    );
}

export default Configuration;
