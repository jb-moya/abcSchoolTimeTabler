import React, { useEffect } from "react";
import { useWasm } from "./WasmContext";
import packInt16ToInt32 from "./utils/packInt16ToInt32";
import { unpackInt64ToInt16 } from "./utils/packInt16ToInt64";
import ThemeToggler from "./ThemeToggler";

function App() {
    const { instance } = useWasm();
    const max_iterations = 70000;
    const beesPopulations = 5;
    const beesEmployedOptions = 5;
    const beesOnlookerOptions = 2;
    const beesScoutOptions = 2;
    const limits = 800; // dependent on no. of school class

    const num_teachers = 7;
    const num_rooms = 7;
    const num_timeslots = 7;
    const total_school_class = 5;
    const total_section = 1;


    const handleButtonClick = () => {
        if (!instance) return;
        console.log("clicked", instance);

        const sectionSubjects = new Int32Array([
            packInt16ToInt32(0, 1),
            packInt16ToInt32(0, 2),
            packInt16ToInt32(0, 3),
            packInt16ToInt32(0, 4),
            packInt16ToInt32(0, 5),
        ]);
        const sectionSubjectsBuff = instance._malloc(
            sectionSubjects.length * sectionSubjects.BYTES_PER_ELEMENT
        );
        instance.HEAP32.set(
            sectionSubjects,
            sectionSubjectsBuff / sectionSubjects.BYTES_PER_ELEMENT
        );

        const teacherSubjects = new Int32Array([
            packInt16ToInt32(0, 1),
            packInt16ToInt32(1, 2),
            packInt16ToInt32(2, 3),
            packInt16ToInt32(3, 4),
            packInt16ToInt32(4, 5),
            packInt16ToInt32(5, 6),
            packInt16ToInt32(6, 7),
        ]);

        const teacherSubjectsBuff = instance._malloc(
            teacherSubjects.length * teacherSubjects.BYTES_PER_ELEMENT
        );

        // Use HEAP32 to write the Int32Array data into the allocated memory
        instance.HEAP32.set(
            teacherSubjects,
            teacherSubjectsBuff / teacherSubjects.BYTES_PER_ELEMENT
        );

        // let result1 = new Int32Array(total_school_class);
        // let result2 = new Int32Array(total_school_class);

        const resultBuff = instance._malloc(total_school_class * 8);

        instance.ccall(
            "runExperiment",
            null,
            [
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
                "number",
            ],
            [
                max_iterations,
                num_teachers,
                num_rooms,
                num_timeslots,
                total_school_class,
                total_section,
                sectionSubjectsBuff,
                teacherSubjectsBuff,
                beesPopulations,
                beesEmployedOptions,
                beesOnlookerOptions,
                beesScoutOptions,
                limits,
                resultBuff,
            ]
        );

        for (let i = 0; i < total_school_class; i++) {
            let result = instance.getValue(resultBuff + i * 8, "i64");

            console.log(unpackInt64ToInt16(result));
        }

        instance._free(sectionSubjectsBuff);
        instance._free(teacherSubjectsBuff);
        instance._free(resultBuff);
    };

    return (
        <div className="App">
            <header className="App-header"> 
                <ThemeToggler />

                <button className="btn p-10 mr-12" onClick={handleButtonClick}>
                    Call process_data
                </button>
                <div className="bg-blue-700">testfff</div>
            </header>
        </div>
    );
}

export default App;

/* eslint-disable no-undef */
/* eslint-disable  no-restricted-globals */
/* eslint-disable  no-unused-expressions */
/* eslint-disable import/no-amd */
