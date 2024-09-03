import React from "react";
import { CiExport, CiImport } from "react-icons/ci";
import {
    downloadData,
    exportIndexedDB,
    loadFile,
    importIndexedDB,
    DB_NAME,
    clearAllEntriesAcrossStores,
} from "../indexedDB";
import { setSubjectStatusIdle } from "../features/subjectSlice";
import { setSectionStatusIdle } from "../features/sectionSlice";
import { setTeacherStatusIdle } from "../features/teacherSlice";
import { setProgramStatusIdle } from "../features/programSlice";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";

import { toast } from "sonner";
import { BiUpload } from "react-icons/bi";

const ExportImportDBButtons = () => {
    const dispatch = useDispatch();

    const exportDB = () => {
        exportIndexedDB(DB_NAME)
            .then((exportData) => {
                const jsonData = JSON.stringify(exportData);
                console.log("DB MO");
                console.log(jsonData);
                downloadData(jsonData, `${DB_NAME}.json`);
            })
            .then(() => {
                toast.success("DB exported successfully");
            })
            .catch((error) => {
                toast.error("Error exporting DB");
                console.log(error);
            });
    };

    const importDB = () => {
        loadFile()
            .then((jsonData) => {
                importIndexedDB(DB_NAME, jsonData).then((message) => {
                    console.log(message);
                });
            })
            .then(() => {
                dispatch(setSubjectStatusIdle());
                dispatch(setTeacherStatusIdle());
                dispatch(setProgramStatusIdle());
                dispatch(setSectionStatusIdle());
            })
            .then(() => {
                toast.success("DB imported successfully");
            })
            .catch((error) => {
                toast.error("Error importing DB");
                console.log(error);
            })
            .finally(() => {
                document.getElementById("import-confirmation-modal").close();
            });
    };

    return (
        <div className="flex gap-2">
            <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                    exportDB();
                }}
            >
                Export <CiExport size={20} />
            </button>
            <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                    document
                        .getElementById("import-confirmation-modal")
                        .showModal();
                }}
            >
                Import <CiImport size={20} />
            </button>

            <dialog id="import-confirmation-modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Import Confirmation</h3>
                    <p className="py-4">
                        Importing will override all current data in the
                        database. Are you sure?
                    </p>
                    <div className="modal-action">
                        <form method="dialog">
                            <div className="flex gap-2">
                                <button className="btn btn-error">
                                    Cancel
                                </button>
                            </div>
                        </form>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                clearAllEntriesAcrossStores();
                                importDB();
                            }}
                        >
                            Upload Data File <BiUpload size={20} />
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default ExportImportDBButtons;
