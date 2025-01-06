import React, { useState, useEffect } from "react";
import TimeSelector from "@utils/timeSelector";

function Configuration({
  numOfSchoolDays,
  setNumOfSchoolDays,
  breakTimeDuration,
  setBreakTimeDuration,
}) {
  const [defaultSubjectClassDuration, setDefaultSubjectClassDuration] = useState(() => {
    return localStorage.getItem("defaultSubjectClassDuration") || 10;
  });

  const [morningStartTime, setMorningStartTime] = useState(() => {
    return localStorage.getItem("morningStartTime") || "06:00 AM";
  });

  const [afternoonStartTime, setAfternoonStartTime] = useState(() => {
    return localStorage.getItem("afternoonStartTime") || "01:00 PM";
  });

  const [minTeachingLoad, setMinTeachingLoad] = useState(() => {
    return localStorage.getItem("minTeachingLoad") || 1300;
  });

  const [maxTeachingLoad, setMaxTeachingLoad] = useState(() => {
    return localStorage.getItem("maxTeachingLoad") || 1800;
  });

  useEffect(() => {
    localStorage.setItem("defaultSubjectClassDuration", defaultSubjectClassDuration);
  }, [defaultSubjectClassDuration]);

  useEffect(() => {
    localStorage.setItem("morningStartTime", morningStartTime);
  }, [morningStartTime]);

  useEffect(() => {
    localStorage.setItem("afternoonStartTime", afternoonStartTime);
  }, [afternoonStartTime]);

  useEffect(() => {
    localStorage.setItem("minTeachingLoad", minTeachingLoad);
  }, [minTeachingLoad]);

  useEffect(() => {
    localStorage.setItem("maxTeachingLoad", maxTeachingLoad);
  }, [maxTeachingLoad]);

  return (
    <div className="mb-10 px-4">
      <h1 className="divider text-xl font-bold text-center mb-8">Configuration</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Number of Days in Week */}
        <div className="form-control">
          <label className="label font-medium">Number of Days in a Week</label>
          <input
            type="number"
            placeholder="e.g., 5 (Mon-Fri)"
            className="input input-bordered w-full"
            value={numOfSchoolDays}
            onChange={(e) => setNumOfSchoolDays(e.target.value)}
            max={7}
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
            onChange={(e) => setDefaultSubjectClassDuration(e.target.value)}
            max={120}
            step={10}
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
            onChange={(e) => setBreakTimeDuration(e.target.value)}
            max={100}
            step={5}
          />
        </div>

        {/* Morning and Afternoon Start Time */}
        <div className="form-control">
          <label className="label font-medium">Start Times</label>
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="label text-sm">Morning</label>
              <TimeSelector
                key={`morningStartTime`}
                interval={5}
                time={morningStartTime}
                setTime={setMorningStartTime}
              />
            </div>
            <div className="w-1/2">
              <label className="label text-sm">Afternoon</label>
              <TimeSelector
                key={`afternoonStartTime`}
                interval={5}
                time={afternoonStartTime}
                setTime={setAfternoonStartTime}
              />
            </div>
          </div>
        </div>

        {/* Teaching Load */}
        <div className="form-control">
          <label className="label font-medium">Teaching Load</label>
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="label text-sm">Minimum</label>
              <input
                type="number"
                placeholder="e.g., 1300"
                className="input input-bordered w-full"
                value={minTeachingLoad}
                onChange={(e) => setMinTeachingLoad(e.target.value)}
                max={maxTeachingLoad}
                step={100}
              />
            </div>
            <div className="w-1/2">
              <label className="label text-sm">Maximum</label>
              <input
                type="number"
                placeholder="e.g., 1800"
                className="input input-bordered w-full"
                value={maxTeachingLoad}
                onChange={(e) => setMaxTeachingLoad(e.target.value)}
                min={minTeachingLoad}
                step={100}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="divider mt-8"></div>
    </div>
  );
}

export default Configuration;
