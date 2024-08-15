/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {},
    },
    daisyui: {
        themes: [
            {
                lightEdu: {
                    primary: "#3949AB", // Same Blue as in dark theme for consistency
                    secondary: "#ABB2D3", // Soft Blue (calmness, focus)
                    accent: "#FFD700", // Gold (excellence, achievement)
                    neutral: "#F5F5F5", // Light Gray (neutrality, background)
                    "base-100": "#FFFFFF", // White (clean, open space)
                    info: "#64B5F6", // Light Blue (clarity, information)
                    success: "#81C784", // Green (growth, success)
                    warning: "#FFB74D", // Orange (caution, warning)
                    error: "#782121", // Soft Red (alert, error)
                },
                darkEdu: {
                    primary: "#1A237E", // Deep Blue (trust, reliability)
                    secondary: "#3949AB", // Lighter Blue (calmness, focus)
                    accent: "#FFD700", // Gold (excellence, achievement)
                    neutral: "#212121", // Dark Gray (balance, neutrality)
                    "base-100": "#121212", // Very Dark Gray (background)
                    info: "#64B5F6", // Light Blue (clarity, information)
                    success: "#81C784", // Green (growth, success)
                    warning: "#FFB74D", // Orange (caution, warning)
                    error: "#782121", // Soft Red (alert, error)
                },
            },
        ],
    },
    plugins: [require("daisyui")],
};
