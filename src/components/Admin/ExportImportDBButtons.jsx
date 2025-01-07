import React, { useState, useEffect } from 'react';
import { CiExport, CiImport } from 'react-icons/ci';
import { createPortal } from 'react-dom';
import { exportIndexedDB, loadFile, importIndexedDB, DB_NAME } from '@src/indexedDB';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { addSubject, fetchSubjects } from '@features/subjectSlice';
import { addSection, fetchSections } from '@features/sectionSlice';
import { addTeacher, fetchTeachers } from '@features/teacherSlice';
import { addProgram, fetchPrograms } from '@features/programSlice';
import { addDepartment, fetchDepartments } from '../../features/departmentSlice';
import { addBuilding, fetchBuildings } from '@features/buildingSlice';

import { addRank, fetchRanks } from '@features/rankSlice';

import { getTimeSlotString, getTimeSlotIndex } from '@utils/timeSlotMapper';
import { setSubjectStatusIdle } from '@features/subjectSlice';
import { setSectionStatusIdle } from '@features/sectionSlice';
import { setTeacherStatusIdle } from '@features/teacherSlice';
import { setProgramStatusIdle } from '@features/programSlice';
import { setBuildingStatusIdle } from '@features/buildingSlice';
import { setDepartmentStatusIdle } from '@features/departmentSlice';
import { useDispatch, useSelector } from 'react-redux';

import { toast } from 'sonner';
import { BiUpload } from 'react-icons/bi';

