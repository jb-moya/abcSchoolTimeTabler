import React, { useState, useEffect } from 'react';

function Configuration() {
    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        // Load from local storage if available
        return localStorage.getItem('numOfSchoolDays') || 5;
    });
    const [defaultSubjectClassDuration, setDefaultSubjectClassDuration] = useState(() => {
        return localStorage.getItem('defaultSubjectClassDuration') || 10;
    });
    const [morningStartTime, setMorningStartTime] = useState(() => {
        return localStorage.getItem('morningStartTime') || '06:00 AM';
    });
    const [afternoonStartTime, setAfternoonStartTime] = useState(() => {
        return localStorage.getItem('afternoonStartTime') || '01:00 PM';
    });

    const generateTimeOptions = (startHour, endHour) => {
        const times = [];
        for (let hour = startHour; hour <= endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 10) {
            if (hour === 8 && minute > 0) {
              continue;
            }
    
            const formattedTime = `${String(hour).padStart(2, '0')}:${String(
              minute
            ).padStart(2, '0')}`;
            const period = startHour === 6 ? 'AM' : 'PM';
            times.push(`${formattedTime} ${period}`);
          }
        }
        return times;
    };

    useEffect(() => {
        localStorage.setItem('numOfSchoolDays', numOfSchoolDays);
    }, [numOfSchoolDays]);

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
        //   Configuration
        <div className="mb-10">
            <h1 className="divider">Configuration</h1>
            <div className="flex flex-col gap-2">
                <div className="join border border-base-content">
                <div className="join-item px-2"> Number of Days in week</div>
                <input
                    type="number"
                    placeholder="eg. 5 (mon to fri)"
                    className="input w-full join-item"
                    value={numOfSchoolDays}
                    onChange={(e) => {
                    setNumOfSchoolDays(e.target.value);
                    }}
                />
                </div>
                <div className="join border border-base-content">
                <div className="join-item px-2">Default class duration:</div>
                <select
                    className="select w-full join-item"
                    value={defaultSubjectClassDuration}
                    onChange={(e) => {
                    setDefaultSubjectClassDuration(parseInt(e.target.value, 10));
                    }}
                >
                    {Array.from({ length: 12 }, (_, index) => (index + 1) * 10).map(
                    (duration) => (
                        <option key={duration} value={duration}>
                        {duration} mins
                        </option>
                    )
                    )}
                </select>
                </div>

                <div>
                <label>Morning Start Time:</label>
                <select
                    value={morningStartTime}
                    onChange={(e) => {
                    const newValue = e.target.value;
                    setMorningStartTime(newValue);
                    console.log(typeof newValue);
                    }}
                >
                    {generateTimeOptions(6, 11).map((time) => (
                    <option key={time} value={time}>
                        {time}
                    </option>
                    ))}
                </select>
                </div>
                <div>
                <label>Afternoon Start Time:</label>
                <select
                    value={afternoonStartTime}
                    onChange={(e) => {
                    const newValue = e.target.value;
                    setAfternoonStartTime(newValue);
                    console.log(typeof newValue);
                    }}
                >
                    {generateTimeOptions(1, 8).map((time) => (
                    <option key={time} value={time}>
                        {time}
                    </option>
                    ))}
                </select>
                </div>
            </div>
            <h1 className="divider"></h1>
        </div>
    )
}

export default Configuration;