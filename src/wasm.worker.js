import { expose } from 'comlink';
// import abcWasm from './cppFiles2/abc2.js';
import abcWasm from './cppFiles2/abc5.js';
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

/**
 * Asynchronously generates a timetable based on the provided parameters.
 *
 * @param {Object} params - The parameters for the timetable generation.
 * @param {number} params.maxIterations - The maximum number of iterations to run.
 * @param {number} params.numTeachers - The number of teachers.
 * @param {number} params.totalSectionSubjects - The total number of section subjects.
 * @param {number} params.totalSection - The total number of sections.
 * @param {number} params.numberOfSubjectConfiguration - The total number of subject configurations.
 * @param {Int32Array} params.sectionConfiguration - Array specifying section configurations.
* @param {Int32Array} params.sectionLocation - section location
 * @param {Int32Array} params.sectionSubjectConfiguration - Array specifying section subject configurations.
 * @param {Int32Array} params.subjectConfigurationSubjectUnits - Array specifying subject unit counts.
 * @param {Int32Array} params.subjectConfigurationSubjectDuration - Array specifying subject durations.
 * @param {Int32Array} params.subjectConfigurationSubjectFixedTimeslot - Array specifying fixed timeslots for subjects.
 * @param {Int32Array} params.subjectConfigurationSubjectFixedDay - Array specifying fixed days for subjects.
 * @param {Int32Array} params.subjectFixedTeacherSection - Array linking fixed teachers to specific sections.
 * @param {Int32Array} params.subjectFixedTeacher - Array linking fixed teachers to subjects.
 * @param {Int32Array} params.sectionStart - Array specifying section start times.
 * @param {Int32Array} params.teacherSubjects - Array mapping teachers to subjects.
 * @param {Int32Array} params.teacherWeekLoadConfig - Array specifying weekly load configurations for teachers.
* @param {Int32Array} params.buildingInfo - Array specifying building information.
 * @param {Int32Array} params.buildingAdjacency - Array specifying building adjacency information.
 * @param {number} params.teacherSubjectsLength - The length of the teacher subjects array.
 * @param {number} params.beesPopulation - The total number of bees in the algorithm's population.
 * @param {number} params.beesEmployed - The number of employed bees in the algorithm.
 * @param {number} params.beesOnlooker - The number of onlooker bees in the algorithm.
 * @param {number} params.beesScout - The number of scout bees in the algorithm.
 * @param {number} params.limit - The limit parameter for the algorithm.
 * @param {number} params.workWeek - The number of days in a work week.
 * @param {number} params.breakTimeDuration - Duration specifying break times.
 * @param {number} params.teacherBreakThreshold - Threshold for teachers requiring a break.
 * @param {number} params.teacherMiddleTimePointGrowAllowanceForBreakTimeslot - Allowance for growing break timeslots near the middle of the timepoint.
 * @param {number} params.minTotalClassDurationForTwoBreaks - Duration specifying the minimum total class duration for two breaks.
 * @param {number} params.defaultClassDuration - Duration specifying the default class duration.
 * @param {number} params.offsetDuration - Duration specifying the offset duration.
 * @param {number} params.resultTimetableLength - The length of the result timetable array.
 * @param {number} params.resultViolationLength - The length of the result violation array.
 * @param {boolean} params.enableLogging - Flag to enable or disable logging during execution.
 * @returns {Promise<void>} Resolves when the timetable generation is complete.
 */
