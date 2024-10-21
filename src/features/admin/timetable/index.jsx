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

import { getTimeSlotString } from '../../../components/Admin/timeSlotMapper';
import Breadcrumbs from '@components/Admin/Breadcrumbs';
import {
    clearAllEntriesAndResetIDs,
} from "@src/indexedDB";


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

    return (
        <div className="App container mx-auto px-4 py-6">
            <div className="mb-6 flex justify-between items-center">
                    <Breadcrumbs title="Timetable" links={links} /> 
                    <div className="flex items-center gap-2">

                        <ExportImportDBButtons onClear={handleClearAndRefresh} />   
                            <button
                                className={clsx('btn btn-primary', {
                                    'cursor-not-allowed': timetableGenerationStatus === 'running',
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
            <div >
                <div className="mt-6 bg-base-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Subjects</h2>
                    <SubjectListContainer/>
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

            <GeneratedTimetable
                timetables={sectionTimetables}
                field={'section'}
                columnField={['teacher', 'subject']}
            />

            <GeneratedTimetable
                timetables={teacherTimetables}
                field={'teacher'}
                columnField={['subject', 'section']}
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
