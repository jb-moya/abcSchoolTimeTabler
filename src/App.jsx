import React, { useState } from "react";
import packInt16ToInt32 from "./utils/packInt16ToInt32";
import Navbar from "./components/Navbar";
import { useSelector } from "react-redux";

import { wrap } from "comlink";
import WasmWorker from "./wasm.worker?worker";
import SubjectListContainer from "./components/SubjectListContainer";
import TeacherListContainer from "./components/TeacherListContainer";
import SectionListContainer from "./components/SectionListContainer";
const getTimetable = wrap(new WasmWorker());

function App() {
    const { subjects } = useSelector((state) => state.subject);
    const { teachers } = useSelector((state) => state.teacher);
    const { sections } = useSelector((state) => state.section);

    const [timetable, setTimetable] = useState([]);
    const [sectionTimetable, setSectionTimetable] = useState({});
    const [teacherTimetable, setTeacherTimetable] = useState({});

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
                acc[index] = value.id;
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

        const teacherSubjectsLength = 0;

        const teacherSubjects = new Int32Array([
            // packInt16ToInt32(0, 0),
            // packInt16ToInt32(0, 1),
            // packInt16ToInt32(0, 3),
            // packInt16ToInt32(1, 2),
            // packInt16ToInt32(2, 3),
            // packInt16ToInt32(3, 4),
            // packInt16ToInt32(4, 5),
            // packInt16ToInt32(5, 6),
            // packInt16ToInt32(6, 7),
        ]);

        const params = {
            maxIterations: max_iterations,
            numTeachers: numTeachers,
            numRooms: numRooms,
            numTimeslots: num_timeslots,
            totalSchoolClass: totalSchoolClass,
            totalSection: totalSection,
            sectionSubjects: sectionSubjects,
            teacherSubjects: teacherSubjects,
            teacherSubjectsLength: teacherSubjectsLength,
            beesPopulation: beesPopulations,
            beesEmployed: beesEmployedOptions,
            beesOnlooker: beesOnlookerOptions,
            beesScout: beesScoutOptions,
            limits: limits,
        };

        const timetable = await getTimetable(params);

        const timetableMap = [];
        const sectionTimetable = {};
        const teacherTimetable = {};

        // console.log("testing subjectmap", subjectMap["1"]);

        for (const entry of timetable) {
            // console.log("F", entry, typeof entry[0]);
            const section = sectionMap[entry[0]].id;
            const subject = subjectMap[entry[1]];
            const teacher = teacherMap[entry[2]];
            const timeslot = entry[3];

            timetableMap.push({
                section: section,
                subject: section,
                teacher: section,
                timeslot: section,
            });

            if (!Array.isArray(sectionTimetable[section])) {
                sectionTimetable[section] = []; // Initialize as an empty array if it does not exist or is not an array
            }

            sectionTimetable[section].push({
                subject: subject,
                teacher: teacher,
                timeslot: timeslot,
            });

            if (!Array.isArray(teacherTimetable[teacher])) {
                teacherTimetable[teacher] = []; // Initialize as an empty array if it does not exist or is not an array
            }

            teacherTimetable[teacher].push({
                section: section,
                subject: subject,
                timeslot: timeslot,
            });
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
                        className="btn btn-primary"
                        onClick={() => handleButtonClick()}
                    >
                        Generate Timetable
                    </button>
                </div>

                <div className="w-8/12">
                    <div className="overflow-x-auto">
                        {sectionTimetable !== null &&
                            Object.entries(sectionTimetable).map(
                                ([sectionID, section]) => (
                                    <React.Fragment key={sectionID}>
                                        <div className="font-bold text-center">
                                            <div>section:</div>
                                            <div className="text-accent">
                                                {sections[sectionID].section}
                                            </div>
                                        </div>
                                        <table className="table table-zebra bg-base-100">
                                            {/* head */}
                                            <thead>
                                                <tr>
                                                    <th></th>
                                                    <th>Subject</th>
                                                    <th>teacher</th>
                                                    <th>timeslot</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {section.map((subject) => (
                                                    <tr key={subject.subject}>
                                                        <th></th>
                                                        <td>
                                                            {
                                                                subjects[
                                                                    subject
                                                                        .subject
                                                                ].subject
                                                            }
                                                        </td>
                                                        <td>
                                                            {
                                                                teachers[
                                                                    subject
                                                                        .teacher
                                                                ].teacher
                                                            }
                                                        </td>
                                                        <td>
                                                            {subject.timeslot}
                                                        </td>
                                                    </tr>
                                                ))}
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
                                        <div className="font-bold text-center">
                                            <div>Teacher: </div>
                                            <div className="text-lg text-accent">
                                                {teachers[teacherID].teacher}
                                            </div>
                                        </div>
                                        <table className="table table-zebra bg-base-100 border p-10">
                                            {/* head */}
                                            <thead>
                                                <tr>
                                                    <th></th>
                                                    <th>Section</th>
                                                    <th>subject</th>
                                                    <th>timeslot</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teacher.map((teacher) => (
                                                    <tr key={teacher.timeslot}>
                                                        <th></th>
                                                        <td>
                                                            {
                                                                sections[
                                                                    teacher
                                                                        .section
                                                                ].section
                                                            }
                                                        </td>
                                                        <td>
                                                            {
                                                                subjects[
                                                                    teacher
                                                                        .subject
                                                                ].subject
                                                            }
                                                        </td>
                                                        <td>
                                                            {teacher.timeslot}
                                                        </td>
                                                    </tr>
                                                ))}
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
