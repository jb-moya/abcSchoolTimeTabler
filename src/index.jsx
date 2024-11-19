import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
// import { WasmProvider } from "./WasmContext.jsx";
import store from "./store/store";
import { Provider } from "react-redux";
import { Toaster, toast} from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <Provider store={store}>
    {/* <WasmProvider> */}
    <Toaster />
    <App />
    {/* </WasmProvider> */}
  </Provider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
