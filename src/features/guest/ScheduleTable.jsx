import React, { useState, useMemo } from 'react';
import { IoSearch } from 'react-icons/io5';

const ScheduleTable = () => {
    const [searchSubjectValue, setSearchSubjectValue] = useState('');

    // Mock data for schedules
    const schedules = [
        { id: 1, subject: 'Mathematics', time: '9:00 AM', teacher: 'Mr. Smith' },
        { id: 2, subject: 'English', time: '10:00 AM', teacher: 'Mrs. Johnson' },
        { id: 3, subject: 'Science', time: '11:00 AM', teacher: 'Dr. Carter' },
        { id: 4, subject: 'History', time: '12:00 PM', teacher: 'Ms. Williams' },
        { id: 5, subject: 'Geography', time: '1:00 PM', teacher: 'Mr. Brown' },
    ];

    // Filter schedules based on search query
    const filteredSchedules = useMemo(() => {
        if (!searchSubjectValue.trim()) return schedules;
        return schedules.filter((schedule) =>
            schedule.subject.toLowerCase().includes(searchSubjectValue.toLowerCase())
        );
    }, [searchSubjectValue, schedules]);

    return (
        <div className="space-y-6 w-full max-w-5xl mx-auto px-4">
            {/* Search Bar */}
            <div className="flex-grow w-full md:w-1/3 lg:w-1/4 mx-auto">
                <label className="input input-bordered flex items-center gap-2 w-full">
                    <input
                        type="text"
                        className="grow p-3 text-sm w-full"
                        placeholder="Search Subject"
                        value={searchSubjectValue}
                        onChange={(e) => setSearchSubjectValue(e.target.value)}
                    />
                    <IoSearch className="text-xl" />
                </label>
            </div>

            {/* Schedules Table */}
            <div className="overflow-x-auto">
                <table className="table-auto w-full border-collapse border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-200 px-4 py-2 text-left">Subject</th>
                            <th className="border border-gray-200 px-4 py-2 text-left">Time</th>
                            <th className="border border-gray-200 px-4 py-2 text-left">Teacher</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSchedules.length > 0 ? (
                            filteredSchedules.map((schedule) => (
                                <tr key={schedule.id} className="hover:bg-gray-50">
                                    <td className="border border-gray-200 px-4 py-2">{schedule.subject}</td>
                                    <td className="border border-gray-200 px-4 py-2">{schedule.time}</td>
                                    <td className="border border-gray-200 px-4 py-2">{schedule.teacher}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    className="border border-gray-200 px-4 py-2 text-center"
                                    colSpan="3"
                                >
                                    No schedules found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScheduleTable;
