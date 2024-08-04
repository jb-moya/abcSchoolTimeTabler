import React, { useState, useEffect } from "react";

const ThemeToggler = () => {
    const [theme, setTheme] = useState(localStorage.getItem("theme"));

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    return (
        <input
            data-toggle-theme={theme}
            type="checkbox"
            className="toggle"
            defaultChecked
            onChange={() => {
                setTheme(theme === "dark" ? "light" : "dark");
                localStorage.setItem("theme", theme === "dark" ? "light" : "dark");
            }}
        />
    );
};

export default ThemeToggler;
