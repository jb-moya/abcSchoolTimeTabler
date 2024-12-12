import React from 'react';
import { convertToTime } from '../../utils/convertToTime';
import clsx from 'clsx';

const TimetableField = ({ field, containerName, timetableID }) => {
    return (
        <React.Fragment key={timetableID}>
            <div className="flex gap-4 font-bold items-center text-center mt-10">
                <div>{field}: </div>
                <div className="text-lg text-accent">{containerName}</div>
            </div>
            <div className="flex bg-base-100">
                <div className="w-[10%]">
                    <div className="border border-primary-content">Time</div>
                </div>
                <div className="w-[90%]">
                    <div className="flex text-center w-full border border-primary-content">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(
                            (day, index) => (
                                <div
                                    key={index}
                                    className="flex-1 border-r border-primary-content"
                                >
                                    {day}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

const GeneratedTimetable = ({ timetables, field }) => {
    if (!timetables) {
        console.log('no timetables');
        return null;
    }

    const height = 40;
    const topMultiplier = 50;

    return (
        <div className="w-full overflow-x-auto">
            {Array.from(timetables).map(([timetableID, timetableData]) => {
                const timetable = timetableData.get('timetable');

                const time = new Set();
                const timeslots = timetable.map((timeslot, index) => {
                    const start = timeslot[0];
                    const timeslotData = timeslot[1];
                    const end = timeslotData.end;
                    const day = Number(timeslotData.day);

                    time.add(JSON.stringify([start, end]));

                    const leftOffset = ((day - 1) / 5) * 100;
                    // console.log(
                    //     '🚀 ~ {timetable.map ~ leftOffset:',
                    //     leftOffset
                    // );

                    return (
                        <div
                            key={index}
                            className={clsx(
                                'items-center absolute flex p-2 justify-center border-b-2 border-gray-500 border-opacity-20',
                                {
                                    'w-full': day === 0,
                                    'w-1/5': day !== 0,
                                }
                            )}
                            style={{
                                height: height,
                                top: timeslot[0] + topMultiplier,
                                left: day !== 0 ? `${leftOffset}%` : 0,
                            }}
                        >
                            <div className="text-ellipsis">
                                {timeslotData.fieldName2 &&
                                timeslotData.fieldName1 ? (
                                    <>
                                        <div className="line-clamp-1">
                                            {timeslotData.fieldName2}
                                        </div>
                                        <div className="line-clamp-1">
                                            {timeslotData.fieldName1}
                                        </div>
                                    </>
                                ) : (
                                    <div className="opacity-50">break</div>
                                )}
                            </div>
                        </div>
                    );
                });

                return (
                    <div key={timetableID}>
                        <TimetableField
                            field={field}
                            containerName={timetableData.get('containerName')}
                            timetableID={timetableID}
                        />

                        <div className="flex w-full">
                            {time.size > 0 && (
                                <div className="flex flex-col ml-auto w-[10%] relative h-[1700px]">
                                    {Array.from(time).map((time, index) => {
                                        time = JSON.parse(time);
                                        // console.log(
                                        //     '🚀 ~ {Array.from ~ time:',
                                        //     time
                                        // );

                                        const start = convertToTime(time[0]);
                                        const end = convertToTime(time[1]);

                                        return (
                                            <div
                                                key={index}
                                                className={
                                                    'text-xs flex-col md:text-base md:flex-row items-center leading-none absolute flex p-2 justify-center w-full border-b-2 border-gray-500 border-opacity-20'
                                                }
                                                style={{
                                                    height: height,
                                                    top:
                                                        time[0] + topMultiplier,
                                                }}
                                            >
                                                <span>{start}</span>
                                                <span className="opacity-40 hidden">
                                                    -
                                                </span>
                                                <span>{end}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex flex-col ml-auto w-11/12 justify-end relative h-[1700px]">
                                {timeslots}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GeneratedTimetable;
