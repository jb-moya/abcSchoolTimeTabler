import { expose } from "comlink";
import abcWasm from "./cppFiles/abc.js";
import { unpackIntegers } from "./utils/packInt16ToInt64.js";

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

const getTimetable = async (params) =>
    new Promise(async (resolve, reject) => {
        try {
            const wasm = await abcWasm();

            console.log("wasm", params.sectionSubjects);

            const sectionSubjectsBuff = wasm._malloc(
                params.sectionSubjects.length *
                    params.sectionSubjects.BYTES_PER_ELEMENT
            );

            wasm.HEAP32.set(
                params.sectionSubjects,
                sectionSubjectsBuff / params.sectionSubjects.BYTES_PER_ELEMENT
            );

            const sectionSubjectUnitsBuff = wasm._malloc(
                params.sectionSubjectUnits.length *
                    params.sectionSubjectUnits.BYTES_PER_ELEMENT
            );

            wasm.HEAP32.set(
                params.sectionSubjectUnits,
                sectionSubjectUnitsBuff /
                    params.sectionSubjectUnits.BYTES_PER_ELEMENT
            );

            const teacherSubjectsBuff = wasm._malloc(
                params.teacherSubjects.length *
                    params.teacherSubjects.BYTES_PER_ELEMENT
            );

            wasm.HEAP32.set(
                params.teacherSubjects,
                teacherSubjectsBuff / params.teacherSubjects.BYTES_PER_ELEMENT
            );

            const resultBuff = wasm._malloc(params.resultLength * 8);

            wasm._runExperiment(
                params.maxIterations,
                params.numTeachers,
                params.totalSchoolClass,
                params.totalSection,
                sectionSubjectsBuff,
                teacherSubjectsBuff,
                sectionSubjectUnitsBuff,
                params.teacherSubjectsLength,
                params.beesPopulation,
                params.beesEmployed,
                params.beesOnlooker,
                params.beesScout,
                params.limits,
                params.workWeek,
                params.resultLength,
                resultBuff
            );

            const timetable = [];

            for (let i = 0; i < params.resultLength; i++) {
                let result = wasm.getValue(resultBuff + i * 8, "i64");

                result = unpackIntegers(result);
                timetable.push(result);
                // console.log(`Class ${i + 1}: ${result}`, result);
            }

            // console.log("resultBuff", resultBuff, timetable);

            wasm._free(sectionSubjectsBuff);
            wasm._free(teacherSubjectsBuff);
            wasm._free(resultBuff);

            resolve({ timetable, status: "success" });
        } catch (error) {
            reject({ error, status: "error" });
        }
    });

expose(getTimetable);
