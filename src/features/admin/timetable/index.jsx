import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import packInt16ToInt32 from '@utils/packInt16ToInt32';
import { useSelector } from 'react-redux';
import { wrap } from 'comlink';
import WasmWorker from '@src/wasm.worker?worker';
import Configuration from '@components/Admin/Configuration';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import GeneratedTimetable from '@components/Admin/TimeTable';
import validateTimetableVariables from '@validation/validateTimetableVariables';
import { toast } from 'sonner';
import ViolationList from '@components/Admin/ViolationList';
import SubjectListContainer from '@components/Admin/SubjectListContainer';
import ProgramListContainer from '@components/Admin/ProgramListContainer';
import TeacherListContainer from '@components/Admin/Teacher/TeacherListContainer';
import SectionListContainer from '@components/Admin/SectionListContainer';
import ExportImportDBButtons from '@components/Admin/ExportImportDBButtons';

import { getTimeSlotIndex } from '@components/Admin/timeSlotMapper';

import { getTimeSlotString } from '../../../components/Admin/timeSlotMapper';
import Breadcrumbs from '@components/Admin/Breadcrumbs';
import {
    clearAllEntriesAndResetIDs,
} from "@src/indexedDB";

import { fetchSections, editSection } from '@features/sectionSlice';
import { fetchPrograms, editProgram } from '@features/programSlice';
import { fetchSubjects } from '@features/subjectSlice';
import { original } from 'immer';

const getTimetable = wrap(new WasmWorker());

