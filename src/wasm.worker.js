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

            const resultBuff = wasm._malloc(params.resultLength * 8);
            const resultBuff_2 = wasm._malloc(params.resultLength * 8);

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
            console.log('resultLength', params.resultLength);
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
                params.resultLength,
                params.offset,
                resultBuff,
                resultBuff_2,

                enable_logging
            );

            const timetable = [];

            for (let i = 0; i < params.resultLength; i++) {
                let result = wasm.getValue(resultBuff + i * 8, 'i64');
                let result_2 = wasm.getValue(resultBuff_2 + i * 8, 'i64');

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

            // console.log("resultBuff", resultBuff, timetable);

            wasm._free(sectionSubjectsBuff);
            wasm._free(teacherSubjectsBuff);
            wasm._free(resultBuff);
            wasm._free(resultBuff_2);

            resolve({ timetable, status: 'success' });
        } catch (error) {
            reject({ error, status: 'error' });
        }
    });

expose(getTimetable);
