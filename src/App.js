import './App.css';
import { useWasm } from "./WasmContext";

function App() {
    const wasm = useWasm();

    const handleButtonClick = () => {
        if (wasm) {
            wasm.ccall("process_data", null, ["number"], [0]);
        }
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
