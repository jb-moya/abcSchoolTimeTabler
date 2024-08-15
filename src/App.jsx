import React, { useState, useEffect } from "react";
import packInt16ToInt32 from "./utils/packInt16ToInt32";
import Navbar from "./components/Navbar";
import { useSelector } from "react-redux";

import { wrap } from "comlink";
import WasmWorker from "./wasm.worker?worker";
import SubjectListContainer from "./components/SubjectListContainer";
import TeacherListContainer from "./components/TeacherListContainer";
import SectionListContainer from "./components/SectionListContainer";
import clsx from "clsx";
import NotificationHandler from "./components/NotificationHandler";
import GeneratedTimetable from "./components/TimeTable";
import validateTimetableVariables from "./validation/validateTimetableVariables";
import { toast } from "sonner";
import ViolationList from "./components/ViolationList";
import Dashboard from "./components/Dashboard";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

const getTimetable = wrap(new WasmWorker());

function App() {
    const { subjects } = useSelector((state) => state.subject);
    const { teachers } = useSelector((state) => state.teacher);
    const { sections } = useSelector((state) => state.section);

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(5);

    const [timetable, setTimetable] = useState([]);
    const [sectionTimetable, setSectionTimetable] = useState({});
    const [teacherTimetable, setTeacherTimetable] = useState({});
    const [timetableGenerationStatus, setTimetableGenerationStatus] =
        useState("idle");
    const [violations, setViolations] = useState([]);

    // Scope and Limitations
    // Room-Section Relationship: Each room is uniquely assigned to a specific subject, establishing a 1:1 relationship.
    // Due to this strict pairing, room allocation is not a factor in timetable generation.

    // Uniform Weekly Schedule: Time slots for classes remain consistent across all days of the week.
    // There are no variations in the daily schedule for classes.

    // Curriculum-Driven Course Selection: Students are required to follow a predefined curriculum.
    // They do not have the option to select subjects independently.

    // Standardized Class Start and Break Times: The start time for the first class and the timing of breaks are
    // standardized across all sections and teachers, ensuring uniformity in the daily schedule.

    const timeSlotMap = {
        0: "06:00 - 06:50",
        1: "06:50 - 07:40",
        2: "07:40 - 08:30",
        3: "09:00 - 09:50",
        4: "09:50 - 10:40",
        5: "10:40 - 11:30",
        6: "11:30 - 12:20",
        7: "01:10 - 02:00",
        8: "02:00 - 02:50",
        9: "02:50 - 03:40",
        10: "03:40 - 04:30",
    };

    const beforeBreakTime = {
        2: "08:30 - 09:00",
        6: "12:20 - 01:00",
    };

    const validate = () => {
        const { canProceed, violations } = validateTimetableVariables({
            sections,
            teachers,
            subjects,
        });

        if (!canProceed) {
            toast.error("Invalid timetable variables");
            console.log(violations);
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
                    units: Object.keys(value.units).reduce((acc, key) => {
                        let mappedKey = subjectMapReverse[key];

                        acc[mappedKey] = value.units[key];
                        return acc;
                    }, {}),
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
        // console.log("sectionMap", sectionMap);
        for (const [sectionKey, { subjects, units }] of Object.entries(
            sectionMap
        )) {
            for (const subject of subjects) {
                
                console.log("ghh : ", sectionKey, subject, units);
                sectionSubjectArray.push(packInt16ToInt32(sectionKey, subject));
            }

            for (const unit of Object.keys(units)) {
                console.log("unit", unit);
                sectionSubjectUnitArray.push(packInt16ToInt32(unit, units[unit]));
            }
        }

        const sectionSubjects = new Int32Array([...sectionSubjectArray]);
        const sectionSubjectUnits = new Int32Array([
            ...sectionSubjectUnitArray,
        ]);

        // return;
        const max_iterations = 30000;
        const beesPopulations = 50;
        const beesEmployedOptions = 25;
        const beesOnlookerOptions = 25;
        const beesScoutOptions = 1;
        const limits = 4;

        //    0   3   0   3   0
        //    1   3   1   1   2
        //    2   3   2   2   1
        //    3   2   0   0   2
        //    4   2   1   1   1
        //    5   2   2   2   0
        //    6   1   0   3   2
        //    7   1   1   1   0
        //    8   1   2   2   1
        //    9   0   0   0   0
        //   11   0   2   2   2
        //   10   0   1   3   1

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
        const num_timeslots = 7;
        const totalSchoolClass = sectionSubjectArray.length;
        const totalSection = Object.keys(sectionMap).length;

        const teacherSubjectArray = [];

        // console.log("teacherMap", teacherMap);
        for (const [teacherKey, { subjects }] of Object.entries(teacherMap)) {
            for (const subject of subjects) {
                // console.log("hehe", teacherKey, subject);
                teacherSubjectArray.push(packInt16ToInt32(teacherKey, subject));
            }
        }

        const teacherSubjects = new Int32Array([...teacherSubjectArray]);

        const params = {
            maxIterations: max_iterations,
            numTeachers: numTeachers,
            numRooms: numRooms,
            numTimeslots: num_timeslots,
            totalSchoolClass: totalSchoolClass,
            totalSection: totalSection,
            sectionSubjects: sectionSubjects,
            teacherSubjects: teacherSubjects,
            sectionSubjectUnits: sectionSubjectUnits,
            teacherSubjectsLength: teacherSubjects.length,
            beesPopulation: beesPopulations,
            beesEmployed: beesEmployedOptions,
            beesOnlooker: beesOnlookerOptions,
            beesScout: beesScoutOptions,
            limits: limits,
            workWeek: numOfSchoolDays,
        };

        setTimetableGenerationStatus("running");
        const { timetable, status } = await getTimetable(params);
        // console.log("success", timetable, status);
        setTimetableGenerationStatus(status);

        return;

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
        // console.log("section timetable", sectionTimetable);
        // console.log("teacher timetable", teacherTimetable);

        setTimetable(timetableMap);
        setSectionTimetable(sectionTimetable);
        setTeacherTimetable(teacherTimetable);

        return;
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

                        <div className="join join-item join-vertical flex w-20 items-center border-y border-r border-primary">
                            <button
                                className="join-item h-1/2 w-full bg-secondary hover:brightness-110 flex justify-center"
                                onClick={() => {
                                    if (numOfSchoolDays == 7) {
                                        return;
                                    }
                                    setNumOfSchoolDays(numOfSchoolDays + 1);
                                }}
                            >
                                <BiChevronUp size={24} />
                            </button>
                            <button
                                className="join-item h-1/2 w-full bg-secondary hover:brightness-110 flex justify-center"
                                onClick={() => {
                                    if (numOfSchoolDays == 1) {
                                        return;
                                    }

                                    setNumOfSchoolDays(numOfSchoolDays - 1);
                                }}
                            >
                                <BiChevronDown size={24} />
                            </button>
                        </div>
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
                        timetable={sectionTimetable}
                        collection={sections}
                        field={"section"}
                        timeSlotMap={timeSlotMap}
                        firstColumnMap={subjects}
                        secondColumnMap={teachers}
                        columnField={["subject", "teacher"]}
                        beforeBreakTime={beforeBreakTime}
                    />

                    <GeneratedTimetable
                        timetable={teacherTimetable}
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
