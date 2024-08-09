import React, { useState } from "react";
import packInt16ToInt32 from "./utils/packInt16ToInt32";
import Navbar from "./components/Navbar";
import { useSelector } from "react-redux";

import { wrap } from "comlink";
import WasmWorker from "./wasm.worker?worker";
import SubjectListContainer from "./components/SubjectListContainer";
import TeacherListContainer from "./components/TeacherListContainer";
import SectionListContainer from "./components/SectionListContainer";
import clsx from "clsx";
const getTimetable = wrap(new WasmWorker());

function App() {
    const { subjects } = useSelector((state) => state.subject);
    const { teachers } = useSelector((state) => state.teacher);
    const { sections } = useSelector((state) => state.section);

    const [timetable, setTimetable] = useState([]);
    const [sectionTimetable, setSectionTimetable] = useState({});
    const [teacherTimetable, setTeacherTimetable] = useState({});
    const [timetableGenerationStatus, setTimetableGenerationStatus] =
        useState("idle");

    const timeSlotMap = {
        0: "06:00 - 06:50",
        1: "06:50 - 07:40",
        2: "07:40 - 08:30",
        3: "09:00 - 09:50",
        4: "09:50 - 10:40",
        5: "10:40 - 11:30",
        6: "11:30 - 12:20",
        7: "01:10 - 02:00",
    };

    const beforeBreakTime = {
        2: "08:30 - 09:00",
        6: "12:20 - 01:10",
    };

    const handleButtonClick = async () => {
        const subjectMap = Object.entries(subjects).reduce(
            (acc, [, value], index) => {
                acc[index] = value.id;
                return acc;
            },
            {}
        );

        const subjectMapReverse = Object.entries(subjects).reduce(
            (acc, [, value], index) => {
                acc[value.id] = index;
                return acc;
            },
            {}
        );

        const teacherMap = Object.entries(teachers).reduce(
            (acc, [, value], index) => {
                acc[index] = {
                    subjects: value.subjects.map(
                        (subjectID) => subjectMapReverse[subjectID]
                    ),
                    id: value.id,
                };
                // acc[index] = value.id;
                return acc;
            },
            {}
        );

        const sectionMap = Object.entries(sections).reduce(
            (acc, [, value], index) => {
                acc[index] = {
                    subjects: value.subjects.map(
                        (subjectID) => subjectMapReverse[subjectID]
                    ),
                    id: value.id,
                };

                return acc;
            },
            {}
        );

        // console.log("subjectMap", subjectMap);
        // console.log("teacherMap", teacherMap);
        // console.log("subjectMapReverse", subjectMapReverse);
        // console.log("sectionMap", sectionMap);

        const sectionSubjectArray = [];
        // console.log("sectionMap", sectionMap);
        for (const [sectionKey, { subjects }] of Object.entries(sectionMap)) {
            for (const subject of subjects) {
                console.log(sectionKey, subject);
                sectionSubjectArray.push(packInt16ToInt32(sectionKey, subject));
            }
        }

        const sectionSubjects = new Int32Array([...sectionSubjectArray]);

        const max_iterations = 10000;
        const beesPopulations = 5;
        const beesEmployedOptions = 5;
        const beesOnlookerOptions = 2;
        const beesScoutOptions = 2;
        const limits = 800;

        // console.log("sectionSubjects", sectionSubjects, sectionSubjects.length);

        // console.log(
        //     "Object.keys(sectionMap).length",
        //     Object.keys(sectionMap).length
        // );
        // console.log(
        //     "Object.keys(teacherMap).length",
        //     Object.keys(teacherMap).length
        // );
        // console.log("sectionSubjectArray.length", sectionSubjectArray.length);
        const numTeachers = Object.keys(teacherMap).length;
        const numRooms = 7;
        const num_timeslots = 8;
        const totalSchoolClass = sectionSubjectArray.length;
        const totalSection = Object.keys(sectionMap).length;

        const teacherSubjectArray = [];

        console.log("teacherMap", teacherMap);
        for (const [teacherKey, { subjects }] of Object.entries(teacherMap)) {
            for (const subject of subjects) {
                console.log("hehe", teacherKey, subject);
                teacherSubjectArray.push(packInt16ToInt32(teacherKey, subject));
            }
        }

        const teacherSubjects = new Int32Array([...teacherSubjectArray]);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);
        console.log("teacherSubjects.length", teacherSubjects.length);

        const params = {
            maxIterations: max_iterations,
            numTeachers: numTeachers,
            numRooms: numRooms,
            numTimeslots: num_timeslots,
            totalSchoolClass: totalSchoolClass,
            totalSection: totalSection,
            sectionSubjects: sectionSubjects,
            teacherSubjects: teacherSubjects,
            teacherSubjectsLength: teacherSubjects.length,
            beesPopulation: beesPopulations,
            beesEmployed: beesEmployedOptions,
            beesOnlooker: beesOnlookerOptions,
            beesScout: beesScoutOptions,
            limits: limits,
        };

        setTimetableGenerationStatus("running");
        const { timetable, status } = await getTimetable(params);
        console.log("success", timetable, status);
        setTimetableGenerationStatus(status);

        const timetableMap = [];
        const sectionTimetable = {};
        const teacherTimetable = {};

        // console.log("testing subjectmap", subjectMap["1"]);

        for (const entry of timetable) {
            // console.log("F", entry, typeof entry[0]);
            const section = sectionMap[entry[0]].id;
            const subject = subjectMap[entry[1]];
            const teacher = teacherMap[entry[2]].id;
            const timeslot = entry[3];

            timetableMap.push({
                section: section,
                subject: section,
                teacher: section,
                timeslot: section,
            });

            if (
                typeof sectionTimetable[section] !== "object" ||
                sectionTimetable[section] === null ||
                Array.isArray(sectionTimetable[section])
            ) {
                sectionTimetable[section] = {}; // Initialize as an empty object if it is not an object or is null/undefined
            }

            sectionTimetable[section][timeslot] = {
                subject: subject,
                teacher: teacher,
                timeslot: timeslot,
            };

            if (
                typeof teacherTimetable[teacher] !== "object" ||
                teacherTimetable[teacher] === null ||
                Array.isArray(teacherTimetable[teacher])
            ) {
                teacherTimetable[teacher] = {}; // Initialize as an empty object if it is not an object or is null/undefined
            }

            teacherTimetable[teacher][timeslot] = {
                section: section,
                subject: subject,
                timeslot: timeslot,
            };
        }

        // setTimetable(timetable);
        // console.log("timetable", timetableMap);
        console.log("section timetable", sectionTimetable);
        console.log("teacher timetable", teacherTimetable);

        setTimetable(timetableMap);
        setSectionTimetable(sectionTimetable);
        setTeacherTimetable(teacherTimetable);

        return;
    };

    return (
        <div className="App container mx-auto px-4">
            <header className="App-header">
                <Navbar />
                <div className="flex gap-4">
                    <div className="w-5/12">
                        <SubjectListContainer />
                    </div>
                    <div className="w-7/12">
                        <TeacherListContainer />
                    </div>
                </div>
                <div className="w-full">
                    <SectionListContainer />
                    <button
                        className={clsx("btn btn-primary", {
                            "cursor-not-allowed":
                                timetableGenerationStatus === "running",
                        })}
                        onClick={() => handleButtonClick()}
                        disabled={timetableGenerationStatus === "running"}
                    >
                        {timetableGenerationStatus == "running"
                            ? "Generating..."
                            : "Generate Timetable"}
                    </button>
                </div>

                <div className="w-8/12">
                    <div className="overflow-x-auto">
                        {timetableGenerationStatus === "running" && (
                            <div className="overflow-x-auto">
                                <div className="skeleton h-96 w-full flex align-middle justify-center items-center">
                                    <div className="text-lg opacity-50">
                                        Generating timetable... wait ka
                                    </div>
                                </div>
                            </div>
                        )}

                        {sectionTimetable !== null &&
                            Object.entries(sectionTimetable).map(
                                ([sectionID, section]) => (
                                    <React.Fragment key={sectionID}>
                                        <div className="font-bold text-center my-10">
                                            <span>section: </span>
                                            <span className="text-accent">
                                                {sections[sectionID].section}
                                            </span>
                                        </div>
                                        <table className="table table-zebra bg-base-100">
                                            <thead>
                                                <tr>
                                                    <th>time</th>
                                                    <th>Subject</th>
                                                    <th>teacher</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(
                                                    timeSlotMap
                                                ).map(
                                                    ([
                                                        timeslotID,
                                                        timeslot,
                                                    ]) => {
                                                        const rows = [];

                                                        if (
                                                            section[timeslotID]
                                                        ) {
                                                            rows.push(
                                                                <tr
                                                                    key={
                                                                        timeslotID
                                                                    }
                                                                >
                                                                    <td>
                                                                        {
                                                                            timeslot
                                                                        }
                                                                    </td>
                                                                    <th>
                                                                        {
                                                                            subjects[
                                                                                section[
                                                                                    timeslotID
                                                                                ]
                                                                                    .subject
                                                                            ]
                                                                                .subject
                                                                        }
                                                                    </th>
                                                                    <td>
                                                                        {
                                                                            teachers[
                                                                                section[
                                                                                    timeslotID
                                                                                ]
                                                                                    .teacher
                                                                            ]
                                                                                .teacher
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            );
                                                        } else {
                                                            // Default row if no matching conditions
                                                            rows.push(
                                                                <tr
                                                                    key={`${timeslotID}-empty`}
                                                                >
                                                                    <td>
                                                                        {
                                                                            timeslot
                                                                        }
                                                                    </td>
                                                                    <td
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className="opacity-50 col-span-full text-center"
                                                                    >
                                                                        <span className="divider m-0">
                                                                            empty
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        if (
                                                            beforeBreakTime[
                                                                timeslotID
                                                            ]
                                                        ) {
                                                            rows.push(
                                                                <tr
                                                                    key={`${timeslotID}-break`}
                                                                >
                                                                    <td>
                                                                        {
                                                                            beforeBreakTime[
                                                                                timeslotID
                                                                            ]
                                                                        }
                                                                    </td>
                                                                    <td
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className="opacity-50 text-center col-span-full"
                                                                    >
                                                                        <span className="divider m-0">
                                                                            break
                                                                            time
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        return rows;
                                                    }
                                                )}
                                            </tbody>
                                        </table>
                                    </React.Fragment>
                                )
                            )}
                    </div>
                </div>

                <div className="w-8/12">
                    <div className="overflow-x-auto">
                        {teacherTimetable !== null &&
                            Object.entries(teacherTimetable).map(
                                ([teacherID, teacher]) => (
                                    <React.Fragment key={teacherID}>
                                        <div className="font-bold text-center my-10">
                                            <span>Teacher: </span>
                                            <span className="text-lg text-accent">
                                                {teachers[teacherID].teacher}
                                            </span>
                                        </div>
                                        <table className="table table-zebra bg-base-100">
                                            <thead>
                                                <tr>
                                                    <th></th>
                                                    <th>Section</th>
                                                    <th>subject</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(
                                                    timeSlotMap
                                                ).map(
                                                    ([
                                                        timeslotID,
                                                        timeslot,
                                                    ]) => {
                                                        const rows = [];

                                                        if (
                                                            teacher[timeslotID]
                                                        ) {
                                                            rows.push(
                                                                <tr
                                                                    key={
                                                                        timeslotID
                                                                    }
                                                                >
                                                                    <td>
                                                                        {
                                                                            timeslot
                                                                        }
                                                                    </td>
                                                                    <th>
                                                                        {
                                                                            sections[
                                                                                teacher[
                                                                                    timeslotID
                                                                                ]
                                                                                    .section
                                                                            ]
                                                                                .section
                                                                        }
                                                                    </th>
                                                                    <td>
                                                                        {
                                                                            subjects[
                                                                                teacher[
                                                                                    timeslotID
                                                                                ]
                                                                                    .subject
                                                                            ]
                                                                                .subject
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            );
                                                        } else {
                                                            rows.push(
                                                                <tr
                                                                    key={
                                                                        timeslotID
                                                                    }
                                                                    className="opacity-50"
                                                                >
                                                                    <td>
                                                                        {
                                                                            timeslot
                                                                        }
                                                                    </td>
                                                                    <td
                                                                        colSpan={
                                                                            2
                                                                        }
                                                                        className="text-center"
                                                                    >
                                                                        <span className="divider m-0">
                                                                            empty
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        if (
                                                            beforeBreakTime[
                                                                timeslotID
                                                            ]
                                                        ) {
                                                            rows.push(
                                                                <tr
                                                                    key={`${timeslotID}-break`}
                                                                >
                                                                    <td>
                                                                        {
                                                                            beforeBreakTime[
                                                                                timeslotID
                                                                            ]
                                                                        }
                                                                    </td>
                                                                    <td
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className="opacity-50 col-span-full text-center"
                                                                    >
                                                                        <span className="divider m-0">
                                                                            break
                                                                            time
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        return rows;
                                                    }
                                                )}
                                            </tbody>
                                        </table>
                                    </React.Fragment>
                                )
                            )}
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;

// /* eslint-disable no-undef */
// /* eslint-disable  no-restricted-globals */
// /* eslint-disable  no-unused-expressions */
// /* eslint-disable import/no-amd */