function Timetable() {
    const dispatch = useDispatch();

    const links = [
        { name: 'Home', href: '/' },
        // { name: 'Modify Subjects', href: '/modify-subjects' },
    ];

    const { subjects: subjectsStore, status: subjectStatus } = useSelector((state) => state.subject);
    const { teachers: teachersStore } = useSelector((state) => state.teacher);
    const { sections: sectionsStore, status: sectionStatus } = useSelector((state) => state.section);
    const { programs: programsStore, status: programStatus } = useSelector((state) => state.program);

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return localStorage.getItem('numOfSchoolDays') || 5;
    });
    const [prevNumOfSchoolDays, setPrevNumOfSchoolDays] = useState(numOfSchoolDays);

    const [sectionTimetables, setSectionTimetables] = useState({});
    const [teacherTimetables, setTeacherTimetables] = useState({});
    const [timetableGenerationStatus, setTimetableGenerationStatus] =
        useState('idle');
    const [violations, setViolations] = useState([]);

    const [refreshKey, setRefreshKey] = useState(0);

    // Scope and Limitations
    // Room-Section Relationship: Each room is uniquely assigned to a specific subject, establishing a 1:1 relationship.
    // Due to this strict pairing, room allocation is not a factor in timetable generation.
    // Curriculum-Driven Course Selection: Students are required to follow a predefined curriculum.
    // They do not have the option to select subjects independently.
    // Standardized Class Start and Break Times: The start time for the first class and the timing of breaks are
    // standardized across all sections and teachers, ensuring uniformity in the daily schedule.

    const validate = () => {
        const { canProceed, violations } = validateTimetableVariables({
            sections: sectionsStore,
            teachers: teachersStore,
            subjects: subjectsStore,
            programs: programsStore,
        });

        if (!canProceed) {
            if (violations.some((v) => v.type === 'emptyDatabase')) {
                toast.error('One or more tables are empty.');
            } else {
                toast.error('Invalid timetable variables');
            }
            setViolations(violations);
            return false;
        }

        setViolations([]);
        return true;
    };

    const handleButtonClick = async () => {
        const subjectMap = Object.entries(subjectsStore).reduce(
            (acc, [, value], index) => {
                acc[index] = value.id;
                return acc;
            },
            {}
        );

        const subjectMapReverse = Object.entries(subjectsStore).reduce(
            (acc, [, subject], index) => {
                acc[subject.id] = {
                    id: index,
                    numOfClasses: Math.min(
                        Math.ceil(
                            subject.weeklyMinutes / subject.classDuration
                        ),
                        numOfSchoolDays
                    ),
                    classDuration: subject.classDuration,
                };
                return acc;
            },
            {}
        );

        const teacherMap = Object.entries(teachersStore).reduce(
            (acc, [, teacher], index) => {
                acc[index] = {
                    subjects: teacher.subjects.map(
                        (subjectID) => subjectMapReverse[subjectID].id
                    ),
                    id: teacher.id,
                };
                return acc;
            },
            {}
        );

        let currentClassBlockID = 0;
        let classBlock = new Map();

        const sectionSubjectConfigurationArray = [];

        Object.entries(sectionsStore).forEach(([key, section]) => {
            console.log('GUGU', key, section);

            const fixedDays = section.fixedDays;
            const fixedPositions = section.fixedPositions;

            const set = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

            Object.keys(fixedPositions).forEach((subjectID) => {
                fixedPositions[subjectID].forEach((day) => {
                    set.delete(fixedPositions[subjectID][day]);
                });
            });

            console.log('set heh', set, set.size);

            section.subjects.forEach((subjectID) => {
                const consistentEveryDay = fixedDays[subjectID].every(
                    (element) => element === 0
                );

                if (consistentEveryDay) {
                    sectionSubjectConfigurationArray.push([
                        subjectMapReverse[subjectID].id,
                        0,
                        subjectMapReverse[subjectID].numOfClasses,
                        subjectMapReverse[subjectID].classDuration,
                        fixedDays[subjectID][0],
                    ]);
                }
            });
        });

        // const result = Object.entries(sectionsStore).map(([key, section]) => {
        //     console.log('vvvv ~ handleButtonClick ~ section:', section);

        //     // return { key, value };
        // });

        // Do something with key and value
        // const subjectIDs = Object.keys(section.subjects);
        // console.log("🚀 ~ handleButtonClick =- ~ subjectIDs:", subjectIDs)
        const classBlockConfigMap = Object.entries(sectionsStore).reduce(
            (acc, [, section], index) => {
                console.log('🚀 ~ sectionMap ~ section:', section);

                // Assuming section.subjects is an object with subject IDs as keys
                const subjectIDs = Object.keys(section.subjects);

                acc[index] = {
                    // Map over the subject IDs to transform them using subjectMapReverse
                    // subjects: subjectIDs.map(
                    //     (subjectID) => subjectMapReverse[subjectID]
                    // ),

                    // Process the units associated with each subject
                    // subjectUnits: Object.keys(section.subjects).reduce(
                    //     (unitAcc, subjectID) => {
                    //         let mappedKey = subjectMapReverse[subjectID];
                    //         console.log(
                    //             '🚀 ~ handleButtonClick ~ mappedKey:',
                    //             mappedKey
                    //         );

                    //         unitAcc[mappedKey] = section.subjects[subjectID];
                    //         return unitAcc;
                    //     },
                    //     {}
                    // ),

                    startTime: section.startTime,
                    id: section.id,
                };

                return acc;
            },
            {}
        );

        const sectionMap = Object.entries(sectionsStore).reduce(
            (acc, [, section], index) => {
                console.log('🚀 ~ sectionMap ~ section:', section);

                // Assuming section.subjects is an object with subject IDs as keys
                const subjectIDs = Object.keys(section.subjects);

                acc[index] = {
                    // Map over the subject IDs to transform them using subjectMapReverse
                    // subjects: subjectIDs.map(
                    //     (subjectID) => subjectMapReverse[subjectID]
                    // ),

                    // Process the units associated with each subject
                    // subjectUnits: Object.keys(section.subjects).reduce(
                    //     (unitAcc, subjectID) => {
                    //         let mappedKey = subjectMapReverse[subjectID];
                    //         console.log(
                    //             '🚀 ~ handleButtonClick ~ mappedKey:',
                    //             mappedKey
                    //         );

                    //         unitAcc[mappedKey] = section.subjects[subjectID];
                    //         return unitAcc;
                    //     },
                    //     {}
                    // ),

                    startTime: section.startTime,
                    id: section.id,
                };

                return acc;
            },
            {}
        );

        console.log('subjectMap', subjectMap);
        console.log('subjectMapReverse', subjectMapReverse);
        console.log('teacherMap', teacherMap);
        console.log('sectionMap', sectionMap);

        let defaultClassDuration = 40;
        let breakTimeDuration = 30;

        let maxTeacherWorkLoad = 300;
        let minTeacherWorkLoad = 10;

        let timeDivision = 10;

        defaultClassDuration /= timeDivision;
        breakTimeDuration /= timeDivision;
        maxTeacherWorkLoad /= timeDivision;
        minTeacherWorkLoad /= timeDivision;

        const sectionSubjectArray = [];
        const sectionSubjectUnitArray = [];
        const sectionSubjectDurationArray = [];
        const sectionSubjectOrderArray = [];
        const sectionStartArray = [];

        let lowestSubjectDuration = breakTimeDuration;

        // console.log('🚀 ~ handleButtonClick ~ subjectsStore:', subjectsStore);

        Object.entries(subjectsStore).forEach(([key, value]) => {
            console.log(`Key: ${key}, Value: ${value}`);

            if (value.classDuration < lowestSubjectDuration) {
                lowestSubjectDuration = value.classDuration;
            }
        });

        const commonSubjectCount = 9;

        // const defaultOrder = 0;

        let offset = lowestSubjectDuration - 1;

        let minTotalClassDurationForTwoBreaks =
            commonSubjectCount * defaultClassDuration;

        defaultClassDuration -= offset;
        breakTimeDuration -= offset;
        minTotalClassDurationForTwoBreaks /= offset;

        // let cellCount = 0;
        for (const [sectionKey, section] of Object.entries(sectionMap)) {
            console.log('🚀 ~ handleButtonClick ~ section:', section);
            // let rowCount = 0;

            // for (const subject of subjects) {
            //     sectionSubjectArray.push(packInt16ToInt32(sectionKey, subject));
            // }

            // for (const subject of Object.keys(subjectUnits)) {
            //     // console.log('🚀 ~ handleButtonClick ~ subject:', subject);
            //     const unitCount = subjectUnits[subject][0];

            //     if (unitCount === 0) {
            //         // cellCount++;
            //         // rowCount += numOfSchoolDays;
            //         // console.log("🚀 ~ handleButtonClick ~ numOfSchoolDays:", typeof numOfSchoolDays)
            //     } else {
            //         // cellCount += unitCount;
            //         // rowCount += unitCount;
            //     }

            //     sectionSubjectUnitArray.push(
            //         packInt16ToInt32(subject, subjectUnits[subject][0])
            //     );

            //     sectionStartArray[sectionKey] = startTime;

            //     // TODO: might there be code smell on how it stores

            //     sectionSubjectDurationArray.push(
            //         packInt16ToInt32(
            //             subject,
            //             subjectsStore[subjectMap[subject]].classDuration / 10 -
            //                 offset
            //         )
            //     );

            //     sectionSubjectOrderArray.push(
            //         packInt16ToInt32(subject, subjectUnits[subject][1])
            //     );
            // }

            // console.log('🚀 ~ handleButtonClick ~ rowCount:', rowCount);
            // rowCount = Math.trunc(rowCount / numOfSchoolDays);
            // let numOfBreak = rowCount < 10 ? 1 : 2;
            // cellCount += numOfBreak;
        }

        return;

        const sectionSubjects = new Int32Array([...sectionSubjectArray]);
        const sectionSubjectUnits = new Int32Array([
            ...sectionSubjectUnitArray,
        ]);
        const sectionSubjectDurations = new Int32Array([
            ...sectionSubjectDurationArray,
        ]);
        const sectionSubjectOrders = new Int32Array([
            ...sectionSubjectOrderArray,
        ]);

        const maxIterations = 100;
        const beesPopulations = 4;
        const beesEmployed = 2;
        const beesOnlooker = 2;
        const beesScout = 1;
        const totalTeachers = Object.keys(teacherMap).length;
        const totalSections = Object.keys(sectionMap).length;

        const limits = totalTeachers * totalSections;

        const sectionStarts = new Int32Array([...sectionStartArray]);

        const teacherSubjectArray = [];
        const teacherWeekLoadConfigArray = [];

        for (const [teacherKey, { subjects }] of Object.entries(teacherMap)) {
            for (const subject of subjects) {
                teacherSubjectArray.push(packInt16ToInt32(teacherKey, subject));
                teacherWeekLoadConfigArray.push(
                    packInt16ToInt32(maxTeacherWorkLoad, minTeacherWorkLoad)
                );
            }
        }

        const teacherSubjects = new Int32Array([...teacherSubjectArray]);
        const teacherWeekLoadConfig = new Int32Array([
            ...teacherWeekLoadConfigArray,
        ]);

        const subjectFixedTeacherSection = new Int32Array([-1]);
        const subjectFixedTeacher = new Int32Array([-1]);

        const teacherBreakThreshold = 4;

        const numOfViolationType = 7;

        const resultTimetableLength =
            totalSections *
            Object.entries(subjectsStore).length *
            numOfSchoolDays;

        const resultViolationLength =
            numOfViolationType * totalSections +
            numOfViolationType * totalTeachers;

        const teacherMiddleTimePointGrowAllowanceForBreakTimeslot = 4;

        const params2 = {
            maxIterations: maxIterations,
            numTeachers: totalTeachers,
            totalSectionSubjects: null,
            totalSection: totalSections,
            numberOfSubjectConfiguration: null,
            sectionConfiguration: null,
            sectionSubjectConfiguration: null,
            subjectConfigurationSubjectUnits: null,
            subjectConfigurationSubjectDuration: null,
            subjectConfigurationSubjectFixedTimeslot: null,
            subjectConfigurationSubjectFixedDay: null,
            subjectFixedTeacherSection: subjectFixedTeacherSection,
            subjectFixedTeacher: subjectFixedTeacher,
            sectionStart: sectionStarts,
            teacherSubjects: teacherSubjects,
            teacherWeekLoadConfig: teacherWeekLoadConfig,
            teacherSubjectsLength: teacherSubjects.length,
            beesPopulation: beesPopulations,
            beesEmployed: beesEmployed,
            beesOnlooker: beesOnlooker,
            beesScout: beesScout,
            limit: limits,
            workWeek: numOfSchoolDays,
            breakTimeDuration: breakTimeDuration,
            teacherBreakThreshold: teacherBreakThreshold,
            teacherMiddleTimePointGrowAllowanceForBreakTimeslot:
                teacherMiddleTimePointGrowAllowanceForBreakTimeslot,
            minTotalClassDurationForTwoBreaks:
                minTotalClassDurationForTwoBreaks,
            defaultClassDuration: defaultClassDuration,
            offsetDuration: offset,
            resultTimetableLength: resultTimetableLength,
            resultViolationLength: resultViolationLength,
            enableLogging: false,
        };

        // const params = {
        //     maxIterations: maxIterations,
        //     numTeachers: totalTeachers,
        //     totalSchoolClass: totalSchoolClass,
        //     totalSection: totalSections,

        //     sectionSubjects: sectionSubjects,
        //     sectionSubjectDurations: sectionSubjectDurations,
        //     sectionSubjectOrders: sectionSubjectOrders,
        //     sectionStarts: sectionStarts,
        //     teacherSubjects: teacherSubjects,
        //     sectionSubjectUnits: sectionSubjectUnits,
        //     teacherSubjectsLength: teacherSubjects.length,

        //     beesPopulation: beesPopulations,
        //     beesEmployed: beesEmployed,
        //     beesOnlooker: beesOnlooker,
        //     beesScout: beesScout,
        //     limits: limits,
        //     workWeek: numOfSchoolDays,

        //     maxTeacherWorkLoad: 9,
        //     breakTimeDuration: breakTimeDuration,
        //     breakTimeslotAllowance: breakTimeslotAllowance,
        //     teacherBreakThreshold: teacherBreakThreshold,
        //     minTotalClassDurationForTwoBreaks:
        //         minTotalClassDurationForTwoBreaks,
        //     defaultClassDuration: defaultClassDuration,
        //     resultTimetableLength:
        //         totalSections *
        //         Object.entries(subjectsStore).length *
        //         numOfSchoolDays,
        //     resultViolationLength:
        //         numOfViolationType * totalSections +
        //         numOfViolationType * totalTeachers,

        //     offset: offset,
        // };

        setTimetableGenerationStatus('running');
        const { timetable: generatedTimetable, status } = await getTimetable(
            // params2
            {}
        );
        setTimetableGenerationStatus(status);

        // const timetableMap = [];
        // const sectionTimetable = new Map();
        // const teacherTimetable = new Map();
        // const teacherTakenTime = new Map();

        // function addToMap(map, key, value) {
        //     map.push([key, value]);
        //     map.sort((a, b) => a[0] - b[0]);
        // }

        // const addTimeslotToTimetable = (
        //     timetableMap,
        //     section_id,
        //     subject_id,
        //     teacher_id,
        //     start,
        //     end,
        //     day,
        //     fieldName1,
        //     fieldName2,
        //     containerName
        // ) => {
        //     const timeslotData = {
        //         section: section_id,
        //         subject: subject_id,
        //         teacher: teacher_id,
        //         fieldName1: fieldName1,
        //         fieldName2: fieldName2,
        //         day: day,
        //         end: end,
        //     };

        //     if (timetableMap.has(section_id)) {
        //         const timetable = timetableMap.get(section_id);
        //         addToMap(timetable.get('timetable'), start, timeslotData);
        //     } else {
        //         const timetable = new Map();
        //         timetable.set('containerName', containerName);
        //         timetable.set('timetable', []);
        //         addToMap(timetable.get('timetable'), start, timeslotData);
        //         timetableMap.set(section_id, timetable);
        //     }
        // };

        // for (const entry of generatedTimetable) {
        //     // console.log('🚀 ~ handleButtonClick ~ entry of timetable:', entry);

        //     // console.log('x', teacher_id, start, end);

        //     const section_id = sectionMap[entry[0]].id;
        //     const subject_id = subjectMap[entry[1]] || null;
        //     const teacher_id = (teacherMap[entry[2]] || { id: null }).id;
        //     const timeslot = entry[3];
        //     const day = entry[4];

        //     const start = Number(entry[5]);
        //     const end = Number(entry[6]);

        //     addTimeslotToTimetable(
        //         sectionTimetable,
        //         section_id,
        //         subject_id,
        //         teacher_id,
        //         start,
        //         end,
        //         day,
        //         subjectsStore[subject_id]?.subject || null,
        //         teachersStore[teacher_id]?.teacher || null,
        //         sectionsStore[section_id]?.section
        //     );

        //     if (teacher_id == null) {
        //         continue;
        //     }

        //     if (teacherTakenTime.has(teacher_id)) {
        //         for (let time = start; time < end; time++) {
        //             teacherTakenTime.get(teacher_id).add(time);
        //         }
        //     } else {
        //         let takenTime = [];

        //         for (let time = start; time < end; time++) {
        //             takenTime.push(time);
        //         }

        //         teacherTakenTime.set(teacher_id, new Set(takenTime));
        //     }

        //     addTimeslotToTimetable(
        //         teacherTimetable,
        //         teacher_id,
        //         subject_id,
        //         section_id,
        //         start,
        //         end,
        //         day,
        //         sectionsStore[section_id]?.section,
        //         subjectsStore[subject_id]?.subject,
        //         teachersStore[teacher_id]?.teacher
        //     );
        // }

        // teacherTakenTime.forEach((timeSet, teacher_id) => {
        //     let timeArray = Array.from(timeSet);
        //     timeArray.sort((a, b) => a - b);

        //     console.log('b teacher_id: ', teacher_id, timeArray);

        //     teacherTakenTime.set(teacher_id, timeArray); // Update the map correctly using set()
        // });

        // // console.log('teacherTakenTime: ', teacherTakenTime);
        // teacherTakenTime.forEach((set, key) => {
        //     console.log('c key: ', key, set);

        //     let teacherStartTime = 0;
        //     let currentTime = teacherStartTime;

        //     set.forEach((value) => {
        //         if (value - currentTime > 1) {
        //             const result = [];

        //             for (let i = currentTime; i <= value; i++) {
        //                 result.push(i + 1);
        //             }

        //             const teacher = teacherTimetable.get(key).get('timetable');
        //             teacher.push([
        //                 currentTime == 0 ? currentTime : currentTime + 1,
        //                 {
        //                     section: null,
        //                     subject: null,
        //                     teacher: null,
        //                     fieldName1: null,
        //                     fieldName2: null,
        //                     day: null,
        //                     end: value,
        //                 },
        //             ]);

        //             // console.log('🚀 ~ s', teacher);
        //             // console.log('🚀 ~ set.forEach ~ teacher:', teacher);
        //         }

        //         currentTime = value;
        //     });
        // });

        // // console.log("timetable", timetableMap);
        // console.log('section timetable', sectionTimetable);
        // console.log('teacher timetable', teacherTimetable);

        // // // setTimetable(timetableMap);
        // setSectionTimetables(sectionTimetable);
        // setTeacherTimetables(teacherTimetable);
    };

    const handleSchedExport = () => {
        const sectionWorkbook = XLSX.utils.book_new();
        const teacherWorkbook = XLSX.utils.book_new();

        const cs1 = {
            fill: {
                fgColor: { rgb: 'FFFF00' },
            },
            font: {
                bold: true,
            },
        };

        Object.keys(sectionTimetables).forEach((sectionKey) => {
            const sectionSchedules = sectionTimetables[sectionKey];

            const sectionAdviserId = sectionsStore[sectionKey]
                ? sectionsStore[sectionKey].teacher
                : -1;
            console.log('sectionAdviserId', sectionAdviserId);
            const sectionAdviserName =
                sectionAdviserId && teachersStore[sectionAdviserId]
                    ? teachersStore[sectionAdviserId].teacher
                    : 'N/A';

            const setSched = [];
            const rows = [
                [
                    'Section',
                    sectionTimetables[sectionKey].containerName,
                    '',
                    '',
                    '',
                    '',
                ],
                ['Adviser', sectionAdviserName, '', '', '', ''],
                [
                    'Time',
                    'MONDAY',
                    'TUESDAY',
                    'WEDNESDAY',
                    'THURSDAY',
                    'FRIDAY',
                ],
            ];
            const singleRows = [];
            const merges = [
                { s: { r: 0, c: 1 }, e: { r: 0, c: 5 } },
                { s: { r: 1, c: 1 }, e: { r: 1, c: 5 } },
            ];
            let secRow = 4;

            Object.keys(sectionSchedules).forEach((dayKey) => {
                const timeSchedules = sectionSchedules[dayKey];

                const slotKeys = Object.keys(timeSchedules);

                if (slotKeys.length === 1) {
                    const slotKey = slotKeys[0];
                    const schedule = timeSchedules[slotKey];

                    if (
                        schedule.subject !== null &&
                        schedule.subject !== undefined
                    ) {
                        const schedData =
                            getTimeSlotString(schedule.start) +
                            ' - ' +
                            getTimeSlotString(schedule.end);

                        if (setSched.indexOf(schedData) === -1) {
                            setSched.push(schedData);

                            const newRow1 = [
                                schedData,
                                '',
                                '',
                                schedule.subject,
                                '',
                                '',
                            ];
                            const newRow2 = [
                                '',
                                '',
                                '',
                                schedule.teacher,
                                '',
                                '',
                            ];
                            rows.push(newRow1);
                            rows.push(newRow2);
                            singleRows.push(secRow);
                        }
                    }

                    if (
                        schedule.subject === null &&
                        schedule.teacher === null &&
                        schedule.teacherID === null
                    ) {
                        const schedData =
                            getTimeSlotString(schedule.start) +
                            ' - ' +
                            getTimeSlotString(schedule.end);
                        const newRow1 = [schedData, '', '', 'BREAK', '', ''];
                        const newRow2 = ['', '', '', '', '', ''];
                        rows.push(newRow1);
                        rows.push(newRow2);
                    }
                } else {
                    const sched = timeSchedules[slotKeys[0]];

                    const subjects = [];
                    const sections = [];
                    const teachers = [''];
                    let schedData = '';

                    if (sched.subject !== null && sched.subject !== undefined) {
                        schedData =
                            getTimeSlotString(sched.start) +
                            ' - ' +
                            getTimeSlotString(sched.end);
                        subjects.push(schedData);
                    }

                    let prevSlotKey = 0;
                    slotKeys.forEach((slotKey) => {
                        const schedule = timeSchedules[slotKey];

                        if (
                            schedule.subject !== null &&
                            schedule.subject !== undefined
                        ) {
                            subjects.push(schedule.subject);
                            teachers.push(schedule.teacher);
                        }

                        const gap = slotKey - prevSlotKey - 1;

                        for (let i = 0; i < gap; i++) {
                            subjects.push('');
                            sections.push('');
                        }

                        prevSlotKey = slotKey;
                    });

                    if (setSched.indexOf(schedData) === -1) {
                        setSched.push(schedData);

                        rows.push(subjects);
                        rows.push(teachers);
                    }
                }
                secRow = secRow + 2;
            });
            const worksheet = XLSX.utils.aoa_to_sheet(rows);

            worksheet['!merges'] = merges;
            worksheet['!cols'] = [
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
            ];

            XLSX.utils.book_append_sheet(
                sectionWorkbook,
                worksheet,
                `${sectionTimetables[sectionKey].containerName}`
            );
        });

        Object.keys(teacherTimetables).forEach((teacherKey) => {
            const teacherSchedules = teacherTimetables[teacherKey];
            const setSched = [];
            const rows = [
                [
                    'Teacher',
                    teacherTimetables[teacherKey].containerName,
                    '',
                    '',
                    '',
                    '',
                ],
                [
                    'Time',
                    'MONDAY',
                    'TUESDAY',
                    'WEDNESDAY',
                    'THURSDAY',
                    'FRIDAY',
                ],
            ];
            const merges = [{ s: { r: 0, c: 1 }, e: { r: 0, c: 5 } }];

            Object.keys(teacherSchedules).forEach((dayKey) => {
                const timeSchedules = teacherSchedules[dayKey];
                const slotKeys = Object.keys(timeSchedules);

                if (slotKeys.length === 1) {
                    const slotKey = slotKeys[0];
                    const schedule = timeSchedules[slotKey];

                    if (
                        schedule.subject !== null &&
                        schedule.subject !== undefined
                    ) {
                        const schedData =
                            getTimeSlotString(schedule.start) +
                            ' - ' +
                            getTimeSlotString(schedule.end);

                        if (setSched.indexOf(schedData) === -1) {
                            setSched.push(schedData);

                            const newRow1 = [
                                schedData,
                                '',
                                '',
                                schedule.subject,
                                '',
                                '',
                            ];
                            const newRow2 = [
                                '',
                                '',
                                '',
                                schedule.section,
                                '',
                                '',
                            ];
                            rows.push(newRow1);
                            rows.push(newRow2);
                        }
                    }
                } else {
                    const sched = timeSchedules[slotKeys[0]];

                    const subjects = [];
                    const sections = [];
                    let schedData = '';

                    if (sched.subject !== null && sched.subject !== undefined) {
                        schedData =
                            getTimeSlotString(sched.start) +
                            ' - ' +
                            getTimeSlotString(sched.end);
                        subjects.push(schedData);
                    }

                    let prevSlotKey = 0;
                    slotKeys.forEach((slotKey) => {
                        const schedule = timeSchedules[slotKey];

                        const gap = slotKey - prevSlotKey - 1;

                        for (let i = 0; i < gap; i++) {
                            subjects.push('');
                            sections.push('');
                        }

                        if (
                            schedule.subject !== null &&
                            schedule.subject !== undefined
                        ) {
                            subjects.push(schedule.subject);
                            sections.push(schedule.section);
                        }

                        if (setSched.indexOf(schedData) === -1) {
                            setSched.push(schedData);

                            rows.push(subjects);
                            rows.push(sections);
                        }
                        prevSlotKey = slotKey;
                    });
                }
            });
            const worksheet = XLSX.utils.aoa_to_sheet(rows);

            worksheet['!merges'] = merges;
            worksheet['!cols'] = [
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
            ];

            XLSX.utils.book_append_sheet(
                teacherWorkbook,
                worksheet,
                `${teacherTimetables[teacherKey].containerName}`
            );
        });

        XLSX.writeFile(sectionWorkbook, 'section_schedules.xlsx');
        XLSX.writeFile(teacherWorkbook, 'teacher_schedules.xlsx');
    };

    const handleClearAndRefresh = () => {
        // clearAllEntriesAndResetIDs().then(() => {
        //     setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to trigger re-render
        // });
        clearAllEntriesAndResetIDs();
    };

    const handleNumOfSchoolDaysChange = () => {
        localStorage.setItem('numOfSchoolDays', numOfSchoolDays);

        if (numOfSchoolDays === prevNumOfSchoolDays) return;
        setPrevNumOfSchoolDays(numOfSchoolDays);

        if (Object.keys(programsStore).length === 0) return;

        // Update program fixed days and fixed positions
        Object.entries(programsStore).forEach(([progId, prog]) => {

           const originalProgram = JSON.parse(JSON.stringify(prog));
           const newProgram = JSON.parse(JSON.stringify(prog));

           [7, 8, 9, 10].forEach((grade) => {
               if (newProgram[grade].subjects.length === 0) return;

                newProgram[grade].subjects.map((subId) => {

                    if ((subjectsStore[subId].weeklyMinutes / subjectsStore[subId].classDuration) <= numOfSchoolDays) return;
                    
                    const fixedDays = newProgram[grade].fixedDays[subId];
                    const fixedPositions = newProgram[grade].fixedPositions[subId];

                    for (let i = 0; i < fixedDays.length; i++) {
                        if (fixedDays[i] > numOfSchoolDays) {
                            fixedDays[i] = 0;
                            fixedPositions[i] = 0;
                        }
                    }

                    const numOfClasses = Math.min(
                        Math.ceil(subjectsStore[subId].weeklyMinutes / subjectsStore[subId].classDuration),
                        numOfSchoolDays
                    );
                    
                    const dayPositionMap = new Map();

                    fixedDays.forEach((day, index) => {
                        const pos = fixedPositions[index];
                        if ((day !== 0 && pos !== 0) || (day !== 0 && pos === 0) || (day === 0 && pos !== 0) && !dayPositionMap.has(`${day}-${pos}`)) {
                            dayPositionMap.set(`${day}-${pos}`, [day, pos]);
                        }
                    });

                    // console.log('dayPositionMap', dayPositionMap);

                    let result = [];
                    dayPositionMap.forEach(([day, pos]) => {
                        if (result.length < numOfClasses) {
                            result.push([day, pos]);
                        }
                    });
                
                    // console.log('result1', result);

                    // Pad with [0, 0] if necessary
                    while (result.length < numOfClasses) {
                        result.push([0, 0]);
                    }

                    // console.log('result2', result);
                    
                    newProgram[grade].fixedDays[subId] = result.map(([day]) => day);
                    newProgram[grade].fixedPositions[subId] = result.map(([_, pos]) => pos);
                })
           });

           console.log('originalProgram:', originalProgram);
           console.log('newProgram:', newProgram);

           if (originalProgram !== newProgram) {
               dispatch(
                   editProgram({
                       programId: newProgram.id,
                       updatedProgram: {
                           program: newProgram.program,
                           7: {
                                subjects: newProgram[7].subjects,
                                fixedDays: newProgram[7].fixedDays,
                                fixedPositions: newProgram[7].fixedPositions,
                                shift: newProgram[7].shift,
                                startTime: getTimeSlotIndex(newProgram[7].startTime || '06:00 AM'),
                           },
                           8:  {
                                subjects: newProgram[8].subjects,
                                fixedDays: newProgram[8].fixedDays,
                                fixedPositions: newProgram[8].fixedPositions,
                                shift: newProgram[8].shift,
                                startTime: getTimeSlotIndex(newProgram[8].startTime || '06:00 AM'),
                           },
                           9:  {
                                subjects: newProgram[9].subjects,
                                fixedDays: newProgram[9].fixedDays,
                                fixedPositions: newProgram[9].fixedPositions,
                                shift: newProgram[9].shift,
                                startTime: getTimeSlotIndex(newProgram[9].startTime || '06:00 AM'),
                           },
                           10:  {
                                subjects: newProgram[10].subjects,
                                fixedDays: newProgram[10].fixedDays,
                                fixedPositions: newProgram[10].fixedPositions,
                                shift: newProgram[10].shift,
                                startTime: getTimeSlotIndex(newProgram[10].startTime || '06:00 AM'),
                           },
                       },
                   })
               );
           }
        });

        if (Object.keys(sectionsStore).length === 0) return;

        // Update section fixed days and fixed positions
        Object.entries(sectionsStore).forEach(([secId, sec]) => {
            const originalSection = JSON.parse(JSON.stringify(sec));
            const newSection = JSON.parse(JSON.stringify(sec));

            newSection.subjects.map((subId) => {

                if ((subjectsStore[subId].weeklyMinutes / subjectsStore[subId].classDuration) <= numOfSchoolDays) return;

                const fixedDays = newSection.fixedDays[subId];
                const fixedPositions = newSection.fixedPositions[subId];

                for (let i = 0; i < fixedDays.length; i++) {
                    if (fixedDays[i] > numOfSchoolDays) {
                        fixedDays[i] = 0;
                        fixedPositions[i] = 0;
                    }
                }
                
                const numOfClasses = Math.min(
                    Math.ceil(subjectsStore[subId].weeklyMinutes / subjectsStore[subId].classDuration),
                    numOfSchoolDays
                );
                
                const dayPositionMap = new Map();

                fixedDays.forEach((day, index) => {
                    const pos = fixedPositions[index];
                    if ((day !== 0 && pos !== 0) || (day !== 0 && pos === 0) || (day === 0 && pos !== 0) && !dayPositionMap.has(`${day}-${pos}`)) {
                        dayPositionMap.set(`${day}-${pos}`, [day, pos]);
                    }
                });

                // console.log('dayPositionMap', dayPositionMap);

                let result = [];
                dayPositionMap.forEach(([day, pos]) => {
                    if (result.length < numOfClasses) {
                        result.push([day, pos]);
                    }
                });
            
                // console.log('result1', result);

                // Pad with [0, 0] if necessary
                while (result.length < numOfClasses) {
                    result.push([0, 0]);
                }

                // console.log('result2', result);
                
                newSection.fixedDays[subId] = result.map(([day]) => day);
                newSection.fixedPositions[subId] = result.map(([_, pos]) => pos);
            });

            if (originalSection !== newSection) {
                dispatch(
                    editSection({
                        sectionId: newSection.id,
                        updatedSection: {
                            id: newSection.id,
                            teacher: newSection.teacher,
                            program: newSection.program,
                            section: newSection.section,
                            subjects: newSection.subjects,
                            fixedDays: newSection.fixedDays,
                            fixedPositions: newSection.fixedPositions,
                            year: newSection.year,
                            shift: newSection.shift,
                            startTime: getTimeSlotIndex(newSection.startTime || '06:00 AM'),
                        },
                    })
                );
            };
        });

    };

    useEffect(() => {
        // Function to handle the beforeunload event
        const handleBeforeUnload = (event) => {
            if (timetableGenerationStatus === 'running') {
                event.preventDefault();
                event.returnValue = ''; // Legacy for older browsers
            }
        };

        // Add the event listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [timetableGenerationStatus]); // The effect depends on the isProcessRunning state

    useEffect(() => {
        handleNumOfSchoolDaysChange();
    }, [numOfSchoolDays]);

    useEffect(() => {
        if (sectionStatus === 'idle') {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

    useEffect(() => {
        if (programStatus === 'idle') {
            dispatch(fetchPrograms());
        }
    }, [programStatus, dispatch]);

    useEffect(() => {
        if (subjectStatus === 'idle') {
            dispatch(fetchSubjects());
        }
    }, [subjectStatus, dispatch]);

    return (
        <div className="App container mx-auto px-4 py-6">
            <div className="mb-6 flex justify-between items-center">
                <Breadcrumbs title="Timetable" links={links} />
                <div className="flex items-center gap-2">
                    <ExportImportDBButtons onClear={handleClearAndRefresh} />
                    <button
                        className={clsx('btn btn-primary', {
                            'cursor-not-allowed':
                                timetableGenerationStatus === 'running',
                            'btn-error': timetableGenerationStatus === 'error',
                        })}
                        onClick={() => {
                            // if (validate()) {
                            handleButtonClick();
                            // }
                        }}
                        disabled={timetableGenerationStatus === 'running'}
                    >
                        {timetableGenerationStatus === 'running' ? (
                            <div className="flex gap-2 items-center">
                                <span>Generating</span>
                                <span className="loading loading-spinner loading-xs"></span>
                            </div>
                        ) : (
                            'Generate Timetable'
                        )}
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <Configuration 
                    numOfSchoolDays={numOfSchoolDays}
                    setNumOfSchoolDays={setNumOfSchoolDays}
                />
            </div>

            {/* Responsive card layout for Subject and Teacher Lists */}
            {/* <div className="flex flex-col lg:flex-row gap-6">
    <div className="w-full lg:w-4/12 bg-base-100 p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Subjects</h2>
      <SubjectListContainer />
      </div>
      <div className="w-full lg:w-8/12 bg-base-100 p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Teachers</h2>
      <TeacherListContainer />
    </div>
  </div> */}
            <div>
                <div className="mt-6 bg-base-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Subjects</h2>
                    <SubjectListContainer
                        numOfSchoolDays={numOfSchoolDays}
                    />
                </div>

                <div className="mt-6 bg-base-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Teachers</h2>
                    <TeacherListContainer />
                </div>

                {/* Program Lists */}
                <div className="mt-6 bg-base-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Programs</h2>
                    <ProgramListContainer 
                        numOfSchoolDays={numOfSchoolDays}
                    />
                </div>

                {/* Section List with the Generate Timetable Button */}
                <div className="mt-6">
                    <div className="bg-base-100 p-6 rounded-lg shadow-lg">
                        <h2 className="text-lg font-semibold mb-4">Sections</h2>
                        <SectionListContainer 
                            numOfSchoolDays={numOfSchoolDays}
                        />
                        <div className="mt-4">
                            <ViolationList violations={violations} />
                        </div>
                    </div>
                </div>
            </div>

            {Object.keys(sectionTimetables).length > 0 &&
                Object.keys(teacherTimetables).length > 0 && (
                    <button
                        className="btn btn-secondary bg-red-500 w-32 mt-6"
                        onClick={handleSchedExport}
                    >
                        EXPORT SCHEDULES
                    </button>
                )}

            {/* <GeneratedTimetable
                timetables={sectionTimetables}
                field={'section'}
            /> */}

            <GeneratedTimetable
                timetables={teacherTimetables}
                field={'teacher'}
            />

            {/* <div className="grid grid-cols-1 col-span-full gap-4 sm:grid-cols-2"></div> */}
        </div>
    );
}

export default Timetable;

// /* eslint-disable no-undef */
// /* eslint-disable  no-restricted-globals */
// /* eslint-disable  no-unused-expressions */
// /* eslint-disable import/no-amd */
