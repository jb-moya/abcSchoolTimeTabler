import React, { useState, useEffect } from 'react';
import SubjectListContainer from '@components/Admin/SubjectListContainer';
import ProgramListContainer from '@components/Admin/ProgramListContainer';

function Subject() {
  const [numOfSchoolDays, setNumOfSchoolDays] = useState(5);
  const [defaultSubjectClassDuration, setDefaultSubjectClassDuration] =
    useState(10);
  const [morningStartTime, setMorningStartTime] = useState('06:00 AM');
  const [afternoonStartTime, setAfternoonStartTime] = useState('01:00 PM');

  // Scope and Limitations
  // Room-Section Relationship: Each room is uniquely assigned to a specific subject, establishing a 1:1 relationship.
  // Due to this strict pairing, room allocation is not a factor in timetable generation.

  // Curriculum-Driven Course Selection: Students are required to follow a predefined curriculum.
  // They do not have the option to select subjects independently.

  // Standardized Class Start and Break Times: The start time for the first class and the timing of breaks are
  // standardized across all sections and teachers, ensuring uniformity in the daily schedule.

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
    console.log(`Morning Start Time changed to: ${morningStartTime}`);
  }, [morningStartTime]);

  useEffect(() => {
    console.log(`Afternoon Start Time changed to: ${afternoonStartTime}`);
  }, [afternoonStartTime]);
  return (
    <div className="App container mx-auto px-4 mb-10">
      {/* Configuration */}
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

      {/* Table */}

      <div className="flex gap-4">
        <div className="w-6/12">
          <SubjectListContainer
            defaultSubjectClassDuration={defaultSubjectClassDuration}
          />
        </div>
        <div className="w-6/12">
          <ProgramListContainer
            morningStartTime={morningStartTime}
            afternoonStartTime={afternoonStartTime}
          />
        </div>
      </div>
    </div>
  );
}

export default Subject;
