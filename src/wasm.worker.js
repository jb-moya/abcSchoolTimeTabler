import { expose } from 'comlink';
import abcWasm from './cppFiles2/abc2.js';
import { unpackIntegers } from './utils/packInt16ToInt64.js';

// console.log("params.maxIterations", params.maxIterations);
// console.log("params.numTeachers", params.numTeachers);
// console.log("params.numRooms", params.numRooms);
// console.log("params.numTimeslots", params.numTimeslots);
// console.log("params.totalSchoolClass", params.totalSchoolClass);
// console.log("params.totalSection", params.totalSection);
// console.log("params.sectionSubjects", params.sectionSubjects);
// console.log("params.teacherSubjects", params.teacherSubjects);
// console.log(
//     "params.teacherSubjectsLength",
//     params.teacherSubjectsLength
// );
// console.log("params.beesPopulation", params.beesPopulation);
// console.log("params.beesEmployed", params.beesEmployed);
// console.log("params.beesOnlooker", params.beesOnlooker);
// console.log("params.beesScout", params.beesScout);
// console.log("params.limits", params.limits);

function allocateAndSetBuffer(wasm, dataArray) {
  // Calculate buffer size based on data array length and BYTES_PER_ELEMENT
  const bufferSize = dataArray.length * dataArray.BYTES_PER_ELEMENT;

  // Allocate memory for the buffer
  const buffer = wasm._malloc(bufferSize);

  // Set data into the allocated memory
  wasm.HEAP32.set(dataArray, buffer / dataArray.BYTES_PER_ELEMENT);

  return buffer;
}

const getTimetable = async (params) =>
  new Promise(async (resolve, reject) => {
    try {
      const wasm = await abcWasm();

      console.log('wasm', params.sectionSubjects);

      const sectionSubjectsBuff = allocateAndSetBuffer(
        wasm,
        params.sectionSubjects
      );
      const sectionSubjectUnitsBuff = allocateAndSetBuffer(
        wasm,
        params.sectionSubjectUnits
      );
      const teacherSubjectsBuff = allocateAndSetBuffer(
        wasm,
        params.teacherSubjects
      );
      const sectionStartsBuff = allocateAndSetBuffer(
        wasm,
        params.sectionStarts
      );
      const sectionSubjectDurationsBuff = allocateAndSetBuffer(
        wasm,
        params.sectionSubjectDurations
      );

      const resultBuff = wasm._malloc(params.resultLength * 8);

      wasm._runExperiment(
        params.maxIterations,
        params.numTeachers,
        params.totalSchoolClass,
        params.totalCellBlock,
        params.totalSection,

        sectionSubjectsBuff,
        sectionSubjectDurationsBuff,
        sectionStartsBuff,
        teacherSubjectsBuff,
        sectionSubjectUnitsBuff,
        params.teacherSubjectsLength,

        params.beesPopulation,
        params.beesEmployed,
        params.beesOnlooker,
        params.beesScout,
        params.limits,
        params.workWeek,

        params.maxTeacherWorkLoad,
        params.breakTimeDuration,
        params.breakTimeslotAllowance,
        params.teacherBreakThreshold,
        params.minClassesForTwoBreaks,
        params.defaultClassDuration,
        params.resultLength,

        resultBuff
      );

      const timetable = [];

      for (let i = 0; i < params.resultLength; i++) {
        let result = wasm.getValue(resultBuff + i * 8, 'i64');

        result = unpackIntegers(result);
        timetable.push(result);
        // console.log(`Class ${i + 1}: ${result}`, result);
      }

      // console.log("resultBuff", resultBuff, timetable);

      wasm._free(sectionSubjectsBuff);
      wasm._free(teacherSubjectsBuff);
      wasm._free(resultBuff);

      resolve({ timetable, status: 'success' });
    } catch (error) {
      reject({ error, status: 'error' });
    }
  });

expose(getTimetable);
