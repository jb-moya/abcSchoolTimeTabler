// MyPlot.js
import React, { useEffect } from "react";
import Plotly from "plotly.js-dist";

function MyPlot(props) {
    const xs = props.xs;
    const ys = props.ys;

    useEffect(() => {
        const TESTER = document.getElementById("tester");
        Plotly.newPlot(TESTER, [
            {
                x: xs,
                y: ys,
                type: "scatter",
            },
        ]);
    }, [xs, ys]);

    return (
        <div
            className="MyPlot"
            id="tester"
            style={{ width: "600px", height: "250px" }}
        ></div>
    );
}

export default MyPlot;
