import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import MyPlot from "./MyPlot.js";

var factory = require("./hello.js");

factory().then((instance) => {
    const inputArr = new Float64Array([0, 1, 2, 3, 5]);
    const inputBuff = instance._malloc(
        inputArr.length * inputArr.BYTES_PER_ELEMENT
    );

    instance.HEAPF64.set(inputArr, inputBuff / inputArr.BYTES_PER_ELEMENT);

    let outputArr = new Float64Array(inputArr.length);
    
    const outputBuff = instance._malloc(
        inputArr.length * inputArr.BYTES_PER_ELEMENT
    );

    instance.ccall(
        "process_data",
        "number",
        ["number", "number", "number"],
        [inputBuff, outputBuff, inputArr.length]
    );

    for (let i = 0; i < outputArr.length; i++) {
        outputArr[i] = instance.getValue(
            outputBuff + i * outputArr.BYTES_PER_ELEMENT,
            "double"
        );
    }

    console.log(inputArr);
    console.log(outputArr);

    instance._free(outputBuff);
    instance._free(inputBuff);

    const root = ReactDOM.createRoot(document.getElementById("root"));

    root.render(
        <React.StrictMode>
            <App />
            <MyPlot xs={inputArr} ys={outputArr} />
        </React.StrictMode>
    );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
