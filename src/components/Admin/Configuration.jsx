import React, { useState, useEffect } from 'react';

function Configuration({
    numOfSchoolDays,
    setNumOfSchoolDays,
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

    const handleNumOfSchoolDaysChange = (e) => {
        const newValue = parseInt(e.target.value, 10);
        setNumOfSchoolDays(newValue);
    };

    const generateTimeOptions = (startHour, endHour, isMorning) => {
        const times = [];
        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 10) {
                const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const period = isMorning ? 'AM' : 'PM';
                times.push(`${formattedTime} ${period}`);
            }
        }
        return times;
    };

    useEffect(() => {
        localStorage.setItem('defaultSubjectClassDuration', defaultSubjectClassDuration);
    }, [defaultSubjectClassDuration]);

    useEffect(() => {
        localStorage.setItem('morningStartTime', morningStartTime);
    }, [morningStartTime]);

    useEffect(() => {
        localStorage.setItem('afternoonStartTime', afternoonStartTime);
    }, [afternoonStartTime]);

    return (
        <div className="mb-10">
            <h1 className="divider text-xl font-bold">Configuration</h1>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Number of Days in Week */}
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Number of Days in Week</span>
                    </label>
                    <input
                        type="number"
                        placeholder="e.g., 5 (Mon-Fri)"
                        className="input input-bordered w-full"
                        value={numOfSchoolDays}
                        onChange={handleNumOfSchoolDaysChange}
                        max={7}
                    />
                </div>

                {/* Default Class Duration */}
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Default Class Duration</span>
                    </label>
                    <select
                        className="select select-bordered w-full"
                        value={defaultSubjectClassDuration}
                        onChange={(e) => setDefaultSubjectClassDuration(parseInt(e.target.value, 10))}
                    >
                        {Array.from({ length: 12 }, (_, index) => (index + 1) * 10).map(duration => (
                            <option key={duration} value={duration}>
                                {duration} mins
                            </option>
                        ))}
                    </select>
                </div>

                {/* Morning Start Time */}
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Morning Start Time</span>
                    </label>
                    <select
                        className="select select-bordered w-full"
                        value={morningStartTime}
                        onChange={(e) => setMorningStartTime(e.target.value)}
                    >
                        {generateTimeOptions(6, 11, true).map(time => (
                            <option key={time} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Afternoon Start Time */}
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Afternoon Start Time</span>
                    </label>
                    <select
                        className="select select-bordered w-full"
                        value={afternoonStartTime}
                        onChange={(e) => setAfternoonStartTime(e.target.value)}
                    >
                        {generateTimeOptions(1, 8, false).map(time => (
                            <option key={time} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <h1 className="divider"></h1>
        </div>
    );
}

export default Configuration;
