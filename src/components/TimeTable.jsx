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
                    colSpan={3}
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
                <th>{firstColumnMap[fieldName1][columnField[0]]}</th>
                <td>{secondColumnMap[fieldName2][columnField[1]]}</td>
            </tr>
        );
    }

    return (
        <tr key={timeslotID} className="opacity-50">
            <td>{timeslot}</td>
            <td colSpan={2} className="text-center">
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
        <div className="w-1/2">
            <div className="overflow-x-auto">
                {Object.entries(timetable).map(([entryID, entry]) => (
                        <React.Fragment key={entryID}>
                            <div className="flex gap-4 font-bold items-center text-center mt-10">
                                <div>{field}: </div>
                                <div className="text-lg text-accent">
                                    {collection[entryID][field]}
                                </div>
                            </div>
                            <table className="table table-zebra table-xs bg-base-100">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Section</th>
                                        <th>Subject</th>
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
                                                    secondColumnMap={secondColumnMap}
                                                    columnField={columnField}
                                                />
                                                {beforeBreakTime[
                                                    timeslotID
                                                ] && (
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
