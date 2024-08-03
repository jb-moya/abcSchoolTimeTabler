import "./App.css";
import { useWasm } from "./WasmContext";

function App() {
    const { getTimetable } = useWasm();

    const handleButtonClick = () => {
        // const inputArr = new Float64Array([0, 1, 2, 3, 5]);
        // const inputBuff = wasm._malloc(
        //     inputArr.length * inputArr.BYTES_PER_ELEMENT
        // );
        // wasm.HEAPF64.set(inputArr, inputBuff / inputArr.BYTES_PER_ELEMENT);

        getTimetable();
    };

    return (
        <div className="App">
            <header className="App-header">
                <button onClick={handleButtonClick}>Call process_data</button>
            </header>
        </div>
    );
}

export default App;

/* eslint-disable no-undef */
/* eslint-disable  no-restricted-globals */
/* eslint-disable  no-unused-expressions */
/* eslint-disable import/no-amd */