const getTimetable = async (params) =>
    new Promise(async (resolve, reject) => {
        try {
            const wasm = await abcWasm();

            console.log('wasm', params.sectionSubjects);

            const sectionConfigurationBuff = allocateAndSetBuffer(
                wasm,
                params.sectionConfiguration
            );
const sectionLocationBuff = allocateAndSetBuffer(
                wasm,
                params.sectionLocation
            );
            const sectionSubjectConfigurationBuff = allocateAndSetBuffer(
                wasm,
                params.sectionSubjectConfiguration
            );
            const subjectConfigurationSubjectUnitsBuff = allocateAndSetBuffer(
                wasm,
                params.subjectConfigurationSubjectUnits
            );
            const subjectConfigurationSubjectDurationBuff =
                allocateAndSetBuffer(
                    wasm,
                    params.subjectConfigurationSubjectDuration
                );
            const subjectConfigurationSubjectFixedTimeslotBuff =
                allocateAndSetBuffer(
                    wasm,
                    params.subjectConfigurationSubjectFixedTimeslot
                );
            const subjectConfigurationSubjectFixedDayBuff =
                allocateAndSetBuffer(
                    wasm,
                    params.subjectConfigurationSubjectFixedDay
                );
            const subjectFixedTeacherSectionBuff = allocateAndSetBuffer(
                wasm,
                params.subjectFixedTeacherSection
            );
            const subjectFixedTeacherBuff = allocateAndSetBuffer(
                wasm,
                params.subjectFixedTeacher
            );
            const sectionStartBuff = allocateAndSetBuffer(
                wasm,
                params.sectionStart
            );
            const teacherSubjectsBuff = allocateAndSetBuffer(
                wasm,
                params.teacherSubjects
            );
            const teacherWeekLoadConfigBuff = allocateAndSetBuffer(
                wasm,
                params.teacherWeekLoadConfig
            );
const buildingInfoBuff = allocateAndSetBuffer(
                wasm,
                params.buildingInfo
            );
            const buildingAdjacencyBuff = allocateAndSetBuffer(
                wasm,
                params.buildingAdjacency
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

            console.log(
                '🚀 ~ newPromise ~ params.offsetDuration:',
                params.offsetDuration
            );
            console.log(
                '🚀 ~ newPromise ~ params.offsetDuration:',
                params.offsetDuration
            );
            console.log(
                '🚀 ~ newPromise ~ params.offsetDuration:',
                params.offsetDuration
            );
            console.log(
                '🚀 ~ newPromise ~ params.defaultClassDuration:',
                params.defaultClassDuration
            );
            console.log(
                '🚀 ~ newPromise ~ params.minTotalClassDurationForTwoBreaks:',
                params.minTotalClassDurationForTwoBreaks
            );
            console.log(
                '🚀 ~ newPromise ~ params.teacherMiddleTimePointGrowAllowanceForBreakTimeslot:',
                params.teacherMiddleTimePointGrowAllowanceForBreakTimeslot
            );
            console.log(
                '🚀 ~ newPromise ~ params.teacherBreakThreshold:',
                params.teacherBreakThreshold
            );
            console.log(
                '🚀 ~ newPromise ~ params.breakTimeDuration:',
                params.breakTimeDuration
            );
            console.log('🚀 ~ newPromise ~ params.workWeek:', params.workWeek);
            console.log('🚀 ~ newPromise ~ params.limit:', params.limit);
            console.log(
                '🚀 ~ newPromise ~ params.beesOnlooker:',
                params.beesOnlooker
            );
            console.log(
                '🚀 ~ newPromise ~ params.beesScout:',
                params.beesScout
            );
            console.log(
                '🚀 ~ newPromise ~ params.beesEmployed:',
                params.beesEmployed
            );
            console.log(
                '🚀 ~ newPromise ~ params.beesPopulation:',
                params.beesPopulation
            );
            console.log(
                '🚀 ~ newPromise ~ params.teacherSubjectsLength:',
                params.teacherSubjectsLength
            );
            console.log(
                '🚀 ~ newPromise ~ params.numberOfSubjectConfiguration:',
                params.numberOfSubjectConfiguration
            );
            console.log(
                '🚀 ~ newPromise ~ params.totalSection:',
                params.totalSection
            );
            console.log(
                '🚀 ~ newPromise ~ params.totalSectionSubjects:',
                params.totalSectionSubjects
            );
            console.log(
                '🚀 ~ newPromise ~ params.numTeachers:',
                params.numTeachers
            );
            console.log(
                '🚀 ~ newPromise ~ params.maxIterations:',
                params.maxIterations
            );

            wasm._runExperiment(
                params.maxIterations,
                params.numTeachers,
                params.totalSectionSubjects,
                params.totalSection,
                params.numberOfSubjectConfiguration,

                sectionConfigurationBuff,
sectionLocationBuff,
                sectionSubjectConfigurationBuff,
                subjectConfigurationSubjectUnitsBuff,
                subjectConfigurationSubjectDurationBuff,
                subjectConfigurationSubjectFixedTimeslotBuff,
                subjectConfigurationSubjectFixedDayBuff,
                subjectFixedTeacherSectionBuff,
                subjectFixedTeacherBuff,
                sectionStartBuff,
                teacherSubjectsBuff,
                teacherWeekLoadConfigBuff,
buildingInfoBuff,
                buildingAdjacencyBuff,

                params.teacherSubjectsLength,
                params.beesPopulation,
                params.beesEmployed,
                params.beesOnlooker,
                params.beesScout,
                params.limit,
                params.workWeek,

                params.breakTimeDuration,
                params.teacherBreakThreshold,
                params.teacherMiddleTimePointGrowAllowanceForBreakTimeslot,
                params.minTotalClassDurationForTwoBreaks,
                params.defaultClassDuration,
                params.offsetDuration,
                resultTimetableBuff,
                resultTimetable_2,
                resultViolationBuff,

                params.enableLogging
            );

            const timetable = [];

            for (let i = 0; i < params.resultTimetableLength; i++) {
                let result = wasm.getValue(resultTimetableBuff + i * 8, 'i64');
                let result_2 = wasm.getValue(resultTimetable_2 + i * 8, 'i64');

                let resultArray = unpackIntegers(result);
                let resultArray_2 = unpackIntegers(result_2);

                // -1 is the sentinel value for the end of the result array
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

            console.log('timetable result', timetable);

            wasm._free(sectionConfigurationBuff);
            wasm._free(sectionSubjectConfigurationBuff);
            wasm._free(subjectConfigurationSubjectUnitsBuff);
            wasm._free(subjectConfigurationSubjectDurationBuff);
            wasm._free(subjectConfigurationSubjectFixedTimeslotBuff);
            wasm._free(subjectConfigurationSubjectFixedDayBuff);
            wasm._free(subjectFixedTeacherSectionBuff);
            wasm._free(subjectFixedTeacherBuff);
            wasm._free(sectionStartBuff);
            wasm._free(teacherSubjectsBuff);
            wasm._free(teacherWeekLoadConfigBuff);
            wasm._free(resultTimetableBuff);
            wasm._free(resultTimetable_2);
            wasm._free(resultViolationBuff);

            resolve({ timetable, status: 'success' });
        } catch (error) {
            reject({ error, status: 'error' });
        }
    });

expose(getTimetable);
