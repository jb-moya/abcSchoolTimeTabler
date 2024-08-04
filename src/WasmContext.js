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

    useEffect(() => {
        const loadWasm = async () => {
            const factory = require("./cppFiles/abc.js");
            const wasmInstance = await factory();
            setInstance(wasmInstance);
        };

        loadWasm();
    }, []);

    return (
        <WasmContext.Provider value={{ instance }}>
            {children}
        </WasmContext.Provider>
    );
};
