import { useState, useEffect } from 'react';
import packInt16ToInt32 from '@utils/packInt16ToInt32';
import { useSelector } from 'react-redux';
import { wrap } from 'comlink';
import WasmWorker from '@src/wasm.worker?worker';
import Configuration from '@components/Admin/Configuration';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import GeneratedTimetable from '@components/Admin/TimeTable';
import ForTest from '@components/Admin/ForTest';

import validateTimetableVariables from '@validation/validateTimetableVariables';
import { toast } from 'sonner';
import ViolationList from '@components/Admin/ViolationList';
import SubjectListContainer from '@components/Admin/SubjectListContainer';
import ProgramListContainer from '@components/Admin/ProgramListContainer';
import TeacherListContainer from '@components/Admin/Teacher/TeacherListContainer';
import SectionListContainer from '@components/Admin/SectionListContainer';
import ExportImportDBButtons from '@components/Admin/ExportImportDBButtons';

import { getTimeSlotString } from '../../../components/Admin/timeSlotMapper';
import Breadcrumbs from '@components/Admin/Breadcrumbs';
import { clearAllEntriesAndResetIDs } from '@src/indexedDB';
import { enableMapSet } from 'immer';

enableMapSet();
const getTimetable = wrap(new WasmWorker());

function Timetable() {
    const links = [
        { name: 'Home', href: '/' },
        // { name: 'Modify Subjects', href: '/modify-subjects' },
    ];

    const { subjects: subjectsStore } = useSelector((state) => state.subject);
    const { teachers: teachersStore } = useSelector((state) => state.teacher);
    const { sections: sectionsStore } = useSelector((state) => state.section);
    const { programs: programsStore } = useSelector((state) => state.program);

    const numOfSchoolDays = Number(localStorage.getItem('numOfSchoolDays'));

    const [sectionTimetables, setSectionTimetables] = useState({});
    const [teacherTimetables, setTeacherTimetables] = useState({});
    const [mapVal, setMapVal] = useState(new Map());

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
            (acc, [, value], index) => {
                acc[value.id] = index;
                return acc;
            },
            {}
        );

        const teacherMap = Object.entries(teachersStore).reduce(
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

        const sectionMap = Object.entries(sectionsStore).reduce(
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

                    startTime: value.startTime,
                    id: value.id,
                };

                return acc;
            },
            {}
        );

        console.log('subjectMap', subjectMap);
        console.log('subjectMapReverse', subjectMapReverse);
        console.log('teacherMap', teacherMap);
        console.log('sectionMap', sectionMap);

        let defaultClassDuration = 4;
        let breakTimeDuration = 3;

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

        const defaultOrder = 0;

        let offset = lowestSubjectDuration - 1;

        let minTotalClassDurationForTwoBreaks =
            commonSubjectCount * defaultClassDuration;

        defaultClassDuration -= offset;
        breakTimeDuration -= offset;
        minTotalClassDurationForTwoBreaks /= offset;

        // console.log(
        //     '🚀 ~ handleButtonClick ~ lowestSubjectDuration:',
        //     lowestSubjectDuration
        // );

        let cellCount = 0;
        for (const [
            sectionKey,
            { subjects, startTime, subjectUnits },
        ] of Object.entries(sectionMap)) {
            // console.log('🚀 ~ handleButtonClick ~ startTime:', startTime);
            let rowCount = 0;

            for (const subject of subjects) {
                sectionSubjectArray.push(packInt16ToInt32(sectionKey, subject));
            }

            for (const subject of Object.keys(subjectUnits)) {
                // console.log('🚀 ~ handleButtonClick ~ subject:', subject);
                const unitCount = subjectUnits[subject][0];

                if (unitCount === 0) {
                    cellCount++;
                    rowCount += numOfSchoolDays;
                    // console.log("🚀 ~ handleButtonClick ~ numOfSchoolDays:", typeof numOfSchoolDays)
                } else {
                    cellCount += unitCount;
                    rowCount += unitCount;
                    // console.log("🚀 ~ handleButtonClick ~ unitCount:", unitCount)
                }

                sectionSubjectUnitArray.push(
                    packInt16ToInt32(subject, subjectUnits[subject][0])
                );

                sectionStartArray[sectionKey] = startTime;

                // TODO: might there be code smell on how it stores

                sectionSubjectDurationArray.push(
                    packInt16ToInt32(
                        subject,
                        subjectsStore[subjectMap[subject]].classDuration / 10 -
                            offset
                    )
                );

                sectionSubjectOrderArray.push(
                    packInt16ToInt32(subject, subjectUnits[subject][1])
                );
            }

            // console.log('🚀 ~ handleButtonClick ~ rowCount:', rowCount);
            rowCount = Math.trunc(rowCount / numOfSchoolDays);
            let numOfBreak = rowCount < 10 ? 1 : 2;
            cellCount += numOfBreak;
        }

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

        const max_iterations = 15000;
        const beesPopulations = 4;
        const beesEmployed = 2;
        const beesOnlooker = 2;
        const beesScout = 1;
        const numTeachers = Object.keys(teacherMap).length;
        const totalSchoolClass = sectionSubjectArray.length;
        const totalSection = Object.keys(sectionMap).length;

        const limits = numTeachers * totalSection;

        // for (let i = 0; i < totalSection; i++) {
        //     sectionStartArray[i] = 0;
        // }

        const sectionStarts = new Int32Array([...sectionStartArray]);

        const teacherSubjectArray = [];

        for (const [teacherKey, { subjects }] of Object.entries(teacherMap)) {
            for (const subject of subjects) {
                teacherSubjectArray.push(packInt16ToInt32(teacherKey, subject));
            }
        }

        const teacherSubjects = new Int32Array([...teacherSubjectArray]);

        const breakTimeslotAllowance = 6;
        const teacherBreakThreshold = 4;

        const params = {
            maxIterations: max_iterations,
            numTeachers: numTeachers,
            totalSchoolClass: totalSchoolClass,
            totalSection: totalSection,

            sectionSubjects: sectionSubjects,
            sectionSubjectDurations: sectionSubjectDurations,
            sectionSubjectOrders: sectionSubjectOrders,
            sectionStarts: sectionStarts,
            teacherSubjects: teacherSubjects,
            sectionSubjectUnits: sectionSubjectUnits,
            teacherSubjectsLength: teacherSubjects.length,

            beesPopulation: beesPopulations,
            beesEmployed: beesEmployed,
            beesOnlooker: beesOnlooker,
            beesScout: beesScout,
            limits: limits,
            workWeek: numOfSchoolDays,

            maxTeacherWorkLoad: 9,
            breakTimeDuration: breakTimeDuration,
            breakTimeslotAllowance: breakTimeslotAllowance,
            teacherBreakThreshold: teacherBreakThreshold,
            minTotalClassDurationForTwoBreaks:
                minTotalClassDurationForTwoBreaks,
            defaultClassDuration: defaultClassDuration,
            // resultLength: cellCount,
            resultLength:
                totalSection *
                Object.entries(subjectsStore).length *
                numOfSchoolDays,

            offset: offset,
        };

        setTimetableGenerationStatus('running');
        const { timetable: generatedTimetable, status } = await getTimetable(
            params
        );
        setTimetableGenerationStatus(status);

        // const timetableMap = [];
        const sectionTimetable = {};
        const teacherTimetable = {};

        function ensureNestedObject(obj, keys) {
            let current = obj;
            for (let key of keys) {
                if (!current[key]) {
                    current[key] = {}; // Initialize the nested object if it doesn't exist
                }
                current = current[key];
            }
            return current;
        }

        for (const entry of generatedTimetable) {
            // console.log('🚀 ~ handleButtonClick ~ entry of timetable:', entry);

            const section_id = sectionMap[entry[0]].id;
            const subject_id = subjectMap[entry[1]] || null;
            const teacher_id = (teacherMap[entry[2]] || { id: null }).id;
            const timeslot = entry[3];
            const day = entry[4];

            const start = entry[5];
            const end = entry[6];

            // Ensure sectionTimetable nested structure exists
            let sectionEntry = ensureNestedObject(sectionTimetable, [
                section_id,
                timeslot,
                day,
            ]);

            sectionTimetable[section_id].containerName =
                sectionsStore[section_id]?.section;

            // Now you can safely assign values to the final nested object
            sectionEntry.subject = subjectsStore[subject_id]?.subject || null;
            sectionEntry.sectionID = section_id || null;

            sectionEntry.teacher = teachersStore[teacher_id]?.teacher || null;
            sectionEntry.teacherID = teacher_id || null;
            sectionEntry.subjectID = subject_id || null;

            sectionEntry.start = start;
            sectionEntry.end = end;

            if (teacher_id == null) {
                continue;
            }

            // Ensure teacherTimetable nested structure exists
            let teacherEntry = ensureNestedObject(teacherTimetable, [
                teacher_id,
                timeslot,
                day,
            ]);

            teacherTimetable[teacher_id].containerName =
                teachersStore[teacher_id]?.teacher;

            // Now you can safely assign values to the final nested object
            teacherEntry.subject = subjectsStore[subject_id]?.subject || null;
            teacherEntry.subjectID = subject_id || null;
            teacherEntry.teacherID = teacher_id || null;

            teacherEntry.section = sectionsStore[section_id]?.section || null;
            teacherEntry.sectionID = section_id;

            teacherEntry.start = start;
            teacherEntry.end = end;
        }

        // setTimetable(timetable);
        // console.log("timetable", timetableMap);
        console.log('section timetable', sectionTimetable);
        console.log('teacher timetable', teacherTimetable);

        // setTimetable(timetableMap);
        setSectionTimetables(sectionTimetable);
        setTeacherTimetables(teacherTimetable);
        const combined = combineObjects(sectionTimetable, teacherTimetable);
        console.log('combined: ', combined);
        setMapVal(convertToHashMap(combined));
    };

    const handleSchedExport = () => {
        const sectionWorkbook = XLSX.utils.book_new();
        const teacherWorkbook = XLSX.utils.book_new();
        console.log(sectionTimetables);
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
                console.log(timeSchedules);
                const slotKeys = Object.keys(timeSchedules);

                if (slotKeys.length === 1) {
                    const slotKey = slotKeys[0];
                    console.log(timeSchedules);
                    const schedule = timeSchedules[slotKey];
                    console.log(slotKeys);
                    console.log(schedule);
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
                        console.log('timesched ', timeSchedules);
                        console.log(slotKeys);
                        console.log('log on sched', schedule);
                        console.log('slotkey: ', slotKey);
                        if (slotKey !== 'start' && slotKey !== 'end') {
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
                        }
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

    // const makeOtherTable = (table) => {
    //     let othertable = {};
    //     console.log("orig data: ",table);
    // };

    // makeOtherTable(sectionTimetables)
    // makeOtherTable(teacherTimetables)

    const convertToHashMap = (inputObj) => {
        const resultMap = new Map(); // Initialize the outer Map

        // Iterate through each section in the input object
        for (let tableKey in inputObj) {
            let sectionData = inputObj[tableKey];
            // Each section has a container name
            let setTableKey = `${sectionData.containerName} - ${tableKey}`;

            // Check if the tableKey already exists under the tableKey
            if (!resultMap.has(setTableKey)) {
                resultMap.set(setTableKey, new Map());
            }
            const scheduleMap = resultMap.get(setTableKey);

            // Iterate through the nested objects (0, 1, 2,...)
            for (let key in sectionData) {
                // Skip the tableKey field to prevent redundant processing
                if (key === 'containerName') continue;
                // Iterate through inner objects (0, 1, 2,...)
                for (let innerKey in sectionData[key]) {
                    let schedule = sectionData[key][innerKey];
                    const type = schedule.teacher ? 'section' : 'teacher';
                    const partnerType =
                        type === 'teacher' ? 'section' : 'teacher';

                    if (innerKey === '0') {
                        for (let i = 1; i <= 5; i++) {
                            const scheduleKey = `section-${schedule.sectionID}-teacher-${schedule.teacherID}-subject-${schedule.subjectID}-day-${i}-type-${type}`;
                            // Add the schedule to the nested Map
                            const keyToFind = scheduleKey.replace(
                                /(type-)([^-]+)/,
                                `$1${partnerType}`
                            );

                            scheduleMap.set(scheduleKey, {
                                start: schedule.start,
                                end: schedule.end,
                                sectionID: schedule.sectionID,
                                subject: schedule.subject,
                                subjectID: schedule.subjectID,
                                teacherID: schedule.teacherID,
                                tableKey: setTableKey,
                                partnerKey: keyToFind,
                                id: scheduleKey,
                                dynamicID: scheduleKey,
                                day: i,
                                overlap: false,
                                type: type,
                                ...(schedule.section && {
                                    section: schedule.section,
                                }), // Add section if it exists
                                ...(schedule.teacher && {
                                    teacher: schedule.teacher,
                                }), // Add section if it exists
                            });
                        }
                    } else {
                        // Use sectionID, subjectID, and start time to create a unique key for the schedule
                        const scheduleKey = `section-${schedule.sectionID}-teacher-${schedule.teacherID}-subject-${schedule.subjectID}-day-${innerKey}-type-${type}`;
                        const keyToFind = scheduleKey.replace(
                            /(type-)([^-]+)/,
                            `$1${partnerType}`
                        );
                        // Add the schedule to the nested Map
                        scheduleMap.set(scheduleKey, {
                            start: schedule.start,
                            end: schedule.end,
                            sectionID: schedule.sectionID,
                            subject: schedule.subject,
                            subjectID: schedule.subjectID,
                            teacherID: schedule.teacherID,
                            tableKey: setTableKey,
                            partnerKey: keyToFind,
                            type: type,
                            id: scheduleKey,
                            dynamicID: scheduleKey,
                            day: Number(innerKey),
                            ...(schedule.section && {
                                section: schedule.section,
                            }), // Add section if it exists
                            ...(schedule.teacher && {
                                teacher: schedule.teacher,
                            }), // Add section if it exists
                        });
                    }
                }
            }
        }

        return resultMap;
    };

    // Example usage with inputObj
    const inputObj = {
        1: {
            0: {
                0: {
                    start: 10,
                    end: 14,
                    sectionID: 1,
                    subject: 'Math1',
                    subjectID: 1,
                    teacher: 'Teacher 1',
                    teacherID: 1,
                },
            },
            1: {
                2: {
                    start: 30,
                    end: 36,
                    sectionID: 1,
                    subject: 'English2',
                    subjectID: 2,
                    teacher: 'Teacher2',
                    teacherID: 2,
                },
            },
            2: {
                0: {
                    start: 20,
                    end: 24,
                    sectionID: 1,
                    subject: 'PE3',
                    subjectID: 3,
                    teacher: 'Teacher3',
                    teacherID: 3,
                },
            },
            3: {
                0: {
                    start: 24,
                    end: 27,
                    sectionID: 1,
                    subject: null,
                    subjectID: null,
                    teacher: null,
                    teacherID: null,
                },
            },
            containerName: 'Section 1',
        },
        2: {
            0: {
                0: {
                    start: 0,
                    end: 4,
                    sectionID: 2,
                    subject: 'English2',
                    subjectID: 2,
                    teacher: 'Teacher2',
                    teacherID: 2,
                },
            },
            1: {
                1: {
                    start: 4,
                    end: 8,
                    sectionID: 2,
                    subject: 'PE3',
                    subjectID: 3,
                    teacher: 'Teacher3',
                    teacherID: 3,
                },
                2: {
                    start: 4,
                    end: 8,
                    sectionID: 2,
                    subject: 'PE3',
                    subjectID: 3,
                    teacher: 'Teacher3',
                    teacherID: 3,
                },
            },
            containerName: 'Section 2',
        },
    };

    const sectionStringObj = {
        1: {
            0: {
                1: {
                    subject: 'MAPEH',
                    sectionID: 1,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 0,
                    end: 4,
                },
                3: {
                    subject: 'MAPEH',
                    sectionID: 1,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 0,
                    end: 4,
                },
                4: {
                    subject: 'Filipino',
                    sectionID: 1,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 0,
                    end: 4,
                },
                5: {
                    subject: 'Filipino',
                    sectionID: 1,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    sectionID: 1,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    sectionID: 1,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 2,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    sectionID: 1,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 8,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'English',
                    sectionID: 1,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 1,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 20,
                    end: 23,
                },
            },
            6: {
                1: {
                    subject: 'MAPEH',
                    sectionID: 1,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 23,
                    end: 27,
                },
                2: {
                    subject: 'Math',
                    sectionID: 1,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 23,
                    end: 27,
                },
                3: {
                    subject: 'Math',
                    sectionID: 1,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 23,
                    end: 27,
                },
                5: {
                    subject: 'Filipino',
                    sectionID: 1,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'AP',
                    sectionID: 1,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'NMP',
                    sectionID: 1,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 9,
                    start: 31,
                    end: 34,
                },
            },
            containerName: 'Magalang',
        },
        2: {
            0: {
                0: {
                    subject: 'English',
                    sectionID: 2,
                    teacher: 'JB Moya',
                    teacherID: 2,
                    subjectID: 3,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'EsP',
                    sectionID: 2,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 2,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'Math',
                    sectionID: 2,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: null,
                    sectionID: 2,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 12,
                    end: 15,
                },
            },
            4: {
                0: {
                    subject: 'TLE',
                    sectionID: 2,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 8,
                    start: 15,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    sectionID: 2,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 4,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    sectionID: 2,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Science',
                    sectionID: 2,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 2,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 5,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 2,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Mabait',
        },
        3: {
            0: {
                0: {
                    subject: 'Math',
                    sectionID: 3,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    sectionID: 3,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 8,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'Filipino',
                    sectionID: 3,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'English',
                    sectionID: 3,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: null,
                    sectionID: 3,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 16,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 3,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'Science',
                    sectionID: 3,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    sectionID: 3,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 2,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'AP',
                    sectionID: 3,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 3,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Masipag',
        },
        4: {
            0: {
                0: {
                    subject: 'EsP',
                    sectionID: 4,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 2,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'AP',
                    sectionID: 4,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    sectionID: 4,
                    teacher: 'JB Moya',
                    teacherID: 2,
                    subjectID: 3,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'Science',
                    sectionID: 4,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Filipino',
                    sectionID: 4,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 4,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 20,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 4,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 5,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    sectionID: 4,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 8,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Math',
                    sectionID: 4,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 4,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Masinop',
        },
        5: {
            0: {
                0: {
                    subject: 'AP',
                    sectionID: 5,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 1,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'English',
                    sectionID: 5,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 5,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: null,
                    sectionID: 5,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 12,
                    end: 15,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    sectionID: 5,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 15,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    sectionID: 5,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'TLE',
                    sectionID: 5,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 8,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Math',
                    sectionID: 5,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'EsP',
                    sectionID: 5,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 2,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 5,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Matiwasay',
        },
        6: {
            0: {
                0: {
                    subject: 'Math',
                    sectionID: 6,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    sectionID: 6,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    sectionID: 6,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 2,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    sectionID: 6,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: null,
                    sectionID: 6,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 16,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 6,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 5,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'English',
                    sectionID: 6,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    sectionID: 6,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    sectionID: 6,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 6,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Sampaguita',
        },
        7: {
            0: {
                0: {
                    subject: 'Science',
                    sectionID: 7,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    sectionID: 7,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    sectionID: 7,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 2,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 7,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: null,
                    sectionID: 7,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 16,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'Math',
                    sectionID: 7,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'English',
                    sectionID: 7,
                    teacher: 'JB Moya',
                    teacherID: 2,
                    subjectID: 3,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'AP',
                    sectionID: 7,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 1,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    sectionID: 7,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 7,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Rosas',
        },
        8: {
            0: {
                0: {
                    subject: 'EsP',
                    sectionID: 8,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 2,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 8,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'TLE',
                    sectionID: 8,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 8,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    sectionID: 8,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 1,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Math',
                    sectionID: 8,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 8,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 20,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'Filipino',
                    sectionID: 8,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'English',
                    sectionID: 8,
                    teacher: 'JB Moya',
                    teacherID: 2,
                    subjectID: 3,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Science',
                    sectionID: 8,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 8,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Ilang Ilang',
        },
        9: {
            0: {
                0: {
                    subject: 'English',
                    sectionID: 9,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 9,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 5,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'Filipino',
                    sectionID: 9,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 4,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    sectionID: 9,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'AP',
                    sectionID: 9,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: 'Science',
                    sectionID: 9,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 20,
                    end: 24,
                },
            },
            6: {
                0: {
                    subject: null,
                    sectionID: 9,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 24,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Math',
                    sectionID: 9,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'EsP',
                    sectionID: 9,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 2,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 9,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Water Lily',
        },
        10: {
            0: {
                0: {
                    subject: 'Filipino',
                    sectionID: 10,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'EsP',
                    sectionID: 10,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 2,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    sectionID: 10,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'Math',
                    sectionID: 10,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    sectionID: 10,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 10,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 20,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    sectionID: 10,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    sectionID: 10,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 8,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 10,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 10,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Sunflower',
        },
        11: {
            0: {
                0: {
                    subject: 'Science',
                    sectionID: 11,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 11,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'Math',
                    sectionID: 11,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    sectionID: 11,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 54,
                    end: 58,
                },
            },
            4: {
                0: {
                    subject: 'AP',
                    sectionID: 11,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 58,
                    end: 62,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    sectionID: 11,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 62,
                    end: 66,
                },
            },
            6: {
                0: {
                    subject: null,
                    sectionID: 11,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 66,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    sectionID: 11,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 2,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'English',
                    sectionID: 11,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 11,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Pula',
        },
        12: {
            0: {
                0: {
                    subject: 'English',
                    sectionID: 12,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    sectionID: 12,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 12,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: 'Filipino',
                    sectionID: 12,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 54,
                    end: 58,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    sectionID: 12,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 58,
                    end: 62,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 12,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 62,
                    end: 65,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    sectionID: 12,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    sectionID: 12,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 2,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'Math',
                    sectionID: 12,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 12,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Asul',
        },
        13: {
            0: {
                0: {
                    subject: 'Science',
                    sectionID: 13,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'AP',
                    sectionID: 13,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    sectionID: 13,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: null,
                    sectionID: 13,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 54,
                    end: 57,
                },
            },
            4: {
                0: {
                    subject: 'Math',
                    sectionID: 13,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 57,
                    end: 61,
                },
            },
            5: {
                0: {
                    subject: 'EsP',
                    sectionID: 13,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 2,
                    start: 61,
                    end: 65,
                },
            },
            6: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 13,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    sectionID: 13,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    sectionID: 13,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 13,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Bughaw',
        },
        14: {
            0: {
                0: {
                    subject: 'TLE',
                    sectionID: 14,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Math',
                    sectionID: 14,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'AP',
                    sectionID: 14,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: null,
                    sectionID: 14,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 54,
                    end: 57,
                },
            },
            4: {
                0: {
                    subject: 'English',
                    sectionID: 14,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 57,
                    end: 61,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    sectionID: 14,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 4,
                    start: 61,
                    end: 65,
                },
            },
            6: {
                0: {
                    subject: 'EsP',
                    sectionID: 14,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 2,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 14,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'Science',
                    sectionID: 14,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 14,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Dilaw',
        },
        15: {
            0: {
                0: {
                    subject: 'Math',
                    sectionID: 15,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    sectionID: 15,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'Filipino',
                    sectionID: 15,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 4,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    sectionID: 15,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 54,
                    end: 58,
                },
            },
            4: {
                0: {
                    subject: 'TLE',
                    sectionID: 15,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 58,
                    end: 62,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 15,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 62,
                    end: 65,
                },
            },
            6: {
                0: {
                    subject: 'EsP',
                    sectionID: 15,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 2,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'English',
                    sectionID: 15,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 15,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 15,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Itim',
        },
    };

    const teacherStringObj = {
        1: {
            1: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 1,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 31,
                    end: 35,
                },
            },
            containerName: 'Yul Canlas',
        },
        2: {
            0: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 2,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 0,
                    end: 4,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 2,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 8,
                    end: 12,
                },
            },
            6: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 2,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 2,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 27,
                    end: 31,
                },
            },
            containerName: 'JB Moya',
        },
        3: {
            0: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 0,
                    end: 4,
                },
            },
            3: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Asul',
                    sectionID: 12,
                    start: 54,
                    end: 58,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 23,
                    end: 27,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 3,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'David Linao',
        },
        4: {
            0: {
                1: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Pula',
                    sectionID: 11,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Asul',
                    sectionID: 12,
                    start: 50,
                    end: 54,
                },
            },
            6: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 65,
                    end: 69,
                },
                1: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Itim',
                    sectionID: 15,
                    start: 73,
                    end: 77,
                },
            },
            containerName: 'Lorenzo Sypio',
        },
        5: {
            0: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Itim',
                    sectionID: 15,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Pula',
                    sectionID: 11,
                    start: 50,
                    end: 54,
                },
            },
            4: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 57,
                    end: 61,
                },
            },
            6: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 5,
                    section: 'Itim',
                    sectionID: 15,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 5,
                    section: 'Asul',
                    sectionID: 12,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Asul',
                    sectionID: 12,
                    start: 73,
                    end: 77,
                },
            },
            containerName: 'Mark Tagalogon',
        },
        6: {
            0: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Pula',
                    sectionID: 11,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 6,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 8,
                    end: 12,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 15,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 20,
                    end: 24,
                },
            },
            6: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 6,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 65,
                    end: 69,
                },
            },
            8: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 6,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Carl Senaris',
        },
        7: {
            0: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 4,
                    end: 8,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Itim',
                    sectionID: 15,
                    start: 58,
                    end: 62,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 27,
                    end: 31,
                },
            },
            containerName: 'Wency Cruz',
        },
        8: {
            0: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 8,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 8,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 4,
                    end: 8,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 8,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 12,
                    end: 16,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 8,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 8,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 8,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 8,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Michael Llosa',
        },
        9: {
            0: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Asul',
                    sectionID: 12,
                    start: 42,
                    end: 46,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 50,
                    end: 54,
                },
            },
            4: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 57,
                    end: 61,
                },
            },
            7: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Itim',
                    sectionID: 15,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Pula',
                    sectionID: 11,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 9,
                    section: 'Asul',
                    sectionID: 12,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Sandryl Torres',
        },
        10: {
            2: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 10,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 8,
                    end: 12,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 10,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 19,
                    end: 23,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 10,
                    section: 'Itim',
                    sectionID: 15,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Maverick Ramos',
        },
        11: {
            1: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 11,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 4,
                    end: 8,
                },
            },
            5: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 11,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 11,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 23,
                    end: 27,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 11,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 11,
                    section: 'Pula',
                    sectionID: 11,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Joshua Margallo',
        },
        12: {
            0: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 0,
                    end: 4,
                },
            },
            2: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 8,
                    end: 12,
                },
            },
            5: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                3: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 12,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 12,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Romar Dela Pena',
        },
        13: {
            0: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Itim',
                    sectionID: 15,
                    start: 46,
                    end: 50,
                },
            },
            3: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Asul',
                    sectionID: 12,
                    start: 58,
                    end: 62,
                },
            },
            7: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 27,
                    end: 31,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 13,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Raine Maximo',
        },
        14: {
            0: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 14,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 0,
                    end: 4,
                },
            },
            2: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 14,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 14,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 12,
                    end: 16,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 14,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 27,
                    end: 31,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 14,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Erika Velasquez',
        },
        15: {
            1: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Itim',
                    sectionID: 15,
                    start: 54,
                    end: 58,
                },
            },
            4: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Pula',
                    sectionID: 11,
                    start: 58,
                    end: 62,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Asul',
                    sectionID: 12,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 15,
                    section: 'Pula',
                    sectionID: 11,
                    start: 69,
                    end: 73,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 15,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Erika Formanes',
        },
        16: {
            0: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 23,
                    end: 27,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 16,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Grace Garchitorena',
        },
        17: {
            0: {
                4: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 0,
                    end: 4,
                },
                5: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 17,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 8,
                    end: 12,
                },
            },
            4: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                5: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 23,
                    end: 27,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 31,
                    end: 35,
                },
            },
            containerName: 'Ernest Aguilar',
        },
        18: {
            0: {
                3: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 12,
                    end: 16,
                },
            },
            5: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 19,
                    end: 23,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 18,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Paolo Santos',
        },
        19: {
            0: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 0,
                    end: 4,
                },
            },
            3: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                2: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 31,
                    end: 35,
                },
            },
            containerName: 'Nino Manzanero',
        },
        20: {
            0: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 4,
                    end: 8,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 20,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 20,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Alexandria Brillo',
        },
        21: {
            0: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 21,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 21,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 21,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 8,
                    end: 12,
                },
            },
            4: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 21,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 15,
                    end: 19,
                },
            },
            6: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 21,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 21,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 21,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 31,
                    end: 34,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 21,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Deazelle Capistrano',
        },
    };

    function removeQuotesFromKeys(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const result = {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                // Convert key to a number if it's a valid number
                const newKey = isNaN(key) ? key : Number(key);
                const value = obj[key];

                // If the value is an object, recursively clean it
                result[newKey] = removeQuotesFromKeys(value);
            }
        }

        return result;
    }

    // console.log('correct: ', removeQuotesFromKeys(stringObj));
    const sectionObj = removeQuotesFromKeys(sectionStringObj);
    const teacherObj = removeQuotesFromKeys(teacherStringObj);

    const teacher = {
        1: {
            0: {
                0: {
                    start: 10,
                    end: 14,
                    sectionID: 1,
                    subject: 'Math1',
                    subjectID: 1,
                    section: 'Section 1',
                    teacherID: 1,
                },
            },
            containerName: 'Teacher 1',
        },
        2: {
            0: {
                2: {
                    start: 30,
                    end: 36,
                    sectionID: 1,
                    subject: 'English2',
                    subjectID: 2,
                    section: 'Section 1',
                    teacherID: 2,
                },
            },
            1: {
                1: {
                    start: 4,
                    end: 8,
                    sectionID: 2,
                    subject: 'PE3',
                    subjectID: 3,
                    section: 'Section 2',
                    teacherID: 3,
                },
                2: {
                    start: 4,
                    end: 8,
                    sectionID: 2,
                    subject: 'PE3',
                    subjectID: 3,
                    section: 'Section 2',
                    teacherID: 3,
                },
            },
            containerName: 'Teacher 2',
        },
        3: {
            0: {
                0: {
                    start: 20,
                    end: 24,
                    sectionID: 1,
                    subject: 'PE3',
                    subjectID: 3,
                    section: 'Section 3',
                    teacherID: 3,
                },
            },
            1: {
                0: {
                    start: 0,
                    end: 4,
                    sectionID: 2,
                    subject: 'English2',
                    subjectID: 2,
                    section: 'Section 2',
                    teacherID: 2,
                },
            },
            containerName: 'Teacher 3',
        },
    };

    function combineObjects(inputObj, teacher) {
        const combined = { ...inputObj }; // Start with inputObj

        // Find the largest numeric key in inputObj to continue numbering
        const maxKey = Math.max(...Object.keys(inputObj).map(Number));

        // Start appending `teacher` with new numeric keys
        let currentKey = maxKey + 1;

        for (const key in teacher) {
            combined[currentKey] = teacher[key];
            currentKey++;
        }

        return combined;
    }

    // Convert the input object to a Map

    // console.log(hashMap.get('Section 1'));

    // console.log(hashMap.get('Section 2').get('2-2-0'));  // Should log the second schedule item

    useEffect(() => {
        const combined = combineObjects(sectionObj, teacherObj);

        setMapVal(convertToHashMap(combined));
    }, []);

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
                            if (validate()) {
                                handleButtonClick();
                            }
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
                <Configuration />
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
                    <SubjectListContainer />
                </div>

                <div className="mt-6 bg-base-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Teachers</h2>
                    <TeacherListContainer />
                </div>

                {/* Program Lists */}
                <div className="mt-6 bg-base-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Programs</h2>
                    <ProgramListContainer />
                </div>

                {/* Section List with the Generate Timetable Button */}
                <div className="mt-6">
                    <div className="bg-base-100 p-6 rounded-lg shadow-lg">
                        <h2 className="text-lg font-semibold mb-4">Sections</h2>
                        <SectionListContainer />
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
            <ForTest hashMap={mapVal} />

            {/* pag section need Container section + sectionid + teacherid for error */}
            {/* <GeneratedTimetable
                sectionTimetables={sectionTimetables}
                teacherTimetables={teacherTimetables}
                onUpdateTimetables={setSectionTimetables}
                errors={{
                    containerName: 'Rosas',
                    teacherID: [9],
                    sectionID: [7],
                }}
            /> */}

            {/* pag teacher need Container teacher + sectionid + subjectid for error */}

            {/* <GeneratedTimetable
                sectionTimetables={sectionTimetables}
                teacherTimetables={teacherTimetables}
                fieldparam={'teacher'}
                columnField={['subject', 'section']}
                onUpdateTimetables={setTeacherTimetables}
                errors={{
                    containerName: 'Mark Tagalogon',
                    subjectID: [6],
                    sectionID: [7],
                }}
            /> */}

            {/* <div className="grid grid-cols-1 col-span-full gap-4 sm:grid-cols-2"></div> */}
        </div>
    );
}

export default Timetable;

// /* eslint-disable no-undef */
// /* eslint-disable  no-restricted-globals */
// /* eslint-disable  no-unused-expressions */
// /* eslint-disable import/no-amd */
