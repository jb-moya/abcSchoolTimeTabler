import React, { useState, useEffect } from "react";
import { CiExport, CiImport } from "react-icons/ci";
import {
  downloadData,
  exportIndexedDB,
  loadFile,
  importIndexedDB,
  DB_NAME,
  clearAllEntriesAcrossStores,
} from "@src/indexedDB";
import * as XLSX from 'xlsx';

import { addSubject, fetchSubjects } from "@features/subjectSlice";
import { addSection } from "@features/sectionSlice";
import { addTeacher } from "@features/teacherSlice";
import { addProgram } from "@features/programSlice";

import { getTimeSlotString } from "./timeSlotMapper";
import { setSubjectStatusIdle } from "@features/subjectSlice";
import { setSectionStatusIdle } from "@features/sectionSlice";
import { setTeacherStatusIdle } from "@features/teacherSlice";
import { setProgramStatusIdle } from "@features/programSlice";
import { useDispatch, useSelector } from "react-redux";

import { toast } from "sonner";
import { BiUpload } from "react-icons/bi";

const ExportImportDBButtons = () => {
  const dispatch = useDispatch();

  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );

  useEffect(() => {
    if (subjectStatus === 'idle') {
      dispatch(fetchSubjects());
    }
  }, [dispatch, subjectStatus]);

  const exportDB = (format) => {
    exportIndexedDB(DB_NAME)
      .then((exportData) => {
        if (format === 'json') {
          const jsonData = JSON.stringify(exportData);
          downloadData(jsonData, `${DB_NAME}.json`);
        } else if (format === 'excel') {
          // Convert JSON to Excel
          exportToExcel(exportData);
        }
      })
      .then(() => {
        toast.success("DB exported successfully");
      })
      .catch((error) => {
        toast.error("Error exporting DB");
        console.log(error);
        // console.error("Export error:", error);
      });
  };
  
  // Helper function to export JSON data to Excel format
  const exportToExcel = (exportData) => {
    const wb = XLSX.utils.book_new();
  
    const programSubjectMap = {};
    exportData.subjects.forEach(subject => {
      programSubjectMap[subject.id] = subject.subject;
    });
    const data = [
      ['program','7', '', '', '8', '', '', '9', '', '', '10', '', '', 'id'],
      ['', 'subjects', 'shift', 'startTime', 'subjects', 'shift', 'startTime', 'subjects', 'shift', 'startTime', 'subjects', 'shift', 'startTime', '']
    ];
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
      { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } },
      { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } },
      { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } },
      { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } }, 
    ];
    exportData.programs.forEach(program => {
      // Row for the detailed subjects, shift, and startTime info for each year
      const detailsRow = [
        program.program,
        program[7].subjects.map(subjectId => programSubjectMap[subjectId]).join(', '), // Subjects for Grade 7
        program[7].shift === 0 ? 'AM' : 'PM', // Shift for Grade 7
        getTimeSlotString(program[7].startTime), // Start time for Grade 7
        
        program[8].subjects.map(subjectId => programSubjectMap[subjectId]).join(', '), // Subjects for Grade 8
        program[8].shift === 1 ? 'PM' : 'AM', // Shift for Grade 8
        getTimeSlotString(program[8].startTime), // Start time for Grade 8

        program[9].subjects.map(subjectId => programSubjectMap[subjectId]).join(', '), // Subjects for Grade 9
        program[9].shift === 1 ? 'PM' : 'AM', // Shift for Grade 9
        getTimeSlotString(program[9].startTime), // Start time for Grade 9

        program[10].subjects.map(subjectId => programSubjectMap[subjectId]).join(', '), // Subjects for Grade 10
        program[10].shift === 0 ? 'AM' : 'PM', // Shift for Grade 10
        getTimeSlotString(program[10].startTime), // Start time for Grade 10
        program.id,
      ];

      data.push(detailsRow);
    });

    const programSheet = XLSX.utils.aoa_to_sheet(data);
    programSheet['!merges'] = merges;
    XLSX.utils.book_append_sheet(wb, programSheet, 'Programs');
  
    // Create a mapping of subject ID to subject name
    const sectionSubjectMap = {};
    exportData.subjects.forEach(subject => {
      sectionSubjectMap[subject.id] = subject.subject;  // { 1: 'sub1', 2: 'sub2', ... }
    });
    // Convert 'sections' to sheet with subject names, shift as AM/PM, and startTime as string
    const sectionSheetData = exportData.sections.map(section => ({
      ...section,
      subjects: Object.keys(section.subjects)
        .map(subjectId => sectionSubjectMap[subjectId]).join(', '),
      shift: section.shift === 0 ? 'AM' : 'PM',
      startTime: getTimeSlotString(section.startTime)
    }));
    const sectionSheet = XLSX.utils.json_to_sheet(sectionSheetData);
    XLSX.utils.book_append_sheet(wb, sectionSheet, 'Sections');
  
    // Convert 'subjects' to sheet
    const subjectSheet = XLSX.utils.json_to_sheet(exportData.subjects);
    XLSX.utils.book_append_sheet(wb, subjectSheet, 'Subjects');
    // Create a mapping of subject ID to subject name
    const subjectMap = {};
    exportData.subjects.forEach(subject => {
      subjectMap[subject.id] = subject.subject;  // { 1: 'sub1', 2: 'sub2', ... }
    });

    // Convert 'teachers' to sheet with subject names instead of IDs
    const teacherSheetData = exportData.teachers.map(teacher => ({
      ...teacher,
      subjects: teacher.subjects.map(subjectId => subjectMap[subjectId]).join(', ') // Convert subject IDs to names
    }));
    const teacherSheet = XLSX.utils.json_to_sheet(teacherSheetData);
    XLSX.utils.book_append_sheet(wb, teacherSheet, 'Teachers');

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `TIMETABLE DATA.xlsx`);
  };
  
  const downloadData = (data, filename) => {
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const importDB = (format) => {
    loadFile(format)
      .then((data) => {
        if (format === "json") {
          importIndexedDB(DB_NAME, data)
          .then((message) => {
            console.log(message);
          });
        } else if (format === "excel") {
          // console.log(data);
          importDBfromExcel(data);
        } else {
          // Fail-safe route for unexpected file types
          throw new Error("Unsupported file format. Please upload a JSON or Excel file.");
        }
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

  const importDBfromExcel = (data) => {
    Object.keys(data).forEach((sheetName) => {
      const sheetData = data[sheetName];

      if (sheetName.toLowerCase() === 'programs') {
      } else if (sheetName.toLowerCase() === 'sections') {
      } else if (sheetName.toLowerCase() === 'subjects') {
        sheetData.forEach((entry) => {
          dispatch(
            addSubject({
              subject: entry.subject,
              classDuration: entry.classDuration,
            })
          );
        });
      } else if (sheetName.toLowerCase() === 'teachers') {
        sheetData.forEach((entry) => {
          const subjectIds = [];
          
          const subjectsArray = entry.subjects.split(',').map(subject => subject.trim()); 
          subjectsArray.forEach((subjectName) => {
            for (const key in subjects) {
              if (subjects[key].subject === subjectName) {
                subjectIds.push(subjects[key].id);
                break;
              }
            }
          });
          dispatch(
            addTeacher({
              teacher: entry.teacher,
              subjects: subjectIds,
            })
          );
        });
      } else {
        console.log(`Unknown sheet: ${sheetName}`);
      }
    });

  }

  return (
    <div className="flex gap-2">     
      <button
        className="btn btn-sm btn-secondary"
        onClick={() => {
          document.getElementById("export-format-modal").showModal();
        }}
      >
        Export <CiExport size={20} />
      </button>
      
      <button
        className="btn btn-sm btn-secondary"
        onClick={() => {
          document.getElementById("import-confirmation-modal").showModal();
        }}
      >
        Import <CiImport size={20} />
      </button>

      {/* Export Format Modal */}
      <dialog id="export-format-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Choose Export Format</h3>
          <p className="py-4">Select the format in which you want to export the database:</p>
          <div className="modal-action">
            {/* Option to Export as JSON */}
            <button
              className="btn btn-primary"
              onClick={() => {
                exportDB("json");
                document.getElementById("export-format-modal").close();
                // exportDB();
              }}
            >
              Export as JSON
            </button>

            {/* Option to Export as Excel */}
            <button
              className="btn btn-primary"
              onClick={() => {
                exportDB("excel");
                document.getElementById("export-format-modal").close();
                // exportDB();
              }}
            >
              Export as Excel
            </button>

            <form method="dialog">
              <button className="btn btn-error">Cancel</button>
            </form>
          </div>
        </div>
      </dialog>

      <dialog id="import-confirmation-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Import Confirmation</h3>
          <p className="py-4">
            Importing will override all current data in the database. Are you
            sure?
          </p>
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={() => {
                clearAllEntriesAcrossStores();
                document.getElementById("import-confirmation-modal").close();
                document.getElementById("import-format-modal").showModal();
              }}
            >
              Upload Data File <BiUpload size={20} />
            </button>
            <form method="dialog">
              <div className="flex gap-2">
                <button className="btn btn-error">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
      <dialog id="import-format-modal" className="modal">
        <div className="modal-box">
            <h3 className="font-bold text-lg">Choose Import Format</h3>
            <p className="py-4">Select the format in which you want to import your data:</p>
            <div className="modal-action">
              {/* Option to Import a JSON */}
              <button
                className="btn btn-primary"
                onClick={() => {
                  importDB("json");
                  document.getElementById("import-format-modal").close();
                }}
              >
                Import JSON
              </button>

              {/* Option to Import an Excel */}
              <button
                className="btn btn-primary"
                onClick={() => {
                  importDB("excel");
                  document.getElementById("import-format-modal").close();
                }}
              >
                Import EXCEL
              </button>

              <form method="dialog">
                <button className="btn btn-error">Cancel</button>
              </form>
            </div>
          </div>
      </dialog>
    </div>
  );
};

export default ExportImportDBButtons;
