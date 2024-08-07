// import { createContext, useState, useEffect } from "react";

// // Create the context
// const WasmContext = createContext(null);

// // Custom hook to use the Wasm context

// // Provider component
// const WasmProvider = ({ children }) => {
//     const [instance, setInstance] = useState(null);

//     useEffect(() => {
//         const loadWasm = async () => {
//             import("./cppFiles/abc.js")
//                 .then((module) => {
//                     const wasmModule = module.default || module;

//                     if (typeof wasmModule === "function") {
//                         return wasmModule();
//                     } else {
//                         throw new Error(
//                             "The imported module does not export a callable function"
//                         );
//                     }
//                 })
//                 .then((wasmInstance) => {
//                     setInstance(wasmInstance);
//                 })
//                 .catch((error) => {
//                     console.error("Failed to load WASM module:", error);
//                 });
//         };

//         loadWasm();
//     }, []);

//     return (
//         <WasmContext.Provider value={{ instance }}>
//             {children}
//         </WasmContext.Provider>
//     );
// };

// export { WasmContext, WasmProvider };
