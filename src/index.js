import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { WasmProvider } from "./WasmContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <WasmProvider>
            <App />
        </WasmProvider>
    </React.StrictMode>
);