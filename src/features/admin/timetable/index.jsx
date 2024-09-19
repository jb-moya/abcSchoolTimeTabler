import React, { useState, useEffect } from 'react';
import packInt16ToInt32 from '@utils/packInt16ToInt32';
import { useSelector } from 'react-redux';
import { wrap } from 'comlink';
import WasmWorker from '@src/wasm.worker?worker';
import Configuration from '@components/Admin/Configuration';
import clsx from 'clsx';
import GeneratedTimetable from '@components/Admin/TimeTable';
import validateTimetableVariables from '@validation/validateTimetableVariables';
import { toast } from 'sonner';
import ViolationList from '@components/Admin/ViolationList';
import findInObject from '@utils/utils';
import SubjectListContainer from '../../../components/Admin/SubjectListContainer';
import ProgramListContainer from '../../../components/Admin/ProgramListContainer';
import TeacherListContainer from '../../../components/Admin/TeacherListContainer';
import SectionListContainer from '../../../components/Admin/SectionListContainer';
// import TeacherListDisplay from '@components/Admin/TeacherListDisplay';
// import SubjectListDisplay from '@components/Admin/SubjectListDisplay';
// import SectionListDisplay from '@components/Admin/SectionListDisplay';
// import ProgramListDisplay from '@components/Admin/ProgramListDisplay';

const getTimetable = wrap(new WasmWorker());

