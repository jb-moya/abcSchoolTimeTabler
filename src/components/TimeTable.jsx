import clsx from "clsx";
import React from "react";
import extendArray from "../utils/extendArray";
import findMissingNumbers from "../utils/findMissingNumbers";

const TimetableRow = ({
    timeslot,
    row,
    firstColumnMap,
    secondColumnMap,
    columnField,
    // isBreak,
}) => {
    console.log("haha", row);

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
        console.log("fFFFFFFFFFFFFFFFFFFFFFFF", row);
        const numbersToCheck = [1, 2, 3, 4, 5];

        const availableDay = [];

        const row_cell_length = row.length;
        for (let i = 0; i < row_cell_length; i++) {
            extendArray(availableDay, row[i].day);
        }

        console.log("V", availableDay);

        const renderedRow = [];
        for (let i = 0; i < row_cell_length; i++) {
            const fieldName1 = row[i][columnField[0]];
            const fieldName2 = row[i][columnField[1]];

            if (row[i].day.includes(0)) {
                renderedRow.push(
                    <div
                        key={`0-${fieldName1}-${fieldName2}`}
                        className={clsx(
                            "text-nowrap h-10 leading-4 content-center",
                            `order-[calc(${row[i].timeslot}+10+1)]`,
                            row[i].day.includes(0)
                                ? "basis-full"
                                : `basis-1/5`
                        )}
                    >
                        <div className="flex gap-x-2 text-center justify-center">
                            <span>
                                {firstColumnMap[fieldName1][columnField[0]]}
                            </span>
                            <span>
                                {secondColumnMap[fieldName2][columnField[1]]}
                            </span>
                        </div>
                    </div>
                );

                continue;
            }

            for (const day of numbersToCheck) {
                console.log("row[i].day", row[i].day);

                if (!availableDay.includes(day)) {
                    renderedRow.push(
                        <div
                            className={clsx(
                                "text-nowrap h-10 leading-4 content-center bg-purple-400",
                                `order-[calc(${row[i].timeslot}+10+${day}+1)]`,
                                `basis-1/5`
                            )}
                        >
                            <span className="divider my-auto">x</span>
                        </div>
                    );
                } else {
                    renderedRow.push(
                        <div
                            key={`${day}-${fieldName1}-${fieldName2}`}
                            className={clsx(
                                "text-nowrap h-10 leading-4 content-center basis-1/5",
                                `order-[calc(${row[i].timeslot}+10+${day}+1)]`
                            )}
                        >
                            <div className="flex gap-x-2 text-center justify-center">
                                <span>
                                    {firstColumnMap[fieldName1][columnField[0]]}
                                </span>
                                <span>
                                    {
                                        secondColumnMap[fieldName2][
                                            columnField[1]
                                        ]
                                    }
                                </span>
                            </div>
                        </div>
                    );
                }
            }
        }

        return renderedRow;
    } else {
        // return null;
        return (
            <div
                className={clsx(
                    `opacity-50 border-b h-10 content-center basis-full`,
                    `order-[calc(${timeslot}+10+1)]`
                )}
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
                                        {/* {timetable[timetableID][field]} */}
                                    </div>
                                </div>
                                <div className="flex bg-base-100">
                                    <div>
                                        <div className="border border-primary-content">
                                            Time
                                        </div>
                                        <div className="leading-4">
                                            {Object.entries(timeSlotMap).map(
                                                ([timeslotID, timeslot]) => (
                                                    <div
                                                        key={timeslotID}
                                                        className="border-b h-10"
                                                    >
                                                        {timeslot}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full">
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
                                                divu
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