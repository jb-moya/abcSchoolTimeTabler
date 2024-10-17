import React, { useState, useEffect } from "react";
import { CiExport, CiImport } from "react-icons/ci";
import {
  exportIndexedDB,
  loadFile,
  importIndexedDB,
  DB_NAME,
  clearAllEntriesAndResetIDs,
} from "@src/indexedDB";
import * as XLSX from 'xlsx';

import { addSubject, fetchSubjects } from "@features/subjectSlice";
import { addSection } from "@features/sectionSlice";
import { addTeacher, fetchTeachers } from "@features/teacherSlice";
import { addProgram, fetchPrograms } from "@features/programSlice";

import { getTimeSlotString, getTimeSlotIndex } from "./timeSlotMapper";
import { setSubjectStatusIdle } from "@features/subjectSlice";
import { setSectionStatusIdle } from "@features/sectionSlice";
import { setTeacherStatusIdle } from "@features/teacherSlice";
import { setProgramStatusIdle } from "@features/programSlice";
import { useDispatch, useSelector } from "react-redux";

import { toast } from "sonner";
import { BiUpload } from "react-icons/bi";

const ExportImportDBButtons = ({ onClear }) => {
  const dispatch = useDispatch();

  const { programs, status: programStatus } = useSelector(
    (state) => state.program
  );

  const { subjects, status: subjectStatus } = useSelector(
    (state) => state.subject
  );

  const { teachers, status: teacherStatus } = useSelector(
    (state) => state.teacher
  );

  useEffect(() => {
    if (programStatus === 'idle') {
      dispatch(fetchPrograms());
    }
  }, [dispatch, programStatus]);

  useEffect(() => {
    if (subjectStatus === 'idle') {
      dispatch(fetchSubjects());
    }
  }, [dispatch, subjectStatus]);

  useEffect(() => {
    if (teacherStatus === 'idle') {
      dispatch(fetchTeachers());
    }
  }, [dispatch, teacherStatus]);


  const exportDB = (format) => {
    exportIndexedDB(DB_NAME)
      .then((exportData) => {
        if (format === 'json') {
          const jsonData = JSON.stringify(exportData);
          exportToJSON(jsonData, `${DB_NAME}.json`);
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

  const importDB = (format) => {
    loadFile(format)
      .then((data) => {
        if (format === "json") {
          importIndexedDB(DB_NAME, data)
          .then((message) => {
            console.log(message);
          });
        } else if (format === "excel") {
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
  
  const exportToJSON = (data, filename) => {
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportToExcel = (exportData) => {

    const subjectsMap = {};
    const teachersMap = {};
    const programsMap = {};

    exportData.subjects.forEach(subject => {
      subjectsMap[subject.id] = subject.subject;
    })

    exportData.teachers.forEach(teacher => {
      teachersMap[teacher.id] = teacher.teacher;
    })

    exportData.programs.forEach(program => {
      programsMap[program.id] = program.program;
    })

    const wb = XLSX.utils.book_new();
  
    // ---------------------------------------------
    // ------- EXPORTING SUBJECT TO WORKBOOK ------- 
    // ---------------------------------------------

    const subjectData = [
      ['Subject', 'Class Duration'],
    ];

    exportData.subjects.forEach(subject => {
      subjectData.push([subject.subject, subject.classDuration]);
    });

    const subjectSheet = XLSX.utils.aoa_to_sheet(subjectData);
    XLSX.utils.book_append_sheet(wb, subjectSheet, "Subjects");

    // ---------------------------------------------
    // ------- EXPORTING TEACHERS TO WORKBOOK ------ 
    // ---------------------------------------------

    const teacherData = [
      ['Teacher', 'Subjects'],
    ];

    exportData.teachers.forEach(teacher => {
      const detailsRow = [
        teacher.teacher,
        teacher.subjects.map(subjectId => subjectsMap[subjectId]).join(', '),
      ];
      teacherData.push(detailsRow);
    });

    const teacherSheet = XLSX.utils.aoa_to_sheet(teacherData);
    XLSX.utils.book_append_sheet(wb, teacherSheet, "Teachers");

    // ----------------------------------------------
    // ------- EXPORTING PROGRAMS TO WORKBOOK ------- 
    // ----------------------------------------------

    // Define table headres
    const programData = [
      ['Program','7', '', '', '8', '', '', '9', '', '', '10', '', ''],
      ['', 'Subjects', 'Shift', 'Start Time', 'Subjects', 'Shift', 'Start Time', 'Subjects', 'Shift', 'Start Time', 'Subjects', 'Shift', 'Start Time']
    ];

    // Define cell merges
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
      { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } },
      { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } },
      { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } },
      { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } }, 
    ];

    // Define data rows
    exportData.programs.forEach(program => {
      const detailsRow = [
        program.program,
        program[7].subjects.map(subjectId => subjectsMap[subjectId]).join(', '), // Subjects for Grade 7
        program[7].shift === 0 ? 'AM' : 'PM', // Shift for Grade 7
        getTimeSlotString(program[7].startTime), // Start time for Grade 7
        
        program[8].subjects.map(subjectId => subjectsMap[subjectId]).join(', '), // Subjects for Grade 8
        program[8].shift === 1 ? 'PM' : 'AM', // Shift for Grade 8
        getTimeSlotString(program[8].startTime), // Start time for Grade 8

        program[9].subjects.map(subjectId => subjectsMap[subjectId]).join(', '), // Subjects for Grade 9
        program[9].shift === 1 ? 'PM' : 'AM', // Shift for Grade 9
        getTimeSlotString(program[9].startTime), // Start time for Grade 9

        program[10].subjects.map(subjectId => subjectsMap[subjectId]).join(', '), // Subjects for Grade 10
        program[10].shift === 0 ? 'AM' : 'PM', // Shift for Grade 10
        getTimeSlotString(program[10].startTime), // Start time for Grade 10
      ];

      programData.push(detailsRow);
    });

    // Add programs sheet to workbook
    const programSheet = XLSX.utils.aoa_to_sheet(programData);
    programSheet['!merges'] = merges;
    XLSX.utils.book_append_sheet(wb, programSheet, 'Programs');
    
    // -------------------------------------------
    // ------- EXPORT SECTIONS TO WORKBOOK ------- 
    // -------------------------------------------

    // Initialize sectionData with headers
    const sectionData = [
        ['Section Name', 'Adviser', 'Program', 'Year', 'Subjects', 'Shift', 'Start Time']
    ];

    // Loop through sections to build data rows
    exportData.sections.forEach(section => {
      const subjectNames = Object.entries(section.subjects)  // Get both subject IDs and [units, priority]
        .map(([subjectId, [units, priority]]) => {  // Destructure the array to get units and priority
            const subjectName = subjectsMap[subjectId];  // Get the subject name
            return subjectName 
                ? `${subjectName} (${units})(${priority})`  // Format as 'Name (Units)(Priority)'
                : 'Unknown Subject';  // Handle case where subject name is not found
        })
        .join(', ');  // Join the subject strings with a comma
    
      const sectionRow = [
          section.section,  // Section Name
          teachersMap[section.teacher] || 'Unknown Teacher',  // Adviser (Teacher's Name)
          programsMap[section.program] || 'Unknown Program',  // Program Name
          section.year,  // Year Level
          subjectNames,  // Subjects (names with units and priority, joined as a string)
          section.shift === 0 ? 'AM' : 'PM',  // Shift (AM/PM)
          getTimeSlotString(section.startTime)  // Start Time (formatted)
      ];
  
      sectionData.push(sectionRow);
    });  

    // Create worksheet
    const sectionSheet = XLSX.utils.aoa_to_sheet(sectionData);
    XLSX.utils.book_append_sheet(wb, sectionSheet, 'Sections');

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `TIMETABLE DATA.xlsx`);
  };

  const importDBfromExcel = (data) => {

    const addedSubjects = [];
    const addedTeachers = [];
    const addedPrograms = [];
    const addedSections = [];

    const unaddedSubjects = [];
    const unaddedTeachers = [];
    const unaddedPrograms = [];
    const unaddedSections = [];

    const normalizeKeys = (obj) => {
      const normalizedObj = {};
    
      Object.keys(obj).forEach((key) => {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
        normalizedObj[normalizedKey] = obj[key];
      });
    
      return normalizedObj;
    };

    const normalizedData = {};
  
    Object.keys(data).forEach((sheetName) => {
      normalizedData[sheetName] = data[sheetName].map((entry) => normalizeKeys(entry));
    });

    // Check if sheets exist before adding entries
    if (normalizedData['Subjects']) {
      normalizedData['Subjects'].forEach((subject) => {
        if (subject.subject === '' || subject.subject === null || subject.subject === undefined
            || subject.classduration === '' || subject.classduration === null || subject.classduration === undefined
        ) {
            unaddedSubjects.push([0, subject]);
            return;
        }

        const isDuplicateSub = addedSubjects.find((sub) => sub.subject.trim().toLowerCase() === subject.subject.trim().toLowerCase());

        if (isDuplicateSub) {
          // console.log(subject);
          unaddedSubjects.push([1, subject]);
          return;
        } else {
          dispatch(
            addSubject({
                subject: subject.subject,
                classDuration: subject.classduration,
            })
          );
          addedSubjects.push(subject);
        }
      });
    }

    if (normalizedData['Teachers']) {
      normalizedData['Teachers'].forEach((teacher) => {

        if (teacher.teacher === '' || teacher.teacher === null || teacher.teacher === undefined
            || teacher.subjects === '' || teacher.subjects === null || teacher.subjects === undefined
        ) {
          unaddedTeachers.push([0, teacher]);
          return;
        }

        const isDuplicateTeacher = addedTeachers.find((t) => t.trim().toLowerCase() === teacher.teacher.trim().toLowerCase());

        if (isDuplicateTeacher) {
          unaddedTeachers.push([1, teacher]);
          return;
        } else {
          const subjIds = [];

          const subjArray = teacher.subjects.split(',').map(subject => subject.trim());
          subjArray.forEach((subjectName) => {
            let found = false;

            for (let index = 0; index < addedSubjects.length; index++) {
                if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                    subjIds.push(index + 1);
                    found = true;
                    break;
                }
            }

            if (!found) {
              subjIds.push(-1);
            }
          });

          if (subjIds.includes(-1)) {
            unaddedTeachers.push([2, teacher]);
            return;
          } else {
            dispatch(
              addTeacher({
                  teacher: teacher.teacher,
                  subjects: subjIds,
              })
            );

            addedTeachers.push(teacher.teacher);
          }
          
        }
      });
    }

    if (normalizedData['Programs']) {
      normalizedData['Programs'].slice(1).forEach((program) => {
          if (program.program === '' || program.program === null || program.program === undefined
              || program[7] === '' || program[7] === null || program[7] === undefined
              || program[8] === '' || program[8] === null || program[8] === undefined
              || program[9] === '' || program[9] === null || program[9] === undefined
              || program[10] === '' || program[10] === null || program[10] === undefined
              || program[''] === '' || program[''] === null || program[''] === undefined
              || program['_1'] === '' || program['_1'] === null || program['_1'] === undefined
              || program['_2'] === '' || program['_2'] === null || program['_2'] === undefined
              || program['_3'] === '' || program['_3'] === null || program['_3'] === undefined
              || program['_4'] === '' || program['_4'] === null || program['_4'] === undefined
              || program['_5'] === '' || program['_5'] === null || program['_5'] === undefined
              || program['_6'] === '' || program['_6'] === null || program['_6'] === undefined
              || program['_7'] === '' || program['_7'] === null || program['_7'] === undefined
          ) {
            unaddedPrograms.push([0, program]);
            return;
          }

          const isDuplicateProgram = addedPrograms.find((p) => p.program.trim().toLowerCase() === program.program.trim().toLowerCase());

          if (isDuplicateProgram) { 
            unaddedPrograms.push([1, program]);
            return;
          } else {
            const subjIds7 = [];
            const subjIds8 = [];
            const subjIds9 = [];
            const subjIds10 = [];

            const subjArray7 = program[7].split(',').map(subject => subject.trim());
            subjArray7.forEach((subjectName) => {
              let found = false; // Flag to track if the subject was found

              for (let index = 0; index < addedSubjects.length; index++) {
                  if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                      subjIds7.push(index + 1);
                      found = true;
                      break;
                  }
              }
          
              if (!found) {
                  subjIds7.push(-1);
              }
            });

            const subjArray8 = program[8].split(',').map(subject => subject.trim());
            subjArray8.forEach((subjectName) => {
              let found = false;

              for (let index = 0; index < addedSubjects.length; index++) {
                  if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                      subjIds8.push(index + 1);
                      found = true;
                      break;
                  }
              }
          
              if (!found) {
                  subjIds8.push(-1);
              }
            });

            const subjArray9 = program[9].split(',').map(subject => subject.trim());
            subjArray9.forEach((subjectName) => {
              let found = false; // Flag to track if the subject was found

              for (let index = 0; index < addedSubjects.length; index++) {
                  if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                      subjIds9.push(index + 1);
                      found = true;
                      break;
                  }
              }
          
              if (!found) {
                  subjIds9.push(-1);
              }
            });

            const subjArray10 = program[10].split(',').map(subject => subject.trim());
            subjArray10.forEach((subjectName) => {
              let found = false; // Flag to track if the subject was found

              for (let index = 0; index < addedSubjects.length; index++) {
                  if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                      subjIds10.push(index + 1);
                      found = true;
                      break;
                  }
              }
          
              if (!found) {
                  subjIds10.push(-1);
              }
            });

            if (subjIds7.includes(-1) || subjIds8.includes(-1) || subjIds9.includes(-1) || subjIds10.includes(-1)) {
              unaddedPrograms.push([2, program]);
              return;
            } else {
              dispatch(
                addProgram({
                    program: program.program,
                    7: {
                        subjects: subjIds7,
                        shift: program[''] === 'AM' ? 0 : 1,
                        startTime: getTimeSlotIndex(program['_1']),
                    },
                    8: {
                        subjects: subjIds8,
                        shift: program['_2'] === 'AM' ? 0 : 1,
                        startTime: getTimeSlotIndex(program['_3']),
                    },
                    9: {
                        subjects: subjIds9,
                        shift: program['_4'] === 'AM' ? 0 : 1,
                        startTime: getTimeSlotIndex(program['_5']),
                    },
                    10: {
                        subjects: subjIds10,
                        shift: program['_6'] === 'AM' ? 0 : 1,
                        startTime: getTimeSlotIndex(program['_7']),
                    },
                })
              );
              addedPrograms.push(program);
            }
          }
      });
    }

    if (normalizedData['Sections']) {
      const assignedAdviser = [];

      normalizedData['Sections'].forEach((section) => {

          if(section.sectionname === '' || section.sectionname === null || section.sectionname === undefined
              || section.program === '' || section.program === null || section.program === undefined
              || section.adviser === '' || section.adviser === null || section.adviser === undefined
              || section.year === '' || section.year === null || section.year === undefined
              || section.subjects === '' || section.subjects === null || section.subjects === undefined 
              || section.shift == '' || section.shift === null || section.shift === undefined
              || section.starttime == '' || section.starttime === null || section.starttime === undefined
          ) {
            unaddedSections.push([0, section]);
            return;
          }

          const isDuplicateSection = addedSections.find((s) => s['sectionname'].trim().toLowerCase() === section.sectionname.trim().toLowerCase());
          if (isDuplicateSection) {
            unaddedSections.push([1, section]);
            return;
          } else {
            const formattedSubjectUnits = {};
            const isUnknownSubject = [];

            const subjArray = section.subjects.split(',').map(subject => subject.trim());

            subjArray.forEach((subjName) => {
                const match = subjName.match(/(.+?) \((\d+)\)\s?\((\-?\d+)\)/);
                let found = false;

                if (match) {
                    const subjectName = match[1].trim();
                    const units = parseInt(match[2], 10);
                    const priority = parseInt(match[3], 10);

                    for (let index = 0; index < addedSubjects.length; index++) {
                        if (addedSubjects[index]['subject'].toLowerCase() === subjectName.toLowerCase()) {
                            formattedSubjectUnits[index + 1] = [units, priority];
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                      isUnknownSubject.push(-1);
                    }
                }
            });

            const progID = addedPrograms.findIndex(program => program['program'].trim().toLowerCase() === section.program.trim().toLowerCase()) + 1;
            const advID = addedTeachers.findIndex(teacher => teacher.trim().toLowerCase() === section.adviser.trim().toLowerCase()) + 1;

            if (isUnknownSubject.length > 0) {
              unaddedSections.push([2, section]);
              return;
            } else if (progID === 0 || advID === 0) {
              unaddedSections.push([3, section]);
              return;
            } else if (assignedAdviser.includes(advID)) {
              unaddedSections.push([4, section]);
              return;
            } else {
              dispatch(
                addSection({
                    section: section.sectionname,
                    teacher: advID,
                    program: progID,
                    year: section.year,
                    subjects: formattedSubjectUnits,
                    shift: section.shift === 'AM' ? 0 : 1,
                    startTime: getTimeSlotIndex(section.starttime),
                })
              );

              addedSections.push(section);
              assignedAdviser.push(advID);
            }
          }
      });
    }

    console.log('Violation 0 is for empty fields\nViolation 1 is for duplicate entries (any database)\nViolation 2 is for unknown subject\nViolation 3 is for unknown program or adviser\nViolation 4 is for multiple advisorship');

    console.log('unaddedSubjects', unaddedSubjects);
    console.log('unaddedTeachers', unaddedTeachers);
    console.log('unaddedPrograms', unaddedPrograms);
    console.log('unaddedSections', unaddedSections);

  }

  return (
    <div className="flex gap-2">     
      <button
        className="btn btn-secondary"
        onClick={() => {
          document.getElementById("export-format-modal").showModal();
        }}
      >
        Export <CiExport size={20} />
      </button>
      
      <button
        className="btn btn-secondary"
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
              onClick={async () => {
                await onClear();  // Wait for the onClear function to complete
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
