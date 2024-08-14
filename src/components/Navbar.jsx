import React from "react";
import ThemeToggler from "../ThemeToggler";
import ExportImportDBButtons from "./ExportImportDBButtons";

const Navbar = () => {


    return (
        <div className="flex py-2 justify-between my-2 items-center">
            <ThemeToggler />
            <ExportImportDBButtons />
        </div>
    );
};

export default Navbar;
