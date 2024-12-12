import { expose } from 'comlink';
import abcWasm from './cppFiles2/abc2.js';
import { unpackIntegers } from './utils/packInt16ToInt64.js';

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
            const sectionSubjectOrdersBuff = allocateAndSetBuffer(
                wasm,
                params.sectionSubjectOrders
            );

            const resultTimetableBuff = wasm._malloc(
                params.resultTimetableLength * 8
            );
            const resultTimetable_2 = wasm._malloc(
                params.resultTimetableLength * 8
            );
            const resultViolationBuff = wasm._malloc(
                params.resultViolationLength * 8
            );

            const enable_logging = false;

            console.log('maxIterations', params.maxIterations);
            console.log('numTeachers', params.numTeachers);
            console.log('totalSchoolClass', params.totalSchoolClass);
            console.log('totalSection', params.totalSection);
            console.log('teacherSubjectsLength', params.teacherSubjectsLength);
            console.log('beesPopulation', params.beesPopulation);
            console.log('beesEmployed', params.beesEmployed);
            console.log('beesOnlooker', params.beesOnlooker);
            console.log('beesScout', params.beesScout);
            console.log('limits', params.limits);
            console.log('workWeek', params.workWeek);
            console.log('maxTeacherWorkLoad', params.maxTeacherWorkLoad);
            console.log('breakTimeDuration', params.breakTimeDuration);
            console.log(
                'breakTimeslotAllowance',
                params.breakTimeslotAllowance
            );
            console.log('teacherBreakThreshold', params.teacherBreakThreshold);
            console.log(
                'minTotalClassDurationForTwoBreaks',
                params.minTotalClassDurationForTwoBreaks
            );
            console.log('defaultClassDuration', params.defaultClassDuration);
            console.log('resultTimetableLength', params.resultTimetableLength);
            console.log('offset', params.offset);

            wasm._runExperiment(
                params.maxIterations,
                params.numTeachers,
                params.totalSchoolClass,
                params.totalSection,

                sectionSubjectsBuff,
                sectionSubjectDurationsBuff,
                sectionSubjectOrdersBuff,
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
                params.minTotalClassDurationForTwoBreaks,
                params.defaultClassDuration,
                params.resultTimetableLength,
                params.offset,
                resultTimetableBuff,
                resultTimetable_2,
                resultViolationBuff,

                enable_logging
            );

            const timetable = [];

            for (let i = 0; i < params.resultTimetableLength; i++) {
                let result = wasm.getValue(resultTimetableBuff + i * 8, 'i64');
                let result_2 = wasm.getValue(resultTimetable_2 + i * 8, 'i64');

                let resultArray = unpackIntegers(result);
                let resultArray_2 = unpackIntegers(result_2);

                if (
                    resultArray_2[2] == -1 &&
                    resultArray_2[3] == -1 &&
                    resultArray_2[4] == -1
                ) {
                    break;
                }

                let combined = resultArray.concat(resultArray_2);

                timetable.push(combined);
            }

            for (let i = 0; i < params.resultViolationLength; i++) {
                let result = wasm.getValue(resultViolationBuff + i * 8, 'i64');

                let resultArray = unpackIntegers(result);

                if (
                    resultArray[0] == -1 &&
                    resultArray[1] == -1 &&
                    resultArray[2] == -1 &&
                    resultArray[3] == -1 &&
                    resultArray[4] == -1
                ) {
                    console.log('done');
                    break;
                }

                console.log('🚀 ~ newPromise ~ resultArray:', resultArray);
            }

            // console.log("resultBuff", resultBuff, timetable);

            wasm._free(sectionSubjectsBuff);
            wasm._free(sectionSubjectDurationsBuff);
            wasm._free(sectionSubjectOrdersBuff);
            wasm._free(sectionStartsBuff);
            wasm._free(teacherSubjectsBuff);
            wasm._free(sectionSubjectUnitsBuff);
            wasm._free(resultTimetableBuff);
            wasm._free(resultTimetable_2);
            wasm._free(resultViolationBuff);

            resolve({ timetable, status: 'success' });
        } catch (error) {
            reject({ error, status: 'error' });
        }
    });

expose(getTimetable);
