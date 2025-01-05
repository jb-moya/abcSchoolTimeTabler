import React, { useState, useEffect } from 'react';
import TimeSelector from '@utils/timeSelector';

function Configuration({
    numOfSchoolDays,
    setNumOfSchoolDays,
    breakTimeDuration,
    setBreakTimeDuration,
}) {

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

    
    return (
        <div className="mb-10">
            <h1 className="divider text-xl font-bold">Configuration</h1>

            <div className="flex flex-wrap">

                {/* Number of Days in Week */}
                <div className="p-2 form-control w-1/4 mb-1">
                    <label className="label">
                        <span className="label-text font-bold">NUMBER OF DAYS IN A WEEK</span>
                    </label>
                    <input
                        type="number"
                        placeholder="e.g., 5 (Mon-Fri)"
                        className="input input-bordered w-3/4"
                        value={numOfSchoolDays}
                        onChange={(e) => {
                            const value = e.target.value;
                            setNumOfSchoolDays(value);
                        }}
                        max={7}
                    />
                </div>

                {/* Default Class Duration */}
                <div className="p-2 form-control w-1/4 mb-1">
                    <label className="label">
                        <span className="label-text font-bold">DEFAULT CLASS DURATION (mins)</span>
                    </label>
                    <input
                        type="number"
                        placeholder="Default class duration (mins)"
                        className="input input-bordered w-3/4"
                        value={defaultSubjectClassDuration}
                        onChange={(e) => {
                            const value = e.target.value;
                            setDefaultSubjectClassDuration(value);
                        }}
                        max={120}
                        step={10}
                    />
                </div>

                {/* Morning Start Time */}
                <div className="p-2 form-control w-1/4 mb-1">
                    <label className="label">
                        <span className="label-text font-bold">MORNING START TIME</span>
                    </label>
                    <div
                        className='w-3/4 h-full'
                    >
                        <TimeSelector 
                            key={`morningStartTime`}
                            interval={5}
                            time={morningStartTime}
                            setTime={setMorningStartTime}
                        />
                    </div>
                </div>

                {/* Afternoon Start Time */}
                <div className="p-2 form-control w-1/4 mb-1">
                    <label className="label">
                        <span className="label-text font-bold">AFTERNOON START TIME</span>
                    </label>
                    <div
                        className='w-3/4 h-full'
                    >   
                        <TimeSelector 
                            key={`afternoonStartTime`}
                            interval={5}
                            time={afternoonStartTime}
                            setTime={setAfternoonStartTime}
                        />
                    </div>
                </div>
                
                {/* Teaching Load */}
                <div className="p-2 form-control w-1/3 mb-1">
                    <label className="label">
                        <span className="label-text font-bold">TEACHING LOAD</span>
                    </label>
                    <div className="flex flex-wrap justify-between items-center">
                        {/* Minimum */}
                        <div className="flex flex-col items-start w-1/2 pr-2">
                            <label className="mb-1 text-xs">Minimum</label>
                            <input
                                type="number"
                                placeholder="e.g., 1300"
                                className="input input-bordered w-full"
                                value={minTeachingLoad}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setMinTeachingLoad(value);
                                }}
                                max={maxTeachingLoad}
                                step={100}
                            />
                        </div>

                        {/* Maximum */}
                        <div className="flex flex-col items-start w-1/2 pl-2">
                            <label className="mb-1 text-xs">Maximum</label>
                            <input
                                type="number"
                                placeholder="e.g., 1800"
                                className="input input-bordered w-full"
                                value={maxTeachingLoad}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setMaxTeachingLoad(value); 
                                }}
                                min={minTeachingLoad}
                                step={100}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Break Time Duration */}
                <div className="p-2 form-control w-1/4 mb-1 ml-5">
                    <label className="label">
                        <span className="label-text font-bold">BREAK TIME DURATION (mins)</span>
                    </label>
                    <input
                        type="number"
                        placeholder="Break Time Duration"
                        className="input input-bordered w-3/4"
                        value={breakTimeDuration}
                        onChange={(e) => {
                            const value = e.target.value;
                            setBreakTimeDuration(value);
                        }}
                        max={100}
                        step={5}
                    />
                </div>


            </div>

            <h1 className="divider"></h1>
        </div>
    );
}

export default Configuration;
