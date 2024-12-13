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
import { addDepartment, fetchDepartments } from "../../features/departmentSlice";

import { addRank, fetchRanks } from "@features/rankSlice";

import { getTimeSlotString, getTimeSlotIndex } from "./timeSlotMapper";
import { setSubjectStatusIdle } from "@features/subjectSlice";
import { setSectionStatusIdle } from "@features/sectionSlice";
import { setTeacherStatusIdle } from "@features/teacherSlice";
import { setProgramStatusIdle } from "@features/programSlice";
import { setDepartmentStatusIdle } from "../../features/departmentSlice";
import { useDispatch, useSelector } from "react-redux";

import { toast } from "sonner";
import { BiUpload } from "react-icons/bi";

const ExportImportDBButtons = ({ onClear, numOfSchoolDays }) => {
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

  const { ranks, status: rankStatus } = useSelector(
    (state) => state.rank
  );

  const { departments, status: departmentStatus} = useSelector(
    (state) => state.department
  )

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

  useEffect(() => {
    if (rankStatus === 'idle') {
      dispatch(fetchRanks());
    }
  }, [dispatch, rankStatus]);

  useEffect(() => {
    if (departmentStatus === 'idle') {
      dispatch(fetchDepartments());
    }
  }, [dispatch, departmentStatus]);


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
        dispatch(setDepartmentStatusIdle());
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
    const ranksMap = {}

    exportData.subjects.forEach(subject => {
      subjectsMap[subject.id] = subject.subject;
    })

    exportData.teachers.forEach(teacher => {
      teachersMap[teacher.id] = teacher.teacher;
    })

    exportData.programs.forEach(program => {
      programsMap[program.id] = program.program;
    })

    exportData.ranks.forEach(rank => {
      ranksMap[rank.id] = rank.rank;
    })

    const wb = XLSX.utils.book_new();
    
    // ---------------------------------------------
    // ------- EXPORTING SUBJECT TO WORKBOOK ------- 
    // ---------------------------------------------
    
    const subjectData = [
      ['Subject', 'Class Duration', 'Weekly Requirement' ],//header
    ];

    exportData.subjects.forEach(subject => {
      subjectData.push([subject.subject, subject.classDuration, subject.weeklyMinutes]);
    });

    const subjectSheet = XLSX.utils.aoa_to_sheet(subjectData);
    XLSX.utils.book_append_sheet(wb, subjectSheet, "Subjects");

    // ---------------------------------------------
    // ------- EXPORTING TEACHERS TO WORKBOOK ------ 
    // ---------------------------------------------

    const teacherData = [
      ['Teacher', 'Rank', 'Subjects', 'Assigned Year Level(s)'],
    ];

    exportData.teachers.forEach(teacher => {
      const detailsRow = [
        teacher.teacher,
        ranksMap[teacher.rank] || '',
        teacher.subjects.map(subjectId => subjectsMap[subjectId]).join(', '),
        teacher.yearLevels.map(level => {
          switch (level) {
            case 0: return 7;
            case 1: return 8;
            case 2: return 9;
            case 3: return 10;
            default: return '';
          }
        }).join(', '),
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
        .map((_,subjectId) => {  // Destructure the array to get units and priority
            console.log(subjectId)
            const subjectName = subjectsMap[subjectId];  // Get the subject name
            return subjectName 
                ? `${subjectName}`  // Format as 'Name (Units)(Priority)'
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

    // ----------------------------------------
    // ------- EXPORT RANKS TO WORKBOOK ------- 
    // ----------------------------------------

    const rankData = [
      ['Rank'],
    ];

    exportData.ranks.forEach(rank => {
      const rankRow = [rank.rank];
      rankData.push(rankRow);
    });

    const rankSheet = XLSX.utils.aoa_to_sheet(rankData);
    XLSX.utils.book_append_sheet(wb, rankSheet, 'Ranks');

    // ---------------------------------------------
    // ----- EXPORTING DEPARTMENT TO WORKBOOK ------
    // ---------------------------------------------
    
    const departmentData = [
      ['Department Name', 'Department Head' ],
    ];

    exportData.departments.forEach(department => {
      departmentData.push([department.name, department.head])
    });

    const departmentSheet = XLSX.utils.aoa_to_sheet(departmentData);
    XLSX.utils.book_append_sheet(wb, departmentSheet, "Departments");

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `TIMETABLE DATA.xlsx`);
  };

  const importDBfromExcel = (data) => {

    const addedSubjects = [];
    const addedTeachers = [];
    const addedRanks = [];
    const addedPrograms = [];
    const addedSections = [];
    const addedDepartments = [];

    const unaddedSubjects = [];
    const unaddedTeachers = [];
    const unaddedRanks = [];
    const unaddedPrograms = [];
    const unaddedSections = [];
    const unaddedDepartments = [];

    const normalizeKeys = (obj) => {
      const normalizedObj = {};
    
      Object.keys(obj).forEach((key) => {
        const normalizedKey = 
          key.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[()]/g, ''); ;
        normalizedObj[normalizedKey] = obj[key];
      });
    
      return normalizedObj;
    };

    const normalizedData = {};
  
    Object.keys(data).forEach((sheetName) => {
      normalizedData[sheetName] = data[sheetName].map((entry) => normalizeKeys(entry));
    });

    // Check if sheets exist before adding entries
    if (normalizedData['Subjects']) { //subject minutes, weekly, duration
      normalizedData['Subjects'].forEach((subject) => {
        if (subject.subject === '' || subject.subject === null || subject.subject === undefined
            || subject.classduration === '' || subject.classduration === null || subject.classduration === undefined
            || subject.weeklyminutes === '' || subject.weeklyminutes === null || subject.weeklyminutes === undefined
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
                weeklyMinutes: subject.weeklyminutes,
            })
          );
          addedSubjects.push(subject);
        }
      });
    }
    console.log('addedSubjects1:' , addedSubjects);

    if (normalizedData['Ranks']) {
      normalizedData['Ranks'].forEach((rank) => {
        if (rank.rank === '' || rank.rank === null || rank.rank === undefined
        ) {
          unaddedRanks.push([0, rank]);
          return;
        }

        console.log('rank.weeklyloadinhours: ', rank.weeklyloadinhours);

        const isDuplicateRank = addedRanks.find((r) => r.rank.trim().toLowerCase() === rank.rank.trim().toLowerCase());

        if (isDuplicateRank) {          
          unaddedRanks.push([1, rank]);
          return;
        } else {
          dispatch(
            addRank({
                rank: rank.rank,
            })
          );
          addedRanks.push(rank);
        }
      });
    }

    if (normalizedData['Teachers']) {
      normalizedData['Teachers'].forEach((teacher) => {

        if (teacher.teacher === '' || teacher.teacher === null || teacher.teacher === undefined
            || teacher.rank === '' || teacher.rank === null || teacher.rank === undefined
            || teacher.subjects === '' || teacher.subjects === null || teacher.subjects === undefined
            || teacher.assignedyearlevels === '' || teacher.assignedyearlevels === null || teacher.assignedyearlevels === undefined
        ) {
          unaddedTeachers.push([0, teacher]);
          return;
        }

        let yearLevelString = teacher.assignedyearlevels.toString();

        const isDuplicateTeacher = addedTeachers.find((t) => t.teacher.trim().toLowerCase() === teacher.teacher.trim().toLowerCase());

        if (isDuplicateTeacher) {
          unaddedTeachers.push([1, teacher]);
          return;
        } else {
          // Get rank ID
          const rankIndex = addedRanks.findIndex((r) => r.rank.trim().toLowerCase() === teacher.rank.trim().toLowerCase());
          if (rankIndex === -1) {  // No match found
            unaddedTeachers.push([2, teacher]);
            return;
          }
          
          // Get subject IDs
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

          // Get year level IDs
          const yearLevelIds = [];
          const yearLevelArray = yearLevelString.split(',').map(yearLevel => yearLevel.trim());
          yearLevelArray.forEach((yearLevel) => {
            if (yearLevel === '7') {
              yearLevelIds.push(0);
            } else if (yearLevel === '8') {
              yearLevelIds.push(1);
            } else if (yearLevel === '9') {
              yearLevelIds.push(2);
            } else if (yearLevel === '10') {
              yearLevelIds.push(3);
            }
          });

          if (subjIds.includes(-1)) {
            unaddedTeachers.push([2, teacher]);
            return;
          } else {
            dispatch(
              addTeacher({
                  teacher: teacher.teacher,
                  rank: rankIndex + 1,
                  subjects: subjIds,
                  yearLevels: yearLevelIds,
              })
            );

            addedTeachers.push(teacher);
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
            const fixedDays7 = {};//add new objects for fixed days
            const fixedPositions7 = {};//add new objects for fixed days

            const subjIds8 = [];
            const fixedDays8 = {};
            const fixedPositions8 = {};

            const subjIds9 = [];
            const fixedDays9 = {};
            const fixedPositions9 = {};

            const subjIds10 = [];
            const fixedDays10 = {};
            const fixedPositions10 = {};

            const subjArray7 = program[7].split(',').map(subject => subject.trim());
            subjArray7.forEach((subjectName) => {
              let found = false; // Flag to track if the subject was found

              for (let index = 0; index < addedSubjects.length; index++) {
                  if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                      subjIds7.push(index + 1);
                      const numOfClasses = Math.min(Math.ceil(Number(addedSubjects[index]['weeklyminutes'])/Number(addedSubjects[index]['classduration'])), numOfSchoolDays)
                      fixedDays7[index + 1] = new Array(numOfClasses).fill(0);
                      fixedPositions7[index + 1] = new Array(numOfClasses).fill(0);
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
                      const numOfClasses = Math.min(Math.ceil(Number(addedSubjects[index]['weeklyminutes'])/Number(addedSubjects[index]['classduration'])), numOfSchoolDays)
                      fixedDays8[index + 1] = new Array(numOfClasses).fill(0);
                      fixedPositions8[index + 1] = new Array(numOfClasses).fill(0);
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
                      const numOfClasses = Math.min(Math.ceil(Number(addedSubjects[index]['weeklyminutes'])/Number(addedSubjects[index]['classduration'])), numOfSchoolDays)
                      fixedDays9[index + 1] = new Array(numOfClasses).fill(0);
                      fixedPositions9[index + 1] = new Array(numOfClasses).fill(0);
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
                      const numOfClasses = Math.min(Math.ceil(Number(addedSubjects[index]['weeklyminutes'])/Number(addedSubjects[index]['classduration'])), numOfSchoolDays)
                      fixedDays10[index + 1] = new Array(numOfClasses).fill(0);
                      fixedPositions10[index + 1] = new Array(numOfClasses).fill(0);
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
                        fixedDays: fixedDays7,
                        fixedPosition: fixedPositions7,
                    },
                    8: {
                        subjects: subjIds8,
                        shift: program['_2'] === 'AM' ? 0 : 1,
                        startTime: getTimeSlotIndex(program['_3']),
                        fixedDays: fixedDays8,
                        fixedPosition: fixedPositions8,
                    },
                    9: {
                        subjects: subjIds9,
                        shift: program['_4'] === 'AM' ? 0 : 1,
                        startTime: getTimeSlotIndex(program['_5']),
                        fixedDays: fixedDays9,
                        fixedPosition: fixedPositions9,
                    },
                    10: {
                        subjects: subjIds10,
                        shift: program['_6'] === 'AM' ? 0 : 1,
                        startTime: getTimeSlotIndex(program['_7']),
                        fixedDays: fixedDays10,
                        fixedPosition: fixedPositions10,
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
            const sectionSubjects = [];
            const sectionFixedDays = {};
            const sectionFixedPositions = {};
            const isUnknownSubject = [];

            const subjArray = section.subjects.split(',').map(subject => subject.trim());
            for (let sub of subjArray){
              for (let index = 0; index < addedSubjects.length; index++) {
                if (addedSubjects[index]['subject'].trim().toLowerCase() === sub.trim().toLowerCase()) {
                    sectionSubjects.push(index + 1);
                    const numOfClasses = Math.min(Math.ceil(Number(addedSubjects[index]['weeklyminutes'])/Number(addedSubjects[index]['classduration'])), numOfSchoolDays)
                    sectionFixedDays[index + 1] = new Array(numOfClasses).fill(0);
                    sectionFixedPositions[index + 1] = new Array(numOfClasses).fill(0);
                    //found = true;
                    break;
                }
            }
            }

            const progID = addedPrograms.findIndex(program => program['program'].trim().toLowerCase() === section.program.trim().toLowerCase()) + 1;
            const advID = addedTeachers.findIndex(t => t.teacher.trim().toLowerCase() === section.adviser.trim().toLowerCase()) + 1;

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
                    subjects: sectionSubjects,
                    fixedDays: sectionFixedDays,
                    fixedPositions: sectionFixedPositions,
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
    
    if (normalizedData['Departments']) {
      normalizedData['Departments'].forEach((department) => {
        if (department.departmentname === '' || department.departmentname === null || department.departmentname === undefined
          || department.departmenthead === '' || department.departmenthead === null || department.departmenthead  === undefined
        ){
          unaddedDepartments.push([0, department]);
          return;
        }
        //console.log('department', addedDepartments)
        //Checking for duplicate dept head names
        const isDuplicateHead = addedDepartments.find((d) => d.departmenthead.trim().toLowerCase() === department.departmenthead.trim().toLowerCase());
        //console.log('Department Head',isDuplicateHead)
        if (isDuplicateHead){
          unaddedDepartments.push([1, department]);
          return;
        } else {
          //Get Department Name
          const isDuplicateName = addedDepartments.find((d) => d.departmentname.trim().toLowerCase() === department.departmentname.trim().toLowerCase());
            if (isDuplicateName){//no match found
              unaddedDepartments.push([2, department]);
              return;
            }
            else {
              dispatch(
                addDepartment({
                    name: department.departmentname,
                    head: department.departmenthead,
                })
              );
            addedDepartments.push(department);
          }
        }
      })
    }

    console.log('Violation 0 is for empty fields\nViolation 1 is for duplicate entries (any database)\nViolation 2 is for unknown subject\nViolation 3 is for unknown program or adviser\nViolation 4 is for multiple advisorship');

    console.log('unaddedSubjects', unaddedSubjects);
    console.log('unaddedTeachers', unaddedTeachers);
    console.log('unaddedPrograms', unaddedPrograms);
    console.log('unaddedSections', unaddedSections);
    console.log('unaddedRanks', unaddedRanks);

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
