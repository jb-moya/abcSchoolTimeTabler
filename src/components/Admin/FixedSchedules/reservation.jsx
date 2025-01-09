import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DraggableSchedules from './draggableSchedules';
import { useDroppable } from '@dnd-kit/core';

import { IoMdAdd } from 'react-icons/io';
import { RiSubtractFill } from 'react-icons/ri';

const ReserveList = ({
    editMode,
    onClose,

    grade,
    subjectID,
    day,
    position,

    title,

    subs,
    days,
    setDays,
    positions,
    setPositions,
}) => {
    const subjects = useSelector((state) => state.subject.subjects);

    const numOfSchoolDays = parseInt(
        localStorage.getItem('numOfSchoolDays'),
        10
    );

    const [reservedSubjects, setReservedSubjects] = useState([]);
    const [reservedSubjectsCount, setReservedSubjectsCount] = useState({});
    const [reservationFull, setReservationFull] = useState(false);

    useEffect(() => {
        retrieveReservedSubjects();
        checkReservationList();
    }, [subs, days, positions]);

    const retrieveReservedSubjects = () => {
        const newReservedSubjects = [];
        const newReservedSubjectsCount = {};

        subs?.forEach((subID) => {
            const subjectDays = days[subID] || [];
            const subjectPositions = positions[subID] || [];

            const count = subjectDays.reduce((acc, _, i) => {
                if (
                    subjectDays[i] === day &&
                    subjectPositions[i] === position
                ) {
                    return acc + 1;
                }
                return acc;
            }, 0);

            if (count > 0) {
                newReservedSubjects.push(subID);
                newReservedSubjectsCount[subID] = count;
            }
        });

        setReservedSubjects(newReservedSubjects);
        setReservedSubjectsCount(newReservedSubjectsCount);
    };

    const handleAdd = (subID) => {
        const index = days[subID]?.findIndex(
            (d, i) => d === 0 && positions[subID]?.[i] === 0
        );

        if (index !== -1) {
            setDays((prev) => ({
                ...prev,
                [subID]: prev[subID]?.map((d, i) => (i === index ? day : d)),
            }));

            setPositions((prev) => ({
                ...prev,
                [subID]: prev[subID]?.map((p, i) =>
                    i === index ? position : p
                ),
            }));
        }
    };

    const handleRemove = (subID) => {
        const index = days[subID]?.findIndex(
            (d, i) => d === day && positions[subID]?.[i] === position
        );

        if (index !== -1) {
            setDays((prev) => ({
                ...prev,
                [subID]: prev[subID]?.map((d, i) => (i === index ? 0 : d)),
            }));

            setPositions((prev) => ({
                ...prev,
                [subID]: prev[subID]?.map((p, i) => (i === index ? 0 : p)),
            }));
        }
    };

    const checkReservationList = () => {
        let count = 0;

        {
            subs?.map((subID, index) => {
                const subjectDays = days[subID] || [];
                const subjectPositions = positions[subID] || [];

                for (let i = 0; i < subjectDays.length; i++) {
                    if (day === 0) {
                        if (subjectPositions[i] === position) {
                            count++;
                        }
                    } else if (position === 0) {
                        if (subjectDays[i] === day) {
                            count++;
                        }
                    }
                }
            });
        }

        if (day === 0) {
            if (count >= numOfSchoolDays) {
                setReservationFull(true);
                return;
            }
        } else if (position === 0) {
            if (count >= subs?.length) {
                setReservationFull(true);
                return;
            }
        }

        setReservationFull(false);
    };

    const checkSubjectList = (subID) => {
        const index = days[subID]?.findIndex(
            (d, i) => d === 0 && positions[subID]?.[i] === 0
        );

        return index !== -1;
    };

    return (
        <dialog
            key={
                day === 0
                    ? `res-g${grade}-p${position}`
                    : `res-g${grade}-d${day}`
            }
            className="modal modal-open"
        >
            <div className="w-8/12 mx-0 my-0 modal-box">
                <div className="flex items-center rounded-lg bg-blue-900 justify-between rounded-t p-4 relative">
                    <h3 className="text-lg text-white font-semibold">
                        {title}
                        {reservationFull && (
                            <span className="text-red-500 ml-2">[FULL]</span>
                        )}
                    </h3>
                    <button
                        className="btn btn-circle btn-ghost text-white absolute top-[7px] right-2"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="relative p-4 flex-auto">
                    <div>
                        <table className="table table-sm table-zebra w-full">
                            <thead>
                                <tr>
                                    <th className="w-auto">Subject Name</th>
                                    <th className="w-auto"># of Classes</th>
                                    <th
                                        className={`w-auto ${
                                            editMode ? 'block' : 'hidden'
                                        }`}
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservedSubjects?.length > 0 ? (
                                    reservedSubjects?.map((subID, index) => {
                                        return (
                                            <tr
                                                key={`res_list-g${grade}-s${subID}-d${day}-p${position}`}
                                            >
                                                <td>
                                                    {subjects[subID]?.subject}
                                                </td>
                                                <td>
                                                    {
                                                        reservedSubjectsCount[
                                                            subID
                                                        ]
                                                    }
                                                </td>
                                                {editMode && (
                                                    <td>
                                                        <div className="">
                                                            <button
                                                                className={`border m-1 ${
                                                                    reservationFull &&
                                                                    !checkSubjectList(
                                                                        subID
                                                                    )
                                                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                                        : 'bg-green-500 text-white'
                                                                }`}
                                                                onClick={() =>
                                                                    handleAdd(
                                                                        subID
                                                                    )
                                                                }
                                                                disabled={
                                                                    reservationFull &&
                                                                    !checkSubjectList(
                                                                        subID
                                                                    )
                                                                }
                                                            >
                                                                <IoMdAdd
                                                                    size={20}
                                                                />
                                                            </button>
                                                            <button
                                                                className="border bg-red-500 text-white m-1"
                                                                onClick={() =>
                                                                    handleRemove(
                                                                        subID
                                                                    )
                                                                }
                                                            >
                                                                <RiSubtractFill
                                                                    size={20}
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="text-center text-gray-500"
                                        >
                                            No subjects reserved
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </div>
        </dialog>
    );
};

const ReserveDay = ({
    editMode,

    grade,
    subjectID,
    day,
    position,

    subs,
    days,
    setDays,
    positions,
    setPositions,
}) => {
    const dayNames = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ];

    const [showReservation, setShowReservation] = useState(false);
    const [reservedCount, setReservedCount] = useState(0);

    useEffect(() => {
        let count = 0;

        {
            subs?.map((subID, index) => {
                const subjectDays = days[subID] || [];
                const subjectPositions = positions[subID] || [];

                for (let i = 0; i < subjectDays.length; i++) {
                    if (
                        subjectDays[i] === day &&
                        subjectPositions[i] === position
                    ) {
                        count++;
                    }
                }
            });
        }

        setReservedCount(count);
    }, [subs, days, positions]);

    const { setNodeRef } = useDroppable({
        id: `res-day-g${grade}-d${day}`,
        data: { subjectID, day, position },
    });

    return (
        <>
            <button
                ref={editMode ? setNodeRef : null}
                className="w-20 h-10 rounded-bl-lg rounded-br-lg bg-blue-100"
                onClick={() => setShowReservation(true)}
            >
                Reserve
                <div>({reservedCount})</div>
            </button>
            {showReservation && (
                <ReserveList
                    editMode={editMode}
                    onClose={() => setShowReservation(false)}
                    grade={grade}
                    subjectID={subjectID}
                    day={day}
                    position={position}
                    title={`Subjects Reserved for ${dayNames[day - 1]}`}
                    subs={subs}
                    days={days}
                    setDays={setDays}
                    positions={positions}
                    setPositions={setPositions}
                />
            )}
        </>
    );
};

const ReservePosition = ({
    editMode,

    grade,
    subjectID,
    day,
    position,

    subs,
    days,
    setDays,
    positions,
    setPositions,
}) => {
    const [showReservation, setShowReservation] = useState(false);
    const [reservedCount, setReservedCount] = useState(0);

    useEffect(() => {
        let count = 0;

        {
            subs?.map((subID, index) => {
                const subjectDays = days[subID] || [];
                const subjectPositions = positions[subID] || [];

                for (let i = 0; i < subjectDays.length; i++) {
                    if (
                        subjectDays[i] === day &&
                        subjectPositions[i] === position
                    ) {
                        count++;
                    }
                }
            });
        }

        setReservedCount(count);
    }, [subs, days, positions]);

    const { setNodeRef } = useDroppable({
        id: `res-pos-g${grade}-p${position}`,
        data: { subjectID, day, position },
    });

    return (
        <>
            <button
                ref={editMode ? setNodeRef : null}
                className="w-10 h-20 rounded-tr-lg rounded-br-lg bg-blue-100"
                style={{
                    writingMode: 'vertical-rl',
                }}
                onClick={() => setShowReservation(true)}
            >
                Reserve
                <div
                    style={{
                        writingMode: 'vertical-rl',
                    }}
                >
                    ({reservedCount})
                </div>
            </button>

            {showReservation && (
                <ReserveList
                    editMode={editMode}
                    onClose={() => setShowReservation(false)}
                    grade={grade}
                    subjectID={subjectID}
                    day={day}
                    position={position}
                    title={`Subjects Reserved for Class ${position}`}
                    subs={subs}
                    days={days}
                    setDays={setDays}
                    positions={positions}
                    setPositions={setPositions}
                />
            )}
        </>
    );
};

export { ReserveDay, ReservePosition };