function Timetable() {
  const { subjects } = useSelector((state) => state.subject);
  const { teachers } = useSelector((state) => state.teacher);
  const { sections } = useSelector((state) => state.section);
  const { programs } = useSelector((state) => state.program);

  const numOfSchoolDays = localStorage.getItem('numOfSchoolDays');

  const [timetable, setTimetable] = useState([]);
  const [sectionTimetables, setSectionTimetables] = useState({});
  const [teacherTimetables, setTeacherTimetables] = useState({});
  const [timetableGenerationStatus, setTimetableGenerationStatus] =
    useState('idle');
  const [violations, setViolations] = useState([]);

  // Scope and Limitations
  // Room-Section Relationship: Each room is uniquely assigned to a specific subject, establishing a 1:1 relationship.
  // Due to this strict pairing, room allocation is not a factor in timetable generation.

  // Curriculum-Driven Course Selection: Students are required to follow a predefined curriculum.
  // They do not have the option to select subjects independently.

  // Standardized Class Start and Break Times: The start time for the first class and the timing of breaks are
  // standardized across all sections and teachers, ensuring uniformity in the daily schedule.

  const timeSlotMap = {
    0: '06:00 - 06:40',
    1: '06:40 - 07:20',
    2: '07:20 - 08:00',
    3: '08:00 - 08:40',
    4: '08:40 - 09:20',
    5: '09:20 - 10:00',
    6: '10:00 - 10:40',
    7: '10:40 - 11:20',
    8: '11:20 - 12:00',
    9: '12:00 - 12:40',
    10: '12:40 - 01:20',
  };

  const beforeBreakTime = {
    2: '08:30 - 09:00',
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
          subjects: subjectIDs.map((subjectID) => subjectMapReverse[subjectID]),
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
    console.log("teacherMap", teacherMap);
    // console.log("subjectMapReverse", subjectMapReverse);
    console.log('sectionMap', sectionMap);

    const defaultClassDuration = 2;

    const sectionSubjectArray = [];
    const sectionSubjectUnitArray = [];
    const sectionSubjectDurationArray = [];
    const sectionStartArray = [];

    let cellCount = 0;
    for (const [sectionKey, { subjects, subjectUnits }] of Object.entries(
      sectionMap
    )) {
      for (const subject of subjects) {
        sectionSubjectArray.push(packInt16ToInt32(sectionKey, subject));
      }

      for (const subject of Object.keys(subjectUnits)) {
        const unitCount = subjectUnits[subject];

        if (unitCount === 0) {
          cellCount++;
        } else {
          cellCount += unitCount;
        }

        sectionSubjectUnitArray.push(
          packInt16ToInt32(subject, subjectUnits[subject])
        );

        sectionSubjectDurationArray.push(
          packInt16ToInt32(subject, defaultClassDuration)
        );
      }
    }

    const sectionSubjects = new Int32Array([...sectionSubjectArray]);
    const sectionSubjectUnits = new Int32Array([...sectionSubjectUnitArray]);
    const sectionSubjectDurations = new Int32Array([
      ...sectionSubjectDurationArray,
    ]);

    const max_iterations = 10000;
    const beesPopulations = 50;
    const beesEmployed = 25;
    const beesOnlooker = 25;
    const beesScout = 1;
    const limits = 200;
    const numTeachers = Object.keys(teacherMap).length;
    const totalSchoolClass = sectionSubjectArray.length;
    const totalSection = Object.keys(sectionMap).length;

    for (let i = 0; i < totalSection; i++) {
      sectionStartArray[i] = 0;
    }
    const sectionStarts = new Int32Array([...sectionStartArray]);

    const teacherSubjectArray = [];

    for (const [teacherKey, { subjects }] of Object.entries(teacherMap)) {
      for (const subject of subjects) {
        teacherSubjectArray.push(packInt16ToInt32(teacherKey, subject));
      }
    }

    const teacherSubjects = new Int32Array([...teacherSubjectArray]);

    const breakTimeDuration = 1;
    const breakTimeslotAllowance = 6;
    const teacherBreakThreshold = 4;
    const minClassesForTwoBreaks = 10;

    const params = {
      maxIterations: max_iterations,
      numTeachers: numTeachers,
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
      beesEmployed: beesEmployed,
      beesOnlooker: beesOnlooker,
      beesScout: beesScout,
      limits: limits,
      workWeek: numOfSchoolDays,

      maxTeacherWorkLoad: 9,
      breakTimeDuration: breakTimeDuration,
      breakTimeslotAllowance: breakTimeslotAllowance,
      teacherBreakThreshold: teacherBreakThreshold,
      minClassesForTwoBreaks: minClassesForTwoBreaks,
      defaultClassDuration: defaultClassDuration,
      resultLength: cellCount,
    };

    setTimetableGenerationStatus('running');
    const { timetable, status } = await getTimetable(params);
    setTimetableGenerationStatus(status);

    const timetableMap = [];
    const sectionTimetable = {};
    const teacherTimetable = {};

    for (const entry of timetable) {
      console.log("F", entry, typeof entry[0]);
      const section = sectionMap[entry[0]].id;
      const subject = subjectMap[entry[1]] || null;
      const teacher = (teacherMap[entry[2]] || { id: null}).id;

      const timeslot = entry[3];
      const day = entry[4];

      const existingSectionEntry = findInObject(
        sectionTimetable[section],
        ['subject', 'teacher', 'timeslot'],
        [subject, teacher, timeslot]
      );

      // const existingSectionEntry = false;

      if (existingSectionEntry) {
        // If it exists, push the day to the existing entry's day array
        if (Array.isArray(existingSectionEntry.day)) {
          existingSectionEntry.day.push(day);
        } else {
          console.log('ff', existingSectionEntry.day);
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
        ['section', 'subject', 'timeslot'],
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
    <div className="App container mx-auto px-4 mb-10">
      <Configuration />

      <div className="flex gap-4">
        <div className="w-4/12">
          <SubjectListContainer mode={1} />
        </div>
        <div className="w-8/12">
          <ProgramListContainer mode={1} />
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <div className="w-9/12">
          <TeacherListContainer mode={1} />
        </div>
      </div>
      <div className="w-full ">
        <SectionListContainer mode={1} />
        <button
          className={clsx('btn btn-primary w-full', {
            'cursor-not-allowed': timetableGenerationStatus === 'running',
            'btn-error': timetableGenerationStatus === 'error',
            'mt-5': true,
          })}
          onClick={() => {
            if (validate()) {
              handleButtonClick();
            }
          }}
          disabled={timetableGenerationStatus === 'running'}
        >
          {timetableGenerationStatus == 'running' ? (
            <div className="flex gap-2">
              <span>Generating</span>
              <span className="loading loading-spinner loading-xs"></span>
            </div>
          ) : (
            'Generate Timetable'
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
          field={'section'}
          timeSlotMap={timeSlotMap}
          firstColumnMap={subjects}
          secondColumnMap={teachers}
          columnField={['subject', 'teacher']}
          beforeBreakTime={beforeBreakTime}
        />
{/* 
        <GeneratedTimetable
          timetables={teacherTimetables}
          collection={teachers}
          field={'teacher'}
          timeSlotMap={timeSlotMap}
          firstColumnMap={sections}
          secondColumnMap={subjects}
          columnField={['section', 'subject']}
          beforeBreakTime={beforeBreakTime}
        /> */}
      </div>
    </div>
  );
}

export default Timetable;

// /* eslint-disable no-undef */
// /* eslint-disable  no-restricted-globals */
// /* eslint-disable  no-unused-expressions */
// /* eslint-disable import/no-amd */