const ImportingFullScreenLoader = () => {
    return createPortal(
        <div className='z-[999]  bg-gray-950 bg-opacity-50 fixed top-0 left-0 w-screen h-screen flex flex-col justify-center items-center gap-4'>
            <span className='loading loading-bars loading-lg'></span>
            <span className=''>importing data</span>
        </div>,
        document.body
    );
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const ExportImportDBButtons = ({ onClear, numOfSchoolDays, breakTimeDuration }) => {
    const dispatch = useDispatch();

    const [isImporting, setIsImporting] = useState(false);

    // =======================================================================

    const { programs, status: programStatus } = useSelector((state) => state.program);

    const { subjects, status: subjectStatus } = useSelector((state) => state.subject);

    const { teachers, status: teacherStatus } = useSelector((state) => state.teacher);

    const { ranks, status: rankStatus } = useSelector((state) => state.rank);

    const { departments, status: departmentStatus } = useSelector((state) => state.department);

    const { buildings, status: buildingStatus } = useSelector((state) => state.building);

    const { sections, status: sectionStatus } = useSelector((state) => state.section);

    // =======================================================================

    useEffect(() => {
        if (sectionStatus === 'idle') {
            dispatch(fetchSections());
        }
    }, [dispatch, sectionStatus]);

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

    useEffect(() => {
        if (buildingStatus === 'idle') {
            dispatch(fetchBuildings());
        }
    }, [buildingStatus, dispatch]);

    // =======================================================================

    const exportDB = (format) => {
        exportIndexedDB(DB_NAME)
            .then((exportData) => {
                if (format === 'json') {
                    const jsonData = JSON.stringify(exportData);
                    exportToJSON(jsonData, `${DB_NAME}.json`);
                } else if (format === 'excel') {
                    exportToExcel(exportData);
                }
            })
            .then(() => {
                toast.success('DB exported successfully');
            })
            .catch((error) => {
                toast.error('Error exporting DB');
                console.log(error);
                // console.error("Export error:", error);
            });
    };

    const importDB = async (format) => {
        try {
            const data = await loadFile(format); // Wait for file to load
            // console.log('🚀 ~ importDB ~ data:', typeof data);
            // console.log('🚀 ~ importDB ~ data:', typeof data);

            // const data = {};

            console.log('p o tang ina mo');

            setIsImporting(true);

            document.getElementById('import-format-modal').close();

            try {
                await onClear();
                toast.success('Data cleared successfully');
            } catch (error) {
                toast.error('Error clearing data');
                console.error('Error clearing data:', error);
            }

            console.log('FGFFFF');
            // await sleep(1000);

            console.log('🚀 ~ importDB ~ data:', data);

            if (!data) {
                console.error('No file selected FEFJLE:FJLK:EJFLK:EJFKLEJ');
                throw new Error('No file selected');
            }

            // if (format === 'json') {
            //     const message = await importIndexedDB(DB_NAME, data); // Wait for IndexedDB import
            //     console.log(message);
            // } else
            if (format === 'excel') {
                await importDBfromExcel(data); // Wait for Excel import
            } else {
                throw new Error('Unsupported file format. Please upload a JSON or Excel file.');
            }

            // Reset statuses

            dispatch(setSubjectStatusIdle());
            dispatch(setTeacherStatusIdle());
            dispatch(setProgramStatusIdle());
            dispatch(setSectionStatusIdle());
            dispatch(setDepartmentStatusIdle());
            dispatch(setBuildingStatusIdle());

            // Show success message
            toast.success('DB imported successfully');
        } catch (error) {
            // Handle errors
            toast.error('Error importing DB');
            console.error(error);
        } finally {
            // Close the modal
            console.log('DONE M O T H E R F U C K E R ');
            console.log('DONE M O T H E R F U C K E R ');
            setIsImporting(false);
            document.getElementById('import-confirmation-modal').close();
        }
    };

    const exportToJSON = (data, filename) => {
        const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const exportToExcel = async (exportData) => {
        const workbook = new ExcelJS.Workbook();
        const subjWorksheet = workbook.addWorksheet('Subjects');
        const teacherWorksheet = workbook.addWorksheet('Teachers');
        const rankWorksheet = workbook.addWorksheet('Ranks');
        const deptWorksheet = workbook.addWorksheet('Departments');
        const programWorksheet = workbook.addWorksheet('Programs');
        const sectionWorksheet = workbook.addWorksheet('Sections');

        const bldgWorksheet = workbook.addWorksheet('Buildings');

        // *******************************
        // ------- EXPORT SUBJECTS -------
        // *******************************
        subjWorksheet.addRow(['Subject', 'Class Duration', 'Weekly Minutes']);

        const subjHeaderRow = subjWorksheet.getRow(1);
        subjHeaderRow.font = { bold: true };
        subjHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

        exportData.subjects.forEach((subject) => {
            subjWorksheet.addRow([subject.subject, subject.classDuration, subject.weeklyMinutes]);
        });

        subjWorksheet.columns = [
            { key: 'subject', width: 20 },
            { key: 'subjectClassDuration', width: 15 },
            { key: 'subjectWeeklyMinutes', width: 20 },
        ];

        // *******************************
        // ------- EXPORT TEACHERS -------
        // *******************************
        teacherWorksheet.addRow(['Teacher', 'Rank', 'Department', 'Subjects', 'Assigned Year Level(s)']);

        const teacherHeaderRow = teacherWorksheet.getRow(1);
        teacherHeaderRow.font = { bold: true };
        teacherHeaderRow.alignment = {
            horizontal: 'center',
            vertical: 'middle',
        };

        exportData.teachers.forEach((teacher) => {
            // Convert teacher.subjects (IDs) to subject names
            const subjectNames = teacher.subjects.map((subjectId) => subjects[subjectId].subject).join(', ');

            // Convert teacher.yearLevels to a comma-separated string
            const yearLevels = teacher.yearLevels
                .map((yearLevelIndex) => {
                    const yearMapping = [7, 8, 9, 10];
                    return yearMapping[yearLevelIndex];
                })
                .join(', ');
            teacherWorksheet.addRow([
                teacher.teacher,
                ranks[teacher.rank].rank,
                departments[teacher.department].name,
                subjectNames,
                yearLevels,
            ]);
        });

        teacherWorksheet.columns = [
            { key: 'teacher', width: 20 },
            { key: 'teacherRank', width: 25 },
            { key: 'teacherDepartment', width: 25 },
            { key: 'teacherSubjects', width: 40 },
            { key: 'teacherYearLevels', width: 25 },
        ];

        // *******************************
        // ------- EXPORT RANKS ----------
        // *******************************
        rankWorksheet.addRow(['Rank']);

        const rankHeaderRow = rankWorksheet.getRow(1);
        rankHeaderRow.font = { bold: true };
        rankHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

        exportData.ranks.forEach((rank) => {
            rankWorksheet.addRow([rank.rank]);
        });

        rankWorksheet.columns = [{ key: 'rank', width: 25 }];

        // *******************************
        // ------- EXPORT DEPARTMENTS ----
        // *******************************
        deptWorksheet.addRow(['Department', 'Department Head']);

        const deptHeaderRow = deptWorksheet.getRow(1);
        deptHeaderRow.font = { bold: true };
        deptHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

        exportData.departments.forEach((dept) => {
            deptWorksheet.addRow([dept.name, teachers[dept.head]?.teacher || '']);
        });

        deptWorksheet.columns = [
            { key: 'department', width: 30 },
            { key: 'departmentHead', width: 25 },
        ];

        // *******************************
        // ------- EXPORT PROGRAMS -------
        // *******************************
        programWorksheet.addRow(['Program', '7', '', '', '8', '', '', '9', '', '', '10', '', '']);
        programWorksheet.addRow([
            '',
            'Subjects',
            'Shift',
            'Start Time',
            'Subjects',
            'Shift',
            'Start Time',
            'Subjects',
            'Shift',
            'Start Time',
            'Subjects',
            'Shift',
            'Start Time',
        ]);

        programWorksheet.mergeCells('A1:A2');
        programWorksheet.mergeCells('B1:D1');
        programWorksheet.mergeCells('E1:G1');
        programWorksheet.mergeCells('H1:J1');
        programWorksheet.mergeCells('K1:M1');

        const firstRow = programWorksheet.getRow(1);
        firstRow.font = { bold: true };
        firstRow.alignment = { horizontal: 'center', vertical: 'middle' };

        // Set the width for the columns
        programWorksheet.getColumn(1).width = 25; // For 'Program' in column A
        programWorksheet.getColumn(2).width = 35; // For 'Subjects' in column B
        programWorksheet.getColumn(3).width = 15; // For 'Shift' in column C
        programWorksheet.getColumn(4).width = 15; // For 'Start Time' in column D
        programWorksheet.getColumn(5).width = 35; // For 'Subjects' in column E
        programWorksheet.getColumn(6).width = 15; // For 'Shift' in column F
        programWorksheet.getColumn(7).width = 15; // For 'Start Time' in column G
        programWorksheet.getColumn(8).width = 35; // For 'Subjects' in column H
        programWorksheet.getColumn(9).width = 15; // For 'Shift' in column I
        programWorksheet.getColumn(10).width = 15; // For 'Start Time' in column J
        programWorksheet.getColumn(11).width = 35; // For 'Subjects' in column K
        programWorksheet.getColumn(12).width = 15; // For 'Shift' in column L
        programWorksheet.getColumn(13).width = 15; // For 'Start Time' in column M

        // Style the second row to make it italics
        const secondRow = programWorksheet.getRow(2);
        secondRow.font = { italic: true };

        // Ensure the widths and styles are applied after row creation
        programWorksheet.getColumn(2).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(3).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(4).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(5).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(6).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(7).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(8).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(9).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(10).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(11).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(12).alignment = { horizontal: 'center' };
        programWorksheet.getColumn(13).alignment = { horizontal: 'center' };

        exportData.programs.forEach((program) => {
            const year7Subjects = program[7].subjects.map((subjectId) => subjects[subjectId].subject).join(', ');
            const year8Subjects = program[8].subjects.map((subjectId) => subjects[subjectId].subject).join(', ');
            const year9Subjects = program[9].subjects.map((subjectId) => subjects[subjectId].subject).join(', ');
            const year10Subjects = program[10].subjects.map((subjectId) => subjects[subjectId].subject).join(', ');

            programWorksheet.addRow([
                program.program,
                year7Subjects,
                program[7].shift === 0 ? 'AM' : 'PM',
                getTimeSlotString(program[7].startTime),
                year8Subjects,
                program[8].shift === 0 ? 'AM' : 'PM',
                getTimeSlotString(program[8].startTime),
                year9Subjects,
                program[9].shift === 0 ? 'AM' : 'PM',
                getTimeSlotString(program[9].startTime),
                year10Subjects,
                program[10].shift === 0 ? 'AM' : 'PM',
                getTimeSlotString(program[10].startTime),
            ]);
        });

        // *******************************
        // ------- EXPORT SECTIONS -------
        // *******************************
        sectionWorksheet.addRow(['Section Name', 'Adviser', 'Program', 'Year', 'Room Details']);

        const sectionHeaderRow = sectionWorksheet.getRow(1);
        sectionHeaderRow.font = { bold: true };
        sectionHeaderRow.alignment = {
            horizontal: 'center',
            vertical: 'middle',
        };

        exportData.sections.forEach((section) => {
            const sectionAdviser = teachers[section.teacher];
            const sectionProgram = programs[section.program];

            const building = buildings[section.roomDetails.buildingId];
            const floor = building.rooms[section.roomDetails.floorIdx];
            const room = floor[section.roomDetails.roomIdx];

            sectionWorksheet.addRow([
                section.section,
                sectionAdviser.teacher,
                sectionProgram.program,
                section.year,
                `[${building.name}, FLOOR ${section.roomDetails.floorIdx + 1}] ${room.roomName}`,
            ]);
        });

        sectionWorksheet.columns = [
            { key: 'section', width: 25 },
            { key: 'sectionAdviser', width: 25 },
            { key: 'sectionProgram', width: 25 },
            { key: 'sectionYear', width: 10 },
            { key: 'sectionRoomDetails', width: 30 },
        ];

        // *******************************
        // ------- EXPORT BUILDINGS ------
        // *******************************
        bldgWorksheet.addRow(['Building Name', 'Floor', 'Room']);

        const bldgHeaderRow = bldgWorksheet.getRow(1);
        bldgHeaderRow.font = { bold: true };
        bldgHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

        // Track the current row
        let currentRow = 2;

        exportData.buildings.forEach((building) => {
            const buildingName = building.name;
            const startBuildingRow = currentRow; // Track where building starts

            building.rooms.forEach((floorRooms, floorIndex) => {
                const floorNumber = `Floor ${floorIndex + 1}`;
                const startFloorRow = currentRow; // Track where floor starts

                floorRooms.forEach((room) => {
                    const roomName = room.roomName;
                    bldgWorksheet.addRow([buildingName, floorNumber, roomName]);
                    currentRow++;
                });

                bldgWorksheet.mergeCells(`B${startFloorRow}:B${currentRow - 1}`);

                const floorCell = bldgWorksheet.getCell(`B${startFloorRow}`);
                floorCell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle',
                };
            });

            bldgWorksheet.mergeCells(`A${startBuildingRow}:A${currentRow - 1}`);

            const buildingCell = bldgWorksheet.getCell(`A${startBuildingRow}`);
            buildingCell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
            };
        });

        bldgWorksheet.columns = [
            { key: 'building', width: 20 },
            { key: 'floor', width: 15 },
            { key: 'room', width: 25 },
        ];

        // Generate and save the Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, 'Timetable_Data.xlsx');
    };

    const importDBfromExcel = async (data) => {
        function formatTimeWithLeadingZero(time) {
            if (!/^\d{1,2}:\d{2} [AP]M$/.test(time)) {
                return 'INVALID';
            }

            const [hour, rest] = time.split(':');
            const formattedHour = hour.length === 1 ? `0${hour}` : hour;
            return `${formattedHour}:${rest}`;
        }

        function convertExcelTimeToTimeString(excelTime) {
            const hours = excelTime * 24;

            const date = new Date(0);
            date.setHours(hours);

            const hours24 = date.getHours();
            const minutes = date.getMinutes();

            const formattedHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
            const formattedMinute = minutes < 10 ? `0${minutes}` : minutes;

            const period = hours24 >= 12 ? 'PM' : 'AM';

            return `${formattedHour < 10 ? `0${formattedHour}` : formattedHour}:${formattedMinute} ${period}`;
        }

        const addedSubjects = [];
        const addedTeachers = [];
        const addedRanks = [];
        const addedPrograms = [];

        const addedSections = [];
        const addedSections_2 = [];

        const addedDepartments = [];
        const addedBuildings = [];

        const unaddedSubjects = [];
        const unaddedTeachers = [];
        const unaddedRanks = [];
        const unaddedPrograms = [];
        const unaddedSections = [];
        const unaddedDepartments = [];

        const normalizeKeys = (obj) => {
            const normalizedObj = {};

            Object.keys(obj).forEach((key) => {
                const normalizedKey = key.toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '');
                normalizedObj[normalizedKey] = obj[key];
            });

            return normalizedObj;
        };

        const normalizedData = {};

        Object.keys(data).forEach((sheetName) => {
            normalizedData[sheetName] = data[sheetName].map((entry) => normalizeKeys(entry));
        });

        /*
			VIOLATIONS
			-1 - Mismatch in attribute type
			0 - Empty attribute(s)
			1 - Duplicate attribute 
			2 - Reference to non-existent attribute from another sheet
		*/

        // ======================== FILTER ALL ENTRIES ======================== //

        // FILTER SUBJECTS
        if (normalizedData['Subjects']) {
            normalizedData['Subjects'].forEach((subject) => {
                subject.subject = String(subject.subject || '').trim();

                if (
                    subject.subject === '' ||
                    subject.subject === null ||
                    subject.subject === undefined ||
                    subject.classduration === '' ||
                    subject.classduration === null ||
                    subject.classduration === undefined ||
                    subject.weeklyminutes === '' ||
                    subject.weeklyminutes === null ||
                    subject.weeklyminutes === undefined
                ) {
                    unaddedSubjects.push([0, subject]);
                    return;
                }

                const classDurationAsNumber = Number(subject.classduration);
                const weeklyMinutesAsNumber = Number(subject.weeklyminutes);

                if (!Number.isInteger(classDurationAsNumber) || !Number.isInteger(weeklyMinutesAsNumber)) {
                    unaddedSubjects.push([-1, subject]);
                    return;
                }

                const isDuplicateSub = addedSubjects.find(
                    (sub) => sub.subject.trim().toLowerCase() === subject.subject.trim().toLowerCase()
                );

                if (isDuplicateSub) {
                    unaddedSubjects.push([1, subject]);
                    return;
                } else {
                    addedSubjects.push(subject);
                }
            });
        }

        // FILTER RANKS
        if (normalizedData['Ranks']) {
            normalizedData['Ranks'].forEach((rank) => {
                rank.rank = String(rank.rank || '').trim();

                if (rank.rank === '' || rank.rank === null || rank.rank === undefined) {
                    unaddedRanks.push([0, rank]);
                    return;
                }

                const isDuplicateRank = addedRanks.find((r) => r.rank.trim().toLowerCase() === rank.rank.trim().toLowerCase());

                if (isDuplicateRank) {
                    unaddedRanks.push([1, rank]);
                    return;
                } else {
                    // dispatch(
                    // 	addRank({
                    // 		rank: rank.rank,
                    // 		additionalRankScheds: [],
                    // 	})
                    // );
                    addedRanks.push(rank);
                }
            });
        }

        // FILTER BUILDINGS
        if (normalizedData['Buildings']) {
            const grouped = normalizedData['Buildings'].reduce(
                (acc, item) => {
                    const buildingName = String(item.buildingname || acc.currentBuilding).trim();
                    const floor = item.floor || acc.currentFloor;
                    const roomName = String(item.room).trim();

                    if (
                        floor === '' ||
                        floor === null ||
                        floor === undefined ||
                        roomName === '' ||
                        roomName === null ||
                        roomName === undefined
                    ) {
                        return acc;
                    }

                    // Initialize processedBuildings set if not already initialized
                    if (!acc.processedBuildings) {
                        acc.processedBuildings = new Set();
                    }

                    // Mark building as processed
                    acc.processedBuildings.add(buildingName);

                    if (!acc[buildingName]) {
                        acc[buildingName] = {};
                    }

                    const floorIndex = parseInt(floor?.replace('Floor ', ''), 10) - 1;

                    if (!acc[buildingName][floorIndex]) {
                        acc[buildingName][floorIndex] = [];
                    }

                    acc[buildingName][floorIndex].push({
                        roomName,
                        // isAvailable: true,
                    });

                    // Update the current building and floor
                    acc.currentBuilding = buildingName;
                    acc.currentFloor = floor;

                    return acc;
                },
                {
                    currentBuilding: '',
                    currentFloor: '',
                    processedBuildings: new Set(),
                }
            );

            delete grouped.processedBuildings;
            delete grouped.currentBuilding;
            delete grouped.currentFloor;

            console.log('grouped', grouped);

            if (Object.values(grouped).length > 0) {
                Object.keys(grouped).forEach((buildingName) => {
                    addedBuildings.push({
                        name: buildingName,
                        data: grouped[buildingName], // Store the full data for the building
                    });
                });
            }
        }

        // FILTER TEACHERS
        if (normalizedData['Teachers']) {
            normalizedData['Teachers'].forEach((teacher) => {
                teacher.teacher = String(teacher.teacher || '').trim();
                teacher.rank = String(teacher.rank || '').trim();
                teacher.department = String(teacher.department || '').trim();
                teacher.subjects = String(teacher.subjects || '').trim();
                teacher.assignedyearlevels = String(teacher.assignedyearlevels || '').trim();

                if (
                    teacher.teacher === '' ||
                    teacher.teacher === null ||
                    teacher.teacher === undefined ||
                    teacher.rank === '' ||
                    teacher.rank === null ||
                    teacher.rank === undefined ||
                    teacher.department === '' ||
                    teacher.department === null ||
                    teacher.department === undefined ||
                    teacher.subjects === '' ||
                    teacher.subjects === null ||
                    teacher.subjects === undefined ||
                    teacher.assignedyearlevels === '' ||
                    teacher.assignedyearlevels === null ||
                    teacher.assignedyearlevels === undefined
                ) {
                    unaddedTeachers.push([0, teacher]); // MISSING DATA
                    return;
                }

                let yearLevelString = teacher.assignedyearlevels.toString();

                const isDuplicateTeacher = addedTeachers.find(
                    (t) => t.teacher.trim().toLowerCase() === teacher.teacher.trim().toLowerCase()
                );

                if (isDuplicateTeacher) {
                    unaddedTeachers.push([1, teacher]); // DUPLICATE TEACHER
                    return;
                } else {
                    const rankIndex = addedRanks.findIndex(
                        (r) => r.rank.trim().toLowerCase() === teacher.rank.trim().toLowerCase()
                    );
                    if (rankIndex === -1) {
                        unaddedTeachers.push([2, teacher]); // RANK NOT FOUND
                        return;
                    }

                    const departmentIndex = normalizedData['Departments'].findIndex(
                        (d) => d.department.trim().toLowerCase() === teacher.department.trim().toLowerCase()
                    );
                    if (departmentIndex === -1) {
                        unaddedTeachers.push([2, teacher]); // DEPARTMENT NOT FOUND
                        return;
                    }

                    const subjIds = [];
                    const subjArray = teacher.subjects.split(',').map((subject) => subject.trim());
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
                    const yearLevelArray = yearLevelString.split(',').map((yearLevel) => yearLevel.trim());
                    yearLevelArray.forEach((yearLevel) => {
                        if (yearLevel === '7') {
                            yearLevelIds.push(0);
                        } else if (yearLevel === '8') {
                            yearLevelIds.push(1);
                        } else if (yearLevel === '9') {
                            yearLevelIds.push(2);
                        } else if (yearLevel === '10') {
                            yearLevelIds.push(3);
                        } else {
                            yearLevelIds.push(-1);
                        }
                    });

                    if (yearLevelIds.includes(-1)) {
                        unaddedTeachers.push([2, teacher]); // YEAR LEVEL NOT FOUND
                        return;
                    }

                    if (subjIds.includes(-1)) {
                        unaddedTeachers.push([2, teacher]); // SUBJECT NOT FOUND
                        return;
                    } else {
                        addedTeachers.push({
                            teacher: teacher.teacher,
                            rank: rankIndex + 1,
                            department: teacher.department,
                            subjects: subjIds,
                            yearLevels: yearLevelIds,
                            additionalTeacherScheds: [],
                        });
                    }
                }
            });
        }

        // FILTER DEPARTMENTS
        if (normalizedData['Departments']) {
            normalizedData['Departments'].forEach((department) => {
                department.department = String(department.department || '').trim();
                department.departmenthead = String(department.departmenthead || '').trim();

                if (department.department === '' || department.department === null || department.department === undefined) {
                    unaddedDepartments.push([0, department]);
                    return;
                }

                const isDuplicateName = addedDepartments.find(
                    (d) => d.department.trim().toLowerCase() === department.department.trim().toLowerCase()
                );

                if (isDuplicateName) {
                    unaddedDepartments.push([1, department]); // Duplicate DEPARTMENT NAME
                    return;
                } else {
                    const isDuplicateHead =
                        department.departmenthead && department.departmenthead.trim() !== ''
                            ? addedDepartments.find(
                                  (d) =>
                                      d.departmenthead &&
                                      d.departmenthead.trim().toLowerCase() === department.departmenthead.trim().toLowerCase()
                              )
                            : false;

                    if (isDuplicateHead) {
                        unaddedDepartments.push([1, department]); // Duplicate DEPARTMENT HEAD
                        return;
                    } else {
                        const headIndex =
                            department.departmenthead && department.departmenthead.trim() !== ''
                                ? addedTeachers.findIndex(
                                      (t) =>
                                          t.teacher.trim().toLowerCase() === department.departmenthead.trim().toLowerCase() &&
                                          t.department.trim().toLowerCase() === department.department.trim().toLowerCase()
                                  )
                                : '';
                        if (headIndex === -1) {
                            unaddedDepartments.push([2, department]); // DEPARTMENT HEAD NOT FOUND
                            return;
                        }

                        // dispatch(
                        // 	addDepartment({
                        // 		name: department.department,
                        // 		head: headIndex === '' ? '' : headIndex + 1,
                        // 	})
                        // );
                        addedDepartments.push(department);
                    }
                }
            });
        }

        // FILTER PROGRAMS
        if (normalizedData['Programs']) {
            normalizedData['Programs'].slice(1).forEach((program) => {
                program.program = String(program.program || '').trim();
                program[7] = String(program[7] || '').trim();
                program[8] = String(program[8] || '').trim();
                program[9] = String(program[9] || '').trim();
                program[10] = String(program[10] || '').trim();
                program['__empty'] = String(program['__empty'] || '').trim();
                // program['__empty_1'] = String(program['__empty_1'] || '').trim();
                program['__empty_2'] = String(program['__empty_2'] || '').trim();
                // program['__empty_3'] = String(program['__empty_3'] || '').trim();
                program['__empty_4'] = String(program['__empty_4'] || '').trim();
                // program['__empty_5'] = String(program['__empty_5'] || '').trim();
                program['__empty_6'] = String(program['__empty_6'] || '').trim();
                // program['__empty_7'] = String(program['__empty_7'] || '').trim();

                if (
                    program.program === '' ||
                    program.program === null ||
                    program.program === undefined ||
                    program[7] === '' ||
                    program[7] === null ||
                    program[7] === undefined ||
                    program[8] === '' ||
                    program[8] === null ||
                    program[8] === undefined ||
                    program[9] === '' ||
                    program[9] === null ||
                    program[9] === undefined ||
                    program[10] === '' ||
                    program[10] === null ||
                    program[10] === undefined ||
                    program['__empty'] === '' ||
                    program['__empty'] === null ||
                    program['__empty'] === undefined ||
                    program['__empty_1'] === '' ||
                    program['__empty_1'] === null ||
                    program['__empty_1'] === undefined ||
                    program['__empty_2'] === '' ||
                    program['__empty_2'] === null ||
                    program['__empty_2'] === undefined ||
                    program['__empty_3'] === '' ||
                    program['__empty_3'] === null ||
                    program['__empty_3'] === undefined ||
                    program['__empty_4'] === '' ||
                    program['__empty_4'] === null ||
                    program['__empty_4'] === undefined ||
                    program['__empty_5'] === '' ||
                    program['__empty_5'] === null ||
                    program['__empty_5'] === undefined ||
                    program['__empty_6'] === '' ||
                    program['__empty_6'] === null ||
                    program['__empty_6'] === undefined ||
                    program['__empty_7'] === '' ||
                    program['__empty_7'] === null ||
                    program['__empty_7'] === undefined
                ) {
                    unaddedPrograms.push([0, program]);
                    return;
                }

                const isDuplicateProgram = addedPrograms.find(
                    (p) => p.program.trim().toLowerCase() === program.program.trim().toLowerCase()
                );

                if (isDuplicateProgram) {
                    unaddedPrograms.push([1, program]);
                    return;
                } else {
                    // =======================================================

                    const subjIds7 = [];
                    const fixedDays7 = {}; //add new objects for fixed days
                    const fixedPositions7 = {}; //add new objects for fixed days

                    const subjIds8 = [];
                    const fixedDays8 = {};
                    const fixedPositions8 = {};

                    const subjIds9 = [];
                    const fixedDays9 = {};
                    const fixedPositions9 = {};

                    const subjIds10 = [];
                    const fixedDays10 = {};
                    const fixedPositions10 = {};

                    // =======================================================

                    let totalDuration7 = 0;
                    let totalDuration8 = 0;
                    let totalDuration9 = 0;
                    let totalDuration10 = 0;

                    const subjArray7 = program[7].split(',').map((subject) => subject.trim());

                    if (subjArray7.length > 10) {
                        totalDuration7 += 2 * Number(breakTimeDuration);
                    } else {
                        totalDuration7 += Number(breakTimeDuration);
                    }

                    subjArray7.forEach((subjectName) => {
                        let found = false; // Flag to track if the subject was found

                        for (let index = 0; index < addedSubjects.length; index++) {
                            if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                                subjIds7.push(index + 1);
                                const numOfClasses = Math.min(
                                    Math.ceil(
                                        Number(addedSubjects[index]['weeklyminutes']) /
                                            Number(addedSubjects[index]['classduration'])
                                    ),
                                    numOfSchoolDays
                                );
                                fixedDays7[index + 1] = new Array(numOfClasses).fill(0);
                                fixedPositions7[index + 1] = new Array(numOfClasses).fill(0);
                                found = true;

                                totalDuration7 += Number(addedSubjects[index]['classduration']);

                                break;
                            }
                        }

                        if (!found) {
                            subjIds7.push(-1);
                        }
                    });

                    const subjArray8 = program[8].split(',').map((subject) => subject.trim());

                    if (subjArray8.length > 10) {
                        totalDuration8 += 2 * Number(breakTimeDuration);
                    } else {
                        totalDuration8 += Number(breakTimeDuration);
                    }

                    subjArray8.forEach((subjectName) => {
                        let found = false;

                        for (let index = 0; index < addedSubjects.length; index++) {
                            if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                                subjIds8.push(index + 1);
                                const numOfClasses = Math.min(
                                    Math.ceil(
                                        Number(addedSubjects[index]['weeklyminutes']) /
                                            Number(addedSubjects[index]['classduration'])
                                    ),
                                    numOfSchoolDays
                                );
                                fixedDays8[index + 1] = new Array(numOfClasses).fill(0);
                                fixedPositions8[index + 1] = new Array(numOfClasses).fill(0);
                                found = true;

                                totalDuration8 += Number(addedSubjects[index]['classduration']);

                                break;
                            }
                        }

                        if (!found) {
                            subjIds8.push(-1);
                        }
                    });

                    const subjArray9 = program[9].split(',').map((subject) => subject.trim());

                    if (subjArray9.length > 10) {
                        totalDuration9 += 2 * Number(breakTimeDuration);
                    } else {
                        totalDuration9 += Number(breakTimeDuration);
                    }

                    subjArray9.forEach((subjectName) => {
                        let found = false; // Flag to track if the subject was found

                        for (let index = 0; index < addedSubjects.length; index++) {
                            if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                                subjIds9.push(index + 1);
                                const numOfClasses = Math.min(
                                    Math.ceil(
                                        Number(addedSubjects[index]['weeklyminutes']) /
                                            Number(addedSubjects[index]['classduration'])
                                    ),
                                    numOfSchoolDays
                                );
                                fixedDays9[index + 1] = new Array(numOfClasses).fill(0);
                                fixedPositions9[index + 1] = new Array(numOfClasses).fill(0);
                                found = true;

                                totalDuration9 += Number(addedSubjects[index]['classduration']);

                                break;
                            }
                        }

                        if (!found) {
                            subjIds9.push(-1);
                        }
                    });

                    const subjArray10 = program[10].split(',').map((subject) => subject.trim());

                    if (subjArray10.length > 10) {
                        totalDuration10 += 2 * Number(breakTimeDuration);
                    } else {
                        totalDuration10 += Number(breakTimeDuration);
                    }

                    subjArray10.forEach((subjectName) => {
                        let found = false; // Flag to track if the subject was found

                        for (let index = 0; index < addedSubjects.length; index++) {
                            if (addedSubjects[index]['subject'].trim().toLowerCase() === subjectName.trim().toLowerCase()) {
                                subjIds10.push(index + 1);
                                const numOfClasses = Math.min(
                                    Math.ceil(
                                        Number(addedSubjects[index]['weeklyminutes']) /
                                            Number(addedSubjects[index]['classduration'])
                                    ),
                                    numOfSchoolDays
                                );
                                fixedDays10[index + 1] = new Array(numOfClasses).fill(0);
                                fixedPositions10[index + 1] = new Array(numOfClasses).fill(0);
                                found = true;

                                totalDuration10 += Number(addedSubjects[index]['classduration']);

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
                        // CHECK IF YEAR SHIFTS ARE VALID
                        const shiftYear7 = program['__empty'].trim().toUpperCase();
                        const shiftYear8 = program['__empty_2'].trim().toUpperCase();
                        const shiftYear9 = program['__empty_4'].trim().toUpperCase();
                        const shiftYear10 = program['__empty_6'].trim().toUpperCase();

                        if (
                            (shiftYear7 !== 'AM' && shiftYear7 !== 'PM') ||
                            (shiftYear8 !== 'AM' && shiftYear8 !== 'PM') ||
                            (shiftYear9 !== 'AM' && shiftYear9 !== 'PM') ||
                            (shiftYear10 !== 'AM' && shiftYear10 !== 'PM')
                        ) {
                            unaddedPrograms.push([2, program]); // Shift is invalid
                            return;
                        }

                        // CHECK IF START TIMES ARE VALID
                        let startTime7 = '';
                        let startTime8 = '';
                        let startTime9 = '';
                        let startTime10 = '';

                        if (typeof program['__empty_1'] !== 'string') {
                            startTime7 = convertExcelTimeToTimeString(program['__empty_1']);
                        } else {
                            startTime7 = formatTimeWithLeadingZero(program['__empty_1'].trim().toUpperCase());
                        }

                        if (typeof program['__empty_3'] !== 'string') {
                            startTime8 = convertExcelTimeToTimeString(program['__empty_3']);
                        } else {
                            startTime8 = formatTimeWithLeadingZero(program['__empty_3'].trim().toUpperCase());
                        }

                        if (typeof program['__empty_5'] !== 'string') {
                            startTime9 = convertExcelTimeToTimeString(program['__empty_5']);
                        } else {
                            startTime9 = formatTimeWithLeadingZero(program['__empty_5'].trim().toUpperCase());
                        }

                        if (typeof program['__empty_7'] !== 'string') {
                            startTime10 = convertExcelTimeToTimeString(program['__empty_7']);
                        } else {
                            startTime10 = formatTimeWithLeadingZero(program['__empty_7'].trim().toUpperCase());
                        }

                        const startTime7Idx = getTimeSlotIndex(startTime7);
                        const startTime8Idx = getTimeSlotIndex(startTime8);
                        const startTime9Idx = getTimeSlotIndex(startTime9);
                        const startTime10Idx = getTimeSlotIndex(startTime10);

                        if (startTime7Idx === -1 || startTime8Idx === -1 || startTime9Idx === -1 || startTime10Idx === -1) {
                            console.log('ito ba?');
                            unaddedPrograms.push([2, program]); // Start time is invalid
                            return;
                        }

                        console.log('totalDuration7: ', totalDuration7);
                        console.log('totalDuration8: ', totalDuration8);
                        console.log('totalDuration9: ', totalDuration9);
                        console.log('totalDuration10: ', totalDuration10);

                        // END TIME
                        totalDuration7 /= 5;
                        totalDuration8 /= 5;
                        totalDuration9 /= 5;
                        totalDuration10 /= 5;

                        const endTime7Idx = startTime7Idx + totalDuration7;
                        const endTime8Idx = startTime8Idx + totalDuration8;
                        const endTime9Idx = startTime9Idx + totalDuration9;
                        const endTime10Idx = startTime10Idx + totalDuration10;

                        addedPrograms.push({
                            program: program.program,
                            7: {
                                subjects: subjIds7,
                                shift: shiftYear7 === 'AM' ? 0 : 1,
                                startTime: startTime7Idx,
                                endTime: endTime7Idx,
                                fixedDays: fixedDays7,
                                fixedPositions: fixedPositions7,
                                additionalScheds: [],
                            },
                            8: {
                                subjects: subjIds8,
                                shift: shiftYear8 === 'AM' ? 0 : 1,
                                startTime: startTime8Idx,
                                endTime: endTime8Idx,
                                fixedDays: fixedDays8,
                                fixedPositions: fixedPositions8,
                                additionalScheds: [],
                            },
                            9: {
                                subjects: subjIds9,
                                shift: shiftYear9 === 'AM' ? 0 : 1,
                                startTime: startTime9Idx,
                                endTime: endTime9Idx,
                                fixedDays: fixedDays9,
                                fixedPositions: fixedPositions9,
                                additionalScheds: [],
                            },
                            10: {
                                subjects: subjIds10,
                                shift: shiftYear10 === 'AM' ? 0 : 1,
                                startTime: startTime10Idx,
                                endTime: endTime10Idx,
                                fixedDays: fixedDays10,
                                fixedPositions: fixedPositions10,
                                additionalScheds: [],
                            },
                        });
                    }
                }
            });
        }

        // FILTER SECTIONS
        if (normalizedData['Sections']) {
            const assignedAdviser = [];
            const assignedRoom = [];

            normalizedData['Sections'].forEach((section) => {
                section.sectionname = String(section.sectionname).trim().toUpperCase();
                section.program = String(section.program).trim().toUpperCase();
                section.adviser = String(section.adviser).trim().toUpperCase();
                section.roomdetails = String(section.roomdetails).trim().toUpperCase();

                let roomDetailsIssue = false;

                if (
                    section.sectionname === '' ||
                    section.sectionname === null ||
                    section.sectionname === undefined ||
                    section.program === '' ||
                    section.program === null ||
                    section.program === undefined ||
                    section.adviser === '' ||
                    section.adviser === null ||
                    section.adviser === undefined ||
                    section.year === '' ||
                    section.year === null ||
                    section.year === undefined ||
                    section.roomdetails === '' ||
                    section.roomdetails === null ||
                    section.roomdetails === undefined
                ) {
                    unaddedSections.push([0, section]);
                    return;
                }

                const isDuplicateSection = addedSections.find(
                    (s) => s['sectionname'].trim().toLowerCase() === section.sectionname.trim().toLowerCase()
                );
                if (isDuplicateSection) {
                    unaddedSections.push([1, section]);
                    return;
                } else {
                    // Check if program is valid
                    const progID = addedPrograms.findIndex(
                        (program) => program['program'].trim().toLowerCase() === section.program.trim().toLowerCase()
                    );

                    // Check if adviser is valid
                    const advID = addedTeachers.findIndex(
                        (t) => t.teacher.trim().toLowerCase() === section.adviser.trim().toLowerCase()
                    );

                    // Check if year is valid
                    const year = Number(section.year);

                    // Check if building is valid
                    const roomDetailsMatch = section.roomdetails.match(/\[(.*?), FLOOR (\d+)\] (.*)/);
                    const roomDetails = {
                        buildingId: -1,
                        floorIdx: -1,
                        roomIdx: -1,
                    };
                    if (roomDetailsMatch) {
                        const [, bldgName, floorNumber, rmName] = roomDetailsMatch;
                        const floorNumberDecremented = parseInt(floorNumber, 10) - 1;

                        const normalizedBldgName = bldgName.trim().toLowerCase();
                        const normalizedRmName = rmName.trim().toLowerCase();

                        let bldgFound = false;

                        addedBuildings.some((building, buildingIdx) => {
                            if (building.name.trim().toLowerCase() === normalizedBldgName) {
                                bldgFound = true;

                                const floorData = building.data[floorNumberDecremented];

                                if (floorData) {
                                    const room = floorData.find(
                                        (room, idx) => room.roomName.trim().toLowerCase() === normalizedRmName
                                    );

                                    if (room) {
                                        const isValid = assignedRoom.filter(
                                            (room) =>
                                                room.buildingId === buildingIdx + 1 &&
                                                room.floorIdx === floorNumberDecremented &&
                                                room.roomIdx === floorData.indexOf(room)
                                        );

                                        if (isValid.length > 0) {
                                            unaddedSections.push([1, section]); // Duplicate room
                                            roomDetailsIssue = true;
                                            return;
                                        }

                                        roomDetails.buildingId = buildingIdx + 1;
                                        roomDetails.floorIdx = floorNumberDecremented;
                                        roomDetails.roomIdx = floorData.indexOf(room);

                                        if (section.sectionname === 'Malandi') console.log('roomDetails', roomDetails);

                                        assignedRoom.push(roomDetails);

                                        return true;
                                    } else {
                                        unaddedSections.push([2, section]); // Unknown room
                                        roomDetailsIssue = true;
                                        return;
                                    }
                                } else {
                                    unaddedSections.push([2, section]); // Unknown floor
                                    roomDetailsIssue = true;
                                    return;
                                }
                            }
                            return false;
                        });

                        if (roomDetailsIssue) {
                            return;
                        }

                        if (!bldgFound) {
                            unaddedSections.push([2, section]); // Unknown building
                            return;
                        }
                    } else {
                        unaddedSections.push([-1, section]); // Building format mismatch
                        return;
                    }

                    if (progID === -1 || advID === -1) {
                        unaddedSections.push([2, section]); // Unknown program or adviser
                        return;
                    } else if (assignedAdviser.includes(advID)) {
                        unaddedSections.push([1, section]); // Duplicate adviser
                        return;
                    } else if (![7, 8, 9, 10].includes(year) || !Number.isInteger(year)) {
                        unaddedSections.push([2, section]); // Unknown year
                        return;
                    } else {
                        const program = addedPrograms[progID];
                        const sectionSubjects = program[year].subjects;
                        const sectionFixedDays = program[year].fixedDays;
                        const sectionFixedPositions = program[year].fixedPositions;
                        const sectionShift = program[year].shift;
                        const startTimeIdx = program[year].startTime;
                        const endTimeIdx = program[year].endTime;

                        let isOverlap = false;
                        addedSections_2.forEach((section) => {
                            if (
                                section.roomDetails.buildingId === roomDetails.buildingId &&
                                section.roomDetails.floorIdx === roomDetails.floorIdx &&
                                section.roomDetails.roomIdx === roomDetails.roomIdx
                            ) {
                                if (section.endTime > startTimeIdx && section.startTime < endTimeIdx) {
                                    isOverlap = true;
                                    return;
                                }
                            }
                        });

                        if (isOverlap) {
                            unaddedSections.push([1, section]); // Overlapping room
                            return;
                        }

                        addedSections.push(section);
                        addedSections_2.push({
                            section: section.sectionname,
                            teacher: advID + 1,
                            program: progID + 1,
                            year: year,
                            subjects: sectionSubjects,
                            fixedDays: sectionFixedDays,
                            fixedPositions: sectionFixedPositions,
                            shift: sectionShift,
                            startTime: startTimeIdx,
                            endTime: endTimeIdx,
                            roomDetails: roomDetails,
                            additionalScheds: [],
                        });
                        assignedAdviser.push(advID);
                    }
                }
            });

            // console.log('addedSections', addedSections);
            // console.log('addedSections_2', addedSections_2);
            // console.log('unaddedSections', unaddedSections);
        }

        // ======================== ADD ALL ENTRIES TO DATABASE ======================== //

        // console.log('teachers', addedTeachers);
        // console.log('sections', addedSections_2);

        // Add all subjects
        for (let i = 0; i < addedSubjects.length; i++) {
            const subject = addedSubjects[i];

            dispatch(
                addSubject({
                    subject: subject.subject,
                    classDuration: Number(subject.classduration),
                    weeklyMinutes: Number(subject.weeklyminutes),
                })
            );
        }

        // Add all ranks
        for (let i = 0; i < addedRanks.length; i++) {
            const rank = addedRanks[i];

            dispatch(
                addRank({
                    rank: rank.rank,
                    additionalRankScheds: [],
                })
            );
        }

        // Add all buildings
        for (let i = 0; i < addedBuildings.length; i++) {
            const building = addedBuildings[i];

            dispatch(
                addBuilding({
                    name: building.name,
                    floors: Object.values(building.data).length,
                    rooms: Object.values(building.data),
                    image: null,
                    nearbyBuildings: [],
                })
            );
        }

        // Add all teachers
        for (let i = 0; i < addedTeachers.length; i++) {
            const teacher = JSON.parse(JSON.stringify(addedTeachers[i]));

            // Get department ID
            const departmentIndex = addedDepartments.findIndex(
                (d) => d.department.trim().toLowerCase() === teacher.department.trim().toLowerCase()
            );

            if (departmentIndex === -1) {
                unaddedTeachers.push([2, teacher]);
                addedTeachers.splice(i, 1);
                i--;
                continue;
            }

            teacher.department = departmentIndex + 1;

            // Check if teacher is an adviser of a section
            const isAdviser = addedSections.some(
                (section) => section.adviser.trim().toLowerCase() === teacher.teacher.trim().toLowerCase()
            );

            if (isAdviser) {
                // If teacher is an adviser of a section then add an additional schedule
                teacher.additionalTeacherScheds.push({
                    name: 'Advisory Load',
                    subject: -1,
                    duration: 60,
                    frequency: numOfSchoolDays,
                    shown: false,
                    time: 96,
                });
            }

            dispatch(addTeacher(teacher));
        }

        // Add all departments
        for (let i = 0; i < addedDepartments.length; i++) {
            const department = addedDepartments[i];

            const headIndex =
                department.departmenthead && department.departmenthead.trim() !== ''
                    ? addedTeachers.findIndex(
                          (t) =>
                              t.teacher.trim().toLowerCase() === department.departmenthead.trim().toLowerCase() &&
                              t.department.trim().toLowerCase() === department.department.trim().toLowerCase()
                      )
                    : '';

            dispatch(
                addDepartment({
                    name: department.department,
                    head: headIndex === '' ? '' : headIndex + 1,
                })
            );
        }

        // Add all programs
        for (let i = 0; i < addedPrograms.length; i++) {
            const program = addedPrograms[i];

            dispatch(addProgram(program));
        }

        // Add all sections
        for (let i = 0; i < addedSections_2.length; i++) {
            const section = addedSections_2[i]; // normalized
            const section_2 = addedSections[i]; // original

            const advID = addedTeachers.findIndex(
                (t) => t.teacher.trim().toLowerCase() === section_2.adviser.trim().toLowerCase()
            );

            section.teacher = advID + 1;

            dispatch(addSection(section));
        }

        // console.log('Added sections:', addedSections);
        // console.log('Added subjects:', addedSubjects);
        // console.log('Added teachers:', addedTeachers);
        // console.log('Added programs:', addedPrograms);
        // console.log('Added ranks:', addedRanks);
        // console.log('Added buildings:', addedBuildings);
        // console.log('Added departments:', addedDepartments);

        // console.log('Unadded subjects: ', unaddedSubjects);
        // console.log('Unadded teachers: ', unaddedTeachers);
        console.log('Unadded programs: ', unaddedPrograms);
        console.log('Unadded sections: ', unaddedSections);
        // console.log('Unadded ranks: ', unaddedRanks);
        // console.log('Unadded departments: ', unaddedDepartments);
    };

    // =======================================================================

    return (
        <div className='flex gap-2'>
            <button
                className='btn btn-secondary'
                onClick={() => {
                    document.getElementById('export-format-modal').showModal();
                }}
            >
                Export <CiExport size={20} />
            </button>

            <button
                className='btn btn-secondary'
                onClick={() => {
                    document.getElementById('import-confirmation-modal').showModal();
                }}
            >
                Import <CiImport size={20} />
            </button>

            {/* Export Format Modal */}
            <dialog id='export-format-modal' className='modal'>
                <div className='modal-box'>
                    <h3 className='font-bold text-lg'>Choose Export Format</h3>
                    <p className='py-4'>Select the format in which you want to export the database:</p>
                    <div className='modal-action'>
                        {/* Option to Export as JSON */}
                        {/* <button
                            className="btn btn-primary"
                            onClick={() => {
                                exportDB('json');
                                document
                                    .getElementById('export-format-modal')
                                    .close();
                                // exportDB();
                            }}
                        >
                            Export as JSON
                        </button> */}

                        {/* Option to Export as Excel */}
                        <button
                            className='btn btn-primary'
                            onClick={() => {
                                exportDB('excel');
                                document.getElementById('export-format-modal').close();
                                // exportDB();
                            }}
                        >
                            Export as Excel
                        </button>

                        <form method='dialog'>
                            <button className='btn btn-error'>Cancel</button>
                        </form>
                    </div>
                </div>
            </dialog>

            <dialog id='import-confirmation-modal' className='modal'>
                <div className='modal-box'>
                    <h3 className='font-bold text-lg'>Import Confirmation</h3>
                    <p className='py-4'>Importing will override all current data in the database. Are you sure?</p>
                    <div className='modal-action'>
                        <button
                            className='btn btn-primary'
                            onClick={async () => {
                                document.getElementById('import-confirmation-modal').close();
                                document.getElementById('import-format-modal').showModal();
                            }}
                        >
                            Upload Data File <BiUpload size={20} />
                        </button>
                        <form method='dialog'>
                            <div className='flex gap-2'>
                                <button className='btn btn-error'>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </dialog>

            <dialog id='import-format-modal' className='modal'>
                <div className='modal-box'>
                    <h3 className='font-bold text-lg'>Choose Import Format</h3>
                    <p className='py-4'>Select the format in which you want to import your data:</p>
                    <div className='modal-action'>
                        {/* Option to Import a JSON */}
                        {/* <button
                            className="btn btn-primary"
                            onClick={() => {
                                importDB('json');
                                document
                                    .getElementById('import-format-modal')
                                    .close();
                            }}
                        >
                            Import JSON
                        </button> */}

                        {/* Option to Import an Excel */}
                        <button
                            className='btn btn-primary'
                            onClick={async () => {
                                try {
                                    await importDB('excel');

                                    console.log('Import completed!');
                                } catch (error) {
                                    console.error('Error during import:', error);
                                }
                            }}
                            disabled={isImporting}
                        >
                            Import EXCEL
                        </button>

                        <form method='dialog'>
                            <button className='btn btn-error' disabled={isImporting}>
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            </dialog>

            {isImporting && <ImportingFullScreenLoader />}
        </div>
    );
};

export default ExportImportDBButtons;
