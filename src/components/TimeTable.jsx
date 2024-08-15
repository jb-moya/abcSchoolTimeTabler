import React from "react";

const TimetableRow = ({
    timeslot,
    timeslotID,
    teacherTimeslot,
    firstColumnMap,
    secondColumnMap,
    columnField,
    isBreak,
}) => {
    if (isBreak) {
        return (
            <tr key={`${timeslotID}-break`}>
                <td>{timeslot}</td>
                <td
                    colSpan={5}
                    className="opacity-50 col-span-full text-center"
                >
                    <span className="divider m-0">break time</span>
                </td>
            </tr>
        );
    }

    if (teacherTimeslot) {
        const fieldName1 = teacherTimeslot[columnField[0]];
        const fieldName2 = teacherTimeslot[columnField[1]];

        return (
            <tr key={timeslotID}>
                <td>{timeslot}</td>
                <td colSpan={5} className="w-full text-center">
                    <div>{firstColumnMap[fieldName1][columnField[0]]}</div>
                    <div>{secondColumnMap[fieldName2][columnField[1]]}</div>
                </td>
            </tr>
        );
    }

    return (
        <tr key={timeslotID} className="opacity-50">
            <td>{timeslot}</td>
            <td className="text-center" colSpan={5}>
                <span className="divider m-0">empty</span>
            </td>
        </tr>
    );
};

const GeneratedTimetable = ({
    timetable,
    collection,
    field,
    timeSlotMap,
    firstColumnMap,
    secondColumnMap,
    columnField,
    beforeBreakTime,
}) => {
    if (!timetable) return null;

    return (
        <div className="">
            <div className="overflow-x-auto">
                {Object.entries(timetable).map(([entryID, entry]) => (
                    <React.Fragment key={entryID}>
                        <div className="flex gap-4 font-bold items-center text-center mt-10">
                            <div>{field}: </div>
                            <div className="text-lg text-accent">
                                {collection[entryID][field]}
                            </div>
                        </div>
                        <table className="table table-zebra table-xs bg-base-100 table-fixed">
                            <thead>
                                <tr className="text-center">
                                    <th className="border border-primary-content">Time</th>
                                    <th className="border border-primary-content">Mon</th>
                                    <th className="border border-primary-content">Tue</th>
                                    <th className="border border-primary-content">Wed</th>
                                    <th className="border border-primary-content">Thu</th>
                                    <th className="border border-primary-content">Fri</th>
                                    {/* <th>{columnField[0]}</th>
                                        <th>{columnField[1]}</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(timeSlotMap).map(
                                    ([timeslotID, timeslot]) => (
                                        <React.Fragment key={timeslotID}>
                                            <TimetableRow
                                                timeslot={timeslot}
                                                timeslotID={timeslotID}
                                                teacherTimeslot={
                                                    entry[timeslotID]
                                                }
                                                firstColumnMap={firstColumnMap}
                                                secondColumnMap={
                                                    secondColumnMap
                                                }
                                                columnField={columnField}
                                            />
                                            {beforeBreakTime[timeslotID] && (
                                                <TimetableRow
                                                    timeslot={
                                                        beforeBreakTime[
                                                            timeslotID
                                                        ]
                                                    }
                                                    timeslotID={timeslotID}
                                                    isBreak
                                                />
                                            )}
                                        </React.Fragment>
                                    )
                                )}
                            </tbody>
                        </table>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default GeneratedTimetable;
