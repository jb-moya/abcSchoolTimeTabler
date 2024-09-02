import React, { useState, useEffect } from "react";
import packInt16ToInt32 from "./utils/packInt16ToInt32";
import Navbar from "./components/Navbar";
import { useSelector } from "react-redux";

import { wrap } from "comlink";
import WasmWorker from "./wasm.worker?worker";
import SubjectListContainer from "./components/SubjectListContainer";
import TeacherListContainer from "./components/TeacherListContainer";
import SectionListContainer from "./components/SectionListContainer";
import ProgramListContainer from "./components/ProgramListContainer";
import clsx from "clsx";
import NotificationHandler from "./components/NotificationHandler";
import GeneratedTimetable from "./components/TimeTable";
import validateTimetableVariables from "./validation/validateTimetableVariables";
import { toast } from "sonner";
import ViolationList from "./components/ViolationList";
import Dashboard from "./components/Dashboard";
import findInObject from "./utils/utils";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

const getTimetable = wrap(new WasmWorker());

function App() {
    const { subjects } = useSelector((state) => state.subject);
    const { teachers } = useSelector((state) => state.teacher);
    const { sections } = useSelector((state) => state.section);
    const { programs } = useSelector((state) => state.program);

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(5);

    const [timetable, setTimetable] = useState([]);
    const [sectionTimetables, setSectionTimetables] = useState({});
    const [teacherTimetables, setTeacherTimetables] = useState({});
    const [timetableGenerationStatus, setTimetableGenerationStatus] =
        useState("idle");
    const [violations, setViolations] = useState([]);

    // Scope and Limitations
    // Room-Section Relationship: Each room is uniquely assigned to a specific subject, establishing a 1:1 relationship.
    // Due to this strict pairing, room allocation is not a factor in timetable generation.

    // Curriculum-Driven Course Selection: Students are required to follow a predefined curriculum.
    // They do not have the option to select subjects independently.

    // Standardized Class Start and Break Times: The start time for the first class and the timing of breaks are
    // standardized across all sections and teachers, ensuring uniformity in the daily schedule.

    const timeSlotMap = {
        0: "06:00 - 06:40",
        1: "06:40 - 07:20",
        2: "07:20 - 08:00",
        3: "08:00 - 08:40",
        4: "08:40 - 09:20",
        5: "09:20 - 10:00",
        6: "10:00 - 10:40",
        7: "10:40 - 11:20",
        8: "11:20 - 12:00",
        9: "12:00 - 12:40",
        10: "12:40 - 01:20",
    };

    const beforeBreakTime = {
        2: "08:30 - 09:00",
        // 6: "12:20 - 01:00",
    };

    const validate = () => {
        const { canProceed, violations } = validateTimetableVariables({
            sections,
            teachers,
            subjects,
            programs,
        });

        if (!canProceed) {
            if (violations.some((v) => v.type === "emptyDatabase")) {
                toast.error("One or more tables are empty.");
            } else {
                toast.error("Invalid timetable variables");
            }
            setViolations(violations);
            return false;
        }

        setViolations([]);
        return true;
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
                return acc;
            },
            {}
        );

        const sectionMap = Object.entries(sections).reduce(
            (acc, [, value], index) => {
                // Assuming value.subjects is an object with subject IDs as keys
                const subjectIDs = Object.keys(value.subjects);

                acc[index] = {
                    // Map over the subject IDs to transform them using subjectMapReverse
                    subjects: subjectIDs.map(
                        (subjectID) => subjectMapReverse[subjectID]
                    ),
                    // Process the units associated with each subject
                    subjectUnits: Object.keys(value.subjects).reduce(
                        (unitAcc, subjectID) => {
                            let mappedKey = subjectMapReverse[subjectID];
                            unitAcc[mappedKey] = value.subjects[subjectID]; // Use value.subjects[subjectID] to get the number of units
                            return unitAcc;
                        },
                        {}
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
        console.log("sectionMap", sectionMap);

        const sectionSubjectArray = [];
        const sectionSubjectUnitArray = [];
        const sectionSubjectDuration = [];

        let cellCount = 0;
        for (const [sectionKey, { subjects, subjectUnits }] of Object.entries(
            sectionMap
        )) {
            for (const subject of subjects) {
                sectionSubjectArray.push(packInt16ToInt32(sectionKey, subject));
            }

            for (const unit of Object.keys(subjectUnits)) {
                const unitCount = subjectUnits[unit];

                if (unitCount === 0) {
                    cellCount++;
                } else {
                    cellCount += unitCount;
                }

                sectionSubjectUnitArray.push(
                    packInt16ToInt32(unit, subjectUnits[unit])
                );

                sectionSubjectDuration.push(packInt16ToInt32(unit, 1));
            }
        }

        const sectionSubjects = new Int32Array([...sectionSubjectArray]);
        const sectionSubjectUnits = new Int32Array([
            ...sectionSubjectUnitArray,
        ]);
        const sectionSubjectDurations = new Int32Array([
            ...sectionSubjectDuration,
        ]);

        const max_iterations = 10000;
        const beesPopulations = 50;
        const beesEmployedOptions = 25;
        const beesOnlookerOptions = 25;
        const beesScoutOptions = 1;
        const limits = 200;
        const numTeachers = Object.keys(teacherMap).length;
        const numRooms = 7;
        const num_timeslots = 7;
        const totalSchoolClass = sectionSubjectArray.length;
        const totalSection = Object.keys(sectionMap).length;

        const teacherSubjectArray = [];

        for (const [teacherKey, { subjects }] of Object.entries(teacherMap)) {
            for (const subject of subjects) {
                teacherSubjectArray.push(packInt16ToInt32(teacherKey, subject));
            }
        }

        const teacherSubjects = new Int32Array([...teacherSubjectArray]);

        const sectionStartArray = [];

        for (let i = 0; i < totalSection; i++) {
            sectionStartArray[i] = 0;
        }

        const sectionStarts = new Int32Array([...sectionStartArray]);

        const params = {
            maxIterations: max_iterations,
            numTeachers: numTeachers,
            numRooms: numRooms,
            numTimeslots: num_timeslots,
            totalSchoolClass: totalSchoolClass,
            totalCellBlock: cellCount,
            totalSection: totalSection,
            sectionSubjects: sectionSubjects,
            sectionSubjectDurations: sectionSubjectDurations,
            sectionStarts: sectionStarts,
            teacherSubjects: teacherSubjects,
            sectionSubjectUnits: sectionSubjectUnits,
            teacherSubjectsLength: teacherSubjects.length,
            beesPopulation: beesPopulations,
            beesEmployed: beesEmployedOptions,
            beesOnlooker: beesOnlookerOptions,
            beesScout: beesScoutOptions,
            limits: limits,
            workWeek: numOfSchoolDays,
            maxTeacherWorkLoad: 9,
            resultLength: cellCount,
        };

        setTimetableGenerationStatus("running");
        const { timetable, status } = await getTimetable(params);
        setTimetableGenerationStatus(status);

        const timetableMap = [];
        const sectionTimetable = {};
        const teacherTimetable = {};

        for (const entry of timetable) {
            // console.log("F", entry, typeof entry[0]);
            const section = sectionMap[entry[0]].id;
            const subject = subjectMap[entry[1]];
            const teacher = teacherMap[entry[2]].id;
            const timeslot = entry[3];
            const day = entry[4];

            const existingSectionEntry = findInObject(
                sectionTimetable[section],
                ["subject", "teacher", "timeslot"],
                [subject, teacher, timeslot]
            );

            // const existingSectionEntry = false;

            if (existingSectionEntry) {
                // If it exists, push the day to the existing entry's day array
                if (Array.isArray(existingSectionEntry.day)) {
                    existingSectionEntry.day.push(day);
                } else {
                    console.log("ff", existingSectionEntry.day);
                    existingSectionEntry.day = [existingSectionEntry.day, day];
                }
            } else {
                // If it doesn't exist, create a new entry
                sectionTimetable[section] = sectionTimetable[section] || {};
                sectionTimetable[section][timeslot] =
                    sectionTimetable[section][timeslot] || [];
                sectionTimetable[section][timeslot].push({
                    subject: subject,
                    teacher: teacher,
                    timeslot: timeslot,
                    day: [day],
                });
            }

            const existingTeacherEntry = findInObject(
                teacherTimetable[teacher],
                ["section", "subject", "timeslot"],
                [section, subject, timeslot]
            );

            if (existingTeacherEntry) {
                if (Array.isArray(existingTeacherEntry.day)) {
                    existingTeacherEntry.day.push(day);
                } else {
                    existingTeacherEntry.day = [existingTeacherEntry.day, day];
                }
            } else {
                teacherTimetable[teacher] = teacherTimetable[teacher] || {};
                teacherTimetable[teacher][timeslot] =
                    teacherTimetable[teacher][timeslot] || [];
                teacherTimetable[teacher][timeslot].push({
                    section: section,
                    subject: subject,
                    timeslot: timeslot,
                    day: [day],
                });
            }

            // Sort teacherTimetable by timeslot and day
            // teacherTimetable[teacher] = sortObjectByTimeslotAndDay(
            //     teacherTimetable[teacher]
            // );
        }

        // setTimetable(timetable);
        // console.log("timetable", timetableMap);
        // console.log("section timetable", sectionTimetable);
        // console.log("teacher timetable", teacherTimetable);
        // return;

        setTimetable(timetableMap);
        setSectionTimetables(sectionTimetable);
        setTeacherTimetables(teacherTimetable);
    };

    useEffect(() => {
        // Function to handle the beforeunload event
        const handleBeforeUnload = (event) => {
            if (timetableGenerationStatus === "running") {
                event.preventDefault();
                event.returnValue = ""; // Legacy for older browsers
            }
        };

        // Add the event listener
        window.addEventListener("beforeunload", handleBeforeUnload);

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [timetableGenerationStatus]); // The effect depends on the isProcessRunning state

    return (
        <div className="App container mx-auto px-4 mb-10">
            <NotificationHandler
                timetableCondition={timetableGenerationStatus}
            />

            <header className="App-header">
                <Navbar />

                <div className="w-full flex justify-center my-5">
                    <Dashboard />
                </div>

                <div className="mb-10">
                    <h1 className="divider">Configuration</h1>
                    <div className="join border border-base-content">
                        <div className="join-item px-2">
                            {" "}
                            Number of Days in week
                        </div>
                        <input
                            type="number"
                            placeholder="eg. 5 (mon to fri)"
                            className="input w-full join-item"
                            value={numOfSchoolDays}
                            onChange={(e) => {
                                setNumOfSchoolDays(e.target.value);
                            }}
                        />
                    </div>
                    <h1 className="divider"></h1>
                </div>

                <div className="flex gap-4">
                    <div className="w-5/12">
                        <SubjectListContainer />
                    </div>
                    <div className="w-7/12">
                        <TeacherListContainer />
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-12/12">
                        <ProgramListContainer />
                    </div>
                </div>
                <div className="w-full">
                    <SectionListContainer />
                    <button
                        className={clsx("btn btn-primary w-full", {
                            "cursor-not-allowed":
                                timetableGenerationStatus === "running",
                            "btn-error": timetableGenerationStatus === "error",
                        })}
                        onClick={() => {
                            if (validate()) {
                                handleButtonClick();
                            }
                        }}
                        disabled={timetableGenerationStatus === "running"}
                    >
                        {timetableGenerationStatus == "running" ? (
                            <div className="flex gap-2">
                                <span>Generating</span>
                                <span className="loading loading-spinner loading-xs"></span>
                            </div>
                        ) : (
                            "Generate Timetable"
                        )}
                    </button>

                    <div>
                        <ViolationList violations={violations} />
                    </div>
                </div>

                <div className="grid grid-cols-1 col-span-full gap-4 sm:grid-cols-2">
                    <GeneratedTimetable
                        timetables={sectionTimetables}
                        collection={sections}
                        field={"section"}
                        timeSlotMap={timeSlotMap}
                        firstColumnMap={subjects}
                        secondColumnMap={teachers}
                        columnField={["subject", "teacher"]}
                        beforeBreakTime={beforeBreakTime}
                    />

                    <GeneratedTimetable
                        timetables={teacherTimetables}
                        collection={teachers}
                        field={"teacher"}
                        timeSlotMap={timeSlotMap}
                        firstColumnMap={sections}
                        secondColumnMap={subjects}
                        columnField={["section", "subject"]}
                        beforeBreakTime={beforeBreakTime}
                    />
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
