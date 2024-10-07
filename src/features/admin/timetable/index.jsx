import { useState, useEffect } from 'react';
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
import SubjectListContainer from '@components/Admin/SubjectListContainer';
import ProgramListContainer from '@components/Admin/ProgramListContainer';
import TeacherListContainer from '@components/Admin/TeacherListContainer';
import SectionListContainer from '@components/Admin/SectionListContainer';
import ExportImportDBButtons from '@components/Admin/ExportImportDBButtons';

const getTimetable = wrap(new WasmWorker());

function Timetable() {
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
    const sectionStartArray = [];

        let lowestSubjectDuration = breakTimeDuration;

        console.log('🚀 ~ handleButtonClick ~ subjectsStore:', subjectsStore);

        Object.entries(subjectsStore).forEach(([key, value]) => {
            console.log(`Key: ${key}, Value: ${value}`);

            if (value.classDuration < lowestSubjectDuration) {
                lowestSubjectDuration = value.classDuration;
            }
        });

        let offset = lowestSubjectDuration - 1;
        breakTimeDuration -= offset;

        console.log(
            '🚀 ~ handleButtonClick ~ lowestSubjectDuration:',
            lowestSubjectDuration
        );

    let cellCount = 0;
    for (const [sectionKey, { subjects, subjectUnits }] of Object.entries(
      sectionMap
    )) {
let rowCount = 0;

      for (const subject of subjects) {
        sectionSubjectArray.push(packInt16ToInt32(sectionKey, subject));
      }

      for (const subject of Object.keys(subjectUnits)) {
console.log('🚀 ~ handleButtonClick ~ subject:', subject);
        const unitCount = subjectUnits[subject];

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
          packInt16ToInt32(subject, subjectUnits[subject])
        );

                // TODO: might there be code smell on how it stores

        sectionSubjectDurationArray.push(
          packInt16ToInt32(
                        subject,
                        subjectsStore[subjectMap[subject]].classDuration / 10 -
                            offset
                    )
                );

                console.log(
                    '🚀 ~ handleButtonClick ~ subjectMap[subject].classDuration:',
                    subjectMap[subject].classDuration,
                    typeof subjectMap[subject].classDuration
        );
      }

            console.log('🚀 ~ handleButtonClick ~ rowCount:', rowCount);
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

    const max_iterations = 10000;
    const beesPopulations = 4;
    const beesEmployed = 2;
    const beesOnlooker = 2;
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
      console.log('🚀 ~ handleButtonClick ~ entry of timetable:', entry);

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
  <div className="mb-6 flex justify-end">
    <ExportImportDBButtons />
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

      <button
        className={clsx('btn btn-primary w-full mt-6', {
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

      <div className="mt-4">
        <ViolationList violations={violations} />
      </div>
    </div>
  </div>

  {/* Responsive Timetable Grid */}
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
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
    {/* Uncomment if needed */}
    {/* <GeneratedTimetable
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
