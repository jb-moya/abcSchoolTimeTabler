import { useContext } from "react";
import { WasmContext } from "../WasmContext";

export const useWasm = () => {
    return useContext(WasmContext);
};
