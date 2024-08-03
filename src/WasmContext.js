import React, {
    createContext,
    useRef,
    useContext,
    useState,
    useEffect,
} from "react";

// Create the context
const WasmContext = createContext(null);

// Custom hook to use the Wasm context
export const useWasm = () => {
    return useContext(WasmContext);
};

// Provider component
export const WasmProvider = ({ children }) => {
    const [instance, setInstance] = useState(null);
    const getTimetableRef = useRef(() => {});

    useEffect(() => {
        const loadWasm = async () => {
            const factory = require("./cppFiles/abc.js");
            const wasmInstance = await factory();
            setInstance(wasmInstance);
        };

        loadWasm();
    }, []);

    useEffect(() => {
        if (instance) {
            getTimetableRef.current = instance.cwrap("runExperiment", null, [
                "number",
            ]);
        } else {
            getTimetableRef.current = () => {};
        }
    }, [instance]);

    return (
        <WasmContext.Provider value={{ getTimetable: getTimetableRef.current }}>
            {children}
        </WasmContext.Provider>
    );
};
