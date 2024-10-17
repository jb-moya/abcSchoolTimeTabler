import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
// import { WasmProvider } from "./WasmContext.jsx";
import store from "./store/store";
import { Provider } from "react-redux";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <Provider store={store}>
    {/* <WasmProvider> */}
    <Toaster
      richColors
      toastOptions={{
        style: {
          backgroundColor: "#1E40AF", 
          color: "#ffffff",
          borderRadius: "0.375rem", 
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)", 
        },
        success: {
          style: {
            backgroundColor: "#10B981", // Success color (green)
          },
        },
        error: {
          style: {
            backgroundColor: "#EF4444", // Error color (red)
          },
        },
        info: {
          style: {
            backgroundColor: "#2563EB", // Info color (blue)
          },
        },
        loading: {
          style: {
            backgroundColor: "#F59E0B", // Loading color (yellow)
          },
        },
      }}
    />
    <App />
    {/* </WasmProvider> */}
  </Provider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
