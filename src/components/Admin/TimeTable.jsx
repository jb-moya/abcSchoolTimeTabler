import React from 'react';
import { convertToTime } from '../../utils/convertToTime';

const GeneratedTimetable = ({ timetables, field, columnField }) => {
    if (!timetables) return null;

    return (
        <div className="">
            <div className="overflow-x-auto">
                {Object.entries(timetables).map(([timetableID, timetable]) => {
                    // console.log('timetable rows', timetable);

                    const { containerName, ...rowTimetable } = timetable;

                    return (
                        <React.Fragment key={timetableID}>
                            <div className="flex gap-4 font-bold items-center text-center mt-10">
                                <div>{field}: </div>
                                <div className="text-lg text-accent">
                                    {containerName}
                                </div>
                            </div>
                            <div className="flex bg-base-100">
                                <div className="w-1/12">
                                    <div className="border border-primary-content">
                                        Time
                                    </div>
                                </div>
                                <div className="w-11/12">
                                    <div className="flex text-center w-full">
                                        <div className="w-1/5 border border-primary-content">
                                            Mon
                                        </div>
                                        <div className="w-1/5 border border-primary-content">
                                            Tue
                                        </div>
                                        <div className="w-1/5 border border-primary-content">
                                            Wed
                                        </div>
                                        <div className="w-1/5 border border-primary-content">
                                            Thur
                                        </div>
                                        <div className="w-1/5 border border-primary-content">
                                            Fri
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap"></div>
                                </div>
                            </div>

                            {Object.entries(rowTimetable).map(
                                ([timeslot, row]) => {
                                    // console.log(
                                    //     '🚀 ~ {Object.entries ~ row:',
                                    //     row
                                    // );

                                    const consistent = '0' in row;

                                    if (consistent) {
                                        const startTime = convertToTime(
                                            row[0].start
                                        );
                                        const endTime = convertToTime(
                                            row[0].end
                                        );
                                        const teacher = row[0][columnField[0]];
                                        const subject = row[0][columnField[1]];

                                        return (
                                            <div
                                                key={timeslot}
                                                className="flex bg-base-100 items-center"
                                            >
                                                <div className="w-1/12 text-sm text-center">
                                                    {startTime} - {endTime}
                                                </div>

                                                <div className="w-11/12 flex justify-center space-x-3">
                                                    {teacher && subject ? (
                                                        <>
                                                            <div>{subject}</div>
                                                            <div>{teacher}</div>
                                                        </>
                                                    ) : (
                                                        <div className="opacity-60">
                                                            Break Time
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        let startTime;
                                        let endTime;

                                        const keys = Object.keys(row);
                                        if (keys.length > 0) {
                                            const anyKey = keys[0];
                                            startTime = convertToTime(
                                                row[anyKey].start
                                            );
                                            endTime = convertToTime(
                                                row[anyKey].end
                                            );
                                        } else {
                                            console.error('No keys found.');
                                        }

                                        const days = ['1', '2', '3', '4', '5'];

                                        return (
                                            <div
                                                key={timeslot}
                                                className="flex bg-base-100 items-center"
                                            >
                                                <div className="w-1/12 text-sm text-center">
                                                    {startTime} - {endTime}
                                                </div>

                                                <div className="w-11/12">
                                                    <div className="flex text-center w-full items-center">
                                                        {days.map((day) => {
                                                            if (day in row) {
                                                                return (
                                                                    <div
                                                                        className="w-1/5"
                                                                        key={
                                                                            day
                                                                        }
                                                                    >
                                                                        <div>
                                                                            {
                                                                                row[
                                                                                    day
                                                                                ][
                                                                                    columnField[0]
                                                                                ]
                                                                            }
                                                                        </div>
                                                                        <div>
                                                                            {
                                                                                row[
                                                                                    day
                                                                                ][
                                                                                    columnField[1]
                                                                                ]
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <div
                                                                        className="w-1/5 opacity-60"
                                                                        key={
                                                                            day
                                                                        }
                                                                    >
                                                                        - - - -
                                                                        - - -
                                                                    </div>
                                                                );
                                                            }
                                                        })}
                                                    </div>
                                                </div>

                                                {/* <div className="w-11/12 flex justify-center space-x-3">
                                                    {teacher && subject ? (
                                                        <>
                                                            <div>{subject}</div>
                                                            <div>{teacher}</div>
                                                        </>
                                                    ) : (
                                                        <div className="opacity-50">
                                                            Break Time
                                                        </div>
                                                    )}
                                                </div> */}
                                            </div>
                                        );
                                    }
                                }
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default GeneratedTimetable;
