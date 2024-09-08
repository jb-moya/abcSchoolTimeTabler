import clsx from "clsx";
import React from "react";
import extendArray from "@utils/extendArray";
import findMissingNumbers from "@utils/findMissingNumbers";
const numbersToCheck = [1, 2, 3, 4, 5];

const TimetableRow = ({
    timeslot,
    row,
    firstColumnMap,
    secondColumnMap,
    columnField,
    // isBreak,
}) => {
    // console.log("haha", row);

    // if (isBreak) {
    //     return (
    //         <div
    //             className={clsx("flex", `order-${timeslot}`)}
    //             key={`${timeslot}-break`}
    //         >
    //             <div className="w-2/12">{timeSlotMap[row[2]]}</div>
    //             <div className="w-10/12 flex-1 opacity-50 col-span-full text-center">
    //                 <span className="divider m-0">break time</span>
    //             </div>
    //         </div>
    //     );
    // }
    // return null;

    if (row) {
        // console.log("fFFFFFFFFFFFFFFFFFFFFFFF", row);

        const availableDay = [];

        const row_cell_length = row.length;
        for (let i = 0; i < row_cell_length; i++) {
            extendArray(availableDay, row[i].day);
        }

        // console.log("V", availableDay);

        const renderedRow = [];
        for (let i = 0; i < row_cell_length; i++) {
            const fieldName1 = row[i][columnField[0]];
            const fieldName2 = row[i][columnField[1]];

            if (row[i].day.includes(0)) {
                renderedRow.push(
                    <div
                        key={`0-${fieldName1}-${fieldName2}`}
                        className={
                            "text-nowrap h-12 leading-4 content-center w-full"
                        }
                        style={{
                            order: `calc((${row[i].timeslot} * 10) + 1)`,
                        }}
                    >
                        <div className="flex flex-col gap-x-2 text-center justify-center">
                            <div className="text-ellipsis">
                                {firstColumnMap[fieldName1][columnField[0]]}
                            </div>
                            <div className="text-ellipsis">
                                {secondColumnMap[fieldName2][columnField[1]]}
                            </div>
                        </div>
                    </div>
                );

                continue;
            }

            for (const day in row[i].day) {
                console.log("row[i].day", row[i].day[day], row[i].day);
                renderedRow.push(
                    <div
                        key={`${row[i].day[day]}-${fieldName1}-${fieldName2}`}
                        className={
                            "text-nowrap h-10 leading-4 content-center w-1/5"
                        }
                        style={{
                            order: `calc((${row[i].timeslot} * 10) + ${row[i].day[day]} + 1)`,
                        }}
                    >
                        <div className="flex flex-col gap-x-2 text-center justify-center">
                            <div className="text-ellipsis">
                                {firstColumnMap[fieldName1][columnField[0]]}
                            </div>
                            <div className="text-ellipsis">
                                {secondColumnMap[fieldName2][columnField[1]]}
                            </div>
                        </div>
                    </div>
                );
            }

            const emptyDay = findMissingNumbers(numbersToCheck, availableDay);

            for (const day of emptyDay) {
                renderedRow.push(
                    <div
                        className={
                            "text-nowrap h-12 leading-4 content-center bg-purple-400 w-1/5"
                        }
                        style={{
                            order: `calc((${row[i].timeslot} * 10) + ${day} + 1)`,
                        }}
                    >
                        <span className="divider my-auto">x</span>
                    </div>
                );
            }
        }

        return renderedRow;
    } else {
        return (
            <div
                className={
                    "opacity-50 border-b h-12 content-center bg-orange-600 w-full"
                }
                style={{
                    order: `calc((${timeslot} * 10) + 1)`,
                }}
            >
                <span className="divider my-auto">{timeslot}</span>
            </div>
        );
    }
};

const GeneratedTimetable = ({
    timetables,
    collection,
    field,
    timeSlotMap,
    firstColumnMap,
    secondColumnMap,
    columnField,
    beforeBreakTime,
}) => {
    if (!timetables) return null;

    return (
        <div className="">
            <div className="overflow-x-auto">
                {Object.entries(timetables).map(
                    ([timetableID, timetable]) => (
                        console.log("timetablaae", timetable),
                        (
                            <React.Fragment key={timetableID}>
                                <div className="flex gap-4 font-bold items-center text-center mt-10">
                                    <div>{field}: </div>
                                    <div className="text-lg text-accent">
                                        {collection[timetableID][field]}
                                    </div>
                                </div>
                                <div className="flex bg-base-100">
                                    <div className="w-1/12">
                                        <div className="border border-primary-content">
                                            Time
                                        </div>
                                        <div className="leading-4">
                                            {Object.entries(timeSlotMap).map(
                                                ([timeslotID, timeslot]) => (
                                                    <div
                                                        key={timeslotID}
                                                        className="border-b h-12"
                                                    >
                                                        {timeslot}
                                                    </div>
                                                )
                                            )}
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
                                        <div className="flex flex-wrap">
                                            {Object.entries(timeSlotMap).map(
                                                ([timeslotID, timeslot]) => (
                                                    <TimetableRow
                                                        key={timeslotID}
                                                        timeslot={timeslotID}
                                                        row={
                                                            timetable[
                                                                timeslotID
                                                            ]
                                                        }
                                                        firstColumnMap={
                                                            firstColumnMap
                                                        }
                                                        secondColumnMap={
                                                            secondColumnMap
                                                        }
                                                        columnField={
                                                            columnField
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        )
                    )
                )}
            </div>
        </div>
    );
};

export default GeneratedTimetable;
