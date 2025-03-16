import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CiExport, CiImport } from 'react-icons/ci';
import { createPortal } from 'react-dom';
import { exportIndexedDB, loadFile, importIndexedDB, DB_NAME } from '@src/indexedDB';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { fetchSubjects } from '@features/subjectSlice';
import { fetchSections } from '@features/sectionSlice';
import { fetchTeachers } from '@features/teacherSlice';
import { fetchPrograms } from '@features/programSlice';
import { fetchDepartments } from '@features/departmentSlice';
import { fetchBuildings } from '@features/buildingSlice';
import { fetchRanks } from '@features/rankSlice';

import { getTimeSlotString, getTimeSlotIndex } from '@utils/timeSlotMapper';
import colors from '@utils/colors';

const ExportSchedules = ({ schedule, close }) => {
    const dispatch = useDispatch();

    // ======================================================================================================

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return localStorage.getItem('numOfSchoolDays') || 5;
    });

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    const selectedDays = days.slice(0, numOfSchoolDays);

    // ======================================================================================================

    const [timetable, setTimetable] = useState(schedule);

    useEffect(() => {
        if (schedule) {
            setTimetable(schedule);
        }
    }, [schedule]);

    // ======================================================================================================

    const { programs, status: programStatus } = useSelector((state) => state.program);
    const { subjects, status: subjectStatus } = useSelector((state) => state.subject);
    const { teachers, status: teacherStatus } = useSelector((state) => state.teacher);
    const { ranks, status: rankStatus } = useSelector((state) => state.rank);
    const { departments, status: departmentStatus } = useSelector((state) => state.department);
    const { buildings, status: buildingStatus } = useSelector((state) => state.building);
    const { sections, status: sectionStatus } = useSelector((state) => state.section);

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

    // =====================================================================================================

    const sectionScheds = [];
    const teacherScheds = [];

    const exportTeacherScheds = async () => {
        const workbook = new ExcelJS.Workbook();

        for (const sched of teacherScheds) {
            const key = Object.keys(sched)[0]; // Extract the first key of the sched object
            const val = sched[key]; // Extract the first value of the sched object

            const parts = key.split(' - '); // Split at " - "
            const teacherName = parts[0].replace('Teacher: ', ''); // Remove 'Teacher: '

            if (!teacherName) {
                console.error('Teacher name not found in key:', key);
                return;
            }

            const worksheet = workbook.addWorksheet(teacherName);

            // ***************** TEMPORARY *****************
            // **
            const teacher = Object.values(teachers).find((teacher) => teacher.teacher === teacherName);
            if (!teacher) {
                console.error('Teacher not found:', teacherName);
                return;
            }
            worksheet.addRow(['Name', teacherName]);
            worksheet.addRow(['Rank', ranks[teacher.rank].rank]);
            worksheet.addRow(['Department', departments[teacher.department].name]);
            worksheet.addRow(['TIME', 'No. of Minutes', ...selectedDays]);

            worksheet.getColumn(1).eachCell((cell) => {
                worksheet.getCell(cell.address).font = { bold: true };
            });

            worksheet.getRow(4).eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { bold: true };
            });

            // **
            // ***************** TEMPORARY *****************

            // worksheet.addRow(['']);

            const timeslots = [];
            const startTimes = [];

            const sects = new Map();
            let nextKey = 0;

            const classBlocks = [];

            for (const [key, value] of val.entries()) {
                const timeslot = `${getTimeSlotString(value.start + 72)} - ${getTimeSlotString(value.end + 72)}`;
                const classBlock = [
                    timeslot,
                    value.start,
                    value.end,
                    value.day,
                    value.section,
                    value.sectionID,
                    value.subject,
                    value.subjectID,
                    value.additional,
                ];

                classBlocks.push(classBlock);

                let left = 0;
                let right = startTimes.length - 1;
                let insertIndex = startTimes.length;

                while (left <= right) {
                    const mid = Math.floor((left + right) / 2);

                    if (value.start < startTimes[mid]) {
                        right = mid - 1;
                        insertIndex = mid;
                    } else {
                        left = mid + 1;
                    }
                }

                if (!sects.has(value.section)) {
                    sects.set(value.section, nextKey);
                    nextKey++;
                }

                startTimes.splice(insertIndex, 0, value.start);
                timeslots.splice(insertIndex, 0, timeslot);
            }

            const normalizedTimeslots = new Map();

            for (let i = 0; i < timeslots.length; i++) {
                if (!normalizedTimeslots.has(timeslots[i])) {
                    const timeslotValue = Array.from({ length: numOfSchoolDays }, () => ({
                        minutes: 0,
                        section: '',
                        subject: '',
                        room: '',
                    }));

                    normalizedTimeslots.set(timeslots[i], timeslotValue);
                }
            }

            for (let i = 0; i < classBlocks.length; i++) {
                if (normalizedTimeslots.has(classBlocks[i][0])) {
                    const start = classBlocks[i][1];
                    const end = classBlocks[i][2];
                    const day = classBlocks[i][3];
                    const sectionName = classBlocks[i][4];
                    const sectionId = classBlocks[i][5];
                    const subjectName = classBlocks[i][6];
                    const isAdditional = classBlocks[i][8];

                    let roomName;
                    if (sectionId === null) {
                        roomName = '';
                    } else {
                        const roomDetails = sections[sectionId]?.roomDetails;
                        roomName =
                            buildings?.[roomDetails?.buildingId]?.rooms?.[roomDetails.floorIdx]?.[roomDetails.roomIdx]
                                ?.roomName || '';
                    }

                    const currentValue = normalizedTimeslots.get(classBlocks[i][0]);

                    currentValue[day - 1] = {
                        minutes: (end - start) * 5,
                        section: sectionName,
                        subject: subjectName,
                        room: roomName,
                        additional: isAdditional,
                    };

                    normalizedTimeslots.set(classBlocks[i][0], currentValue);
                }
            }

            // console.log('sects', sects);
            // console.log('classBlocks: ', classBlocks);
            // console.log('normalizedTimeslots: ', normalizedTimeslots);

            let row = 6;
            for (const [key, value] of normalizedTimeslots.entries()) {
                const backgroundColor = row % 2 === 0 ? 'FFF0FFFF' : 'FFF0F0F5';

                worksheet.mergeCells(`A${row}:A${row + 2}`);
                worksheet.mergeCells(`B${row}:B${row + 2}`);

                worksheet.getCell(`A${row}`).value = key;
                worksheet.getCell(`A${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet.getCell(`A${row}`).font = { bold: true };
                worksheet.getCell(`A${row}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: backgroundColor },
                };

                let column = 'C';
                let totalMinutes = 0;
                for (let i = 0; i < value.length; i++) {
                    const data = value[i];

                    totalMinutes += data.minutes;

                    if (!data.additional)
                        worksheet.getCell(`${column}${row}`).value = data.section === null ? '' : data.section.toUpperCase();

                    worksheet.getCell(`${column}${row + 1}`).value = data.subject === null ? '' : data.subject;

                    if (!data.additional) worksheet.getCell(`${column}${row + 2}`).value = data.room;

                    const bgColor = colors[sects.get(data.section)];

                    worksheet.getCell(`${column}${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
                    worksheet.getCell(`${column}${row + 1}`).alignment = { vertical: 'middle', horizontal: 'center' };
                    worksheet.getCell(`${column}${row + 2}`).alignment = { vertical: 'middle', horizontal: 'center' };

                    worksheet.getCell(`${column}${row}`).font = { bold: true };

                    worksheet.getCell(`${column}${row}`).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: bgColor },
                    };
                    worksheet.getCell(`${column}${row + 1}`).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: bgColor },
                    };
                    worksheet.getCell(`${column}${row + 2}`).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: bgColor },
                    };

                    column = String.fromCharCode(column.charCodeAt(0) + 1);
                }

                worksheet.getCell(`B${row}`).value = totalMinutes;
                worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet.getCell(`B${row}`).font = { bold: true };

                // Move to the next set of rows
                row += 3;
            }

            // COLUMN WIDTH
            worksheet.getColumn(1).width = 25;
            worksheet.getColumn(2).width = 25;
            let startingCol = 3;
            for (let i = 0; i < numOfSchoolDays; i++) {
                worksheet.getColumn(startingCol).width = 20;
                startingCol++;
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Teacher Schedules.xlsx');
    };

    const exportSectionScheds = async () => {
        // console.log('Exporting section schedules...');
        // console.log('sectionScheds: ', sectionScheds);
        const workbook = new ExcelJS.Workbook();

        for (const sched of sectionScheds) {
            const key = Object.keys(sched)[0]; // Extract the first key of the sched object
            const val = sched[key]; // Extract the first value of the sched object

            const parts = key.split(' - '); // Split at " - "
            const sectionName = parts[0].replace('Section: ', '');

            if (!sectionName) {
                console.error('Section name not found in key:', key);
                return;
            }

            const worksheet = workbook.addWorksheet(sectionName);

            // ***************** TEMPORARY *****************
            // **
            const section = Object.values(sections).find((section) => section.section === sectionName);
            if (!section) {
                console.error('Section not found:', sectionName);
                return;
            }

            const teacher = teachers[section.teacher]?.teacher || '';
            const room =
                buildings[section.roomDetails.buildingId]?.rooms[section.roomDetails.floorIdx]?.[section.roomDetails.roomIdx]
                    ?.roomName || '';

            const startColumn = 'A';
            const startColumn_2 = 'C';
            const endColumn = String.fromCharCode(65 + Number(numOfSchoolDays) + 1);

            worksheet.mergeCells(`${startColumn}1:${endColumn}1`);
            worksheet.mergeCells(`${startColumn}2:${endColumn}2`);
            worksheet.mergeCells('A3:A4');
            worksheet.mergeCells('B3:B4');
            worksheet.mergeCells(`${startColumn_2}3:${endColumn}3`);

            worksheet.getCell('A1').value = sectionName;
            worksheet.getCell('A2').value = section.program;
            worksheet.getCell('A3').value = 'TIME';
            worksheet.getCell('B3').value = 'Minutes';
            worksheet.getCell('C3').value = 'Day';

            worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell('C3').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheet.getCell('A1').font = { bold: true, size: 14 };
            worksheet.getCell('A2').font = { bold: true, size: 12 };
            worksheet.getCell('A3').font = { bold: true };
            worksheet.getCell('B3').font = { bold: true };
            worksheet.getCell('C3').font = { bold: true };

            let column = 'C';
            for (let i = 0; i < numOfSchoolDays; i++) {
                worksheet.getCell(`${column}4`).value = days[i];
                worksheet.getCell(`${column}5`).value = section.modality[i] === 1 ? 'ONSITE' : 'OFFSITE';

                worksheet.getCell(`${column}4`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell(`${column}5`).alignment = { horizontal: 'center', vertical: 'middle' };

                worksheet.getCell(`${column}4`).font = { bold: true };
                worksheet.getCell(`${column}5`).font = {
                    color: { argb: 'FFFFFFFF' },
                    bold: true,
                };

                worksheet.getCell(`${column}5`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: section.modality[i] === 1 ? 'FF006400' : 'FF8B0000' },
                };

                column = String.fromCharCode(column.charCodeAt(0) + 1);
            }

            // **
            // ***************** TEMPORARY *****************

            worksheet.addRow(['']);

            const timeslots = [];
            const startTimes = [];

            const sects = new Map();
            let nextKey = 0;

            const classBlocks = [];

            for (const [key, value] of val.entries()) {
                const timeslot = `${getTimeSlotString(value.start + 72)} - ${getTimeSlotString(value.end + 72)}`;
                const classBlock = [
                    timeslot,
                    value.start,
                    value.end,
                    value.day,
                    value.teacher,
                    value.teacherID,
                    value.subject,
                    value.subjectID,
                    value.additional,
                ];

                classBlocks.push(classBlock);

                let left = 0;
                let right = startTimes.length - 1;
                let insertIndex = startTimes.length;

                while (left <= right) {
                    const mid = Math.floor((left + right) / 2);

                    if (value.start < startTimes[mid]) {
                        right = mid - 1;
                        insertIndex = mid;
                    } else {
                        left = mid + 1;
                    }
                }

                if (!sects.has(value.subject)) {
                    sects.set(value.subject, nextKey);
                    nextKey++;
                }

                startTimes.splice(insertIndex, 0, value.start);
                timeslots.splice(insertIndex, 0, timeslot);
            }

            const normalizedTimeslots = new Map();

            for (let i = 0; i < timeslots.length; i++) {
                if (!normalizedTimeslots.has(timeslots[i])) {
                    const timeslotValue = Array.from({ length: numOfSchoolDays }, () => ({
                        minutes: 0,
                        // sched_name: '',
                        subject: '',
                        teacher: '',
                    }));

                    normalizedTimeslots.set(timeslots[i], timeslotValue);
                }
            }

            for (let i = 0; i < classBlocks.length; i++) {
                if (normalizedTimeslots.has(classBlocks[i][0])) {
                    const start = classBlocks[i][1];
                    const end = classBlocks[i][2];
                    const day = classBlocks[i][3];
                    const teacherName = classBlocks[i][4];
                    // const teacherId = classBlocks[i][5];
                    const subjectName = classBlocks[i][6];
                    const isAdditional = classBlocks[i][8];

                    const currentValue = normalizedTimeslots.get(classBlocks[i][0]);

                    currentValue[day - 1] = {
                        minutes: (end - start) * 5,
                        subject: subjectName,
                        teacher: teacherName,
                        additional: isAdditional,
                    };

                    normalizedTimeslots.set(classBlocks[i][0], currentValue);
                }
            }

            // console.log('sects', sects);
            // console.log('classBlocks: ', classBlocks);
            // console.log('normalizedTimeslots: ', normalizedTimeslots);

            let row = 6;
            for (const [key, value] of normalizedTimeslots.entries()) {
                const backgroundColor = row % 2 === 0 ? 'FFF0FFFF' : 'FFF0F0F5';

                worksheet.mergeCells(`A${row}:A${row}`);
                worksheet.mergeCells(`B${row}:B${row + 1}`);

                worksheet.getCell(`A${row}`).value = key;
                worksheet.getCell(`A${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet.getCell(`A${row}`).font = { bold: true };
                worksheet.getCell(`A${row}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: backgroundColor },
                };

                let column = 'C';
                let minutes = 0;

                let mergedStartCell = null;
                let mergedEndCell = null;

                for (let i = 0; i < value.length; i++) {
                    const data = value[i];

                    minutes = data.minutes >= minutes ? data.minutes : minutes;

                    let bgColor;
                    let currentColumn = column;

                    if (data.subject === null && data.teacher === null && !data.additional) {
                        let startCell = `${column}${row}`;
                        let endCell = `${endColumn}${row + 1}`;

                        if (startCell !== mergedStartCell && endCell !== mergedEndCell) {
                            worksheet.mergeCells(`${column}${row}:${endColumn}${row + 1}`);
                            worksheet.getCell(`${column}${row}`).value = 'BREAK';

                            mergedStartCell = startCell;
                            mergedEndCell = endCell;
                        }

                        bgColor = 'FFFFFF';
                    } else {
                        if (data.additional) {
                            worksheet.mergeCells(`${column}${row}:${column}${row + 1}`);

                            worksheet.getCell(`${column}${row}`).value = data.subject === null ? '' : data.subject.toUpperCase();
                        } else {
                            worksheet.getCell(`${column}${row}`).value = data.subject === null ? '' : data.subject.toUpperCase();
                            worksheet.getCell(`${column}${row + 1}`).value = data.teacher;
                        }

                        bgColor = colors[sects.get(data.subject)];
                    }

                    worksheet.getCell(`${column}${row}`).font = { bold: true };

                    worksheet.getCell(`${column}${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
                    worksheet.getCell(`${column}${row + 1}`).alignment = { vertical: 'middle', horizontal: 'center' };

                    worksheet.getCell(`${column}${row}`).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: bgColor },
                    };
                    worksheet.getCell(`${column}${row + 1}`).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: bgColor },
                    };

                    column = String.fromCharCode(column.charCodeAt(0) + 1);
                }

                worksheet.getCell(`B${row}`).value = minutes;
                worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet.getCell(`B${row}`).font = { bold: true };

                // Move to the next set of rows
                row += 2;
            }

            const startCol = 'B';
            const endCol = String.fromCharCode(65 + Number(numOfSchoolDays) + 1);

            worksheet.mergeCells(`${startCol}${row}:${endCol}${row}`);
            worksheet.mergeCells(`${startCol}${row + 1}:${endCol}${row + 1}`);

            worksheet.getCell(`A${row}`).value = 'Adviser';
            worksheet.getCell(`A${row + 1}`).value = 'Room';
            worksheet.getCell(`B${row}`).value = teacher;
            worksheet.getCell(`B${row + 1}`).value = room;

            worksheet.getCell(`A${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`A${row + 1}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`B${row + 1}`).alignment = { vertical: 'middle', horizontal: 'center' };

            worksheet.getCell(`A${row}`).font = { bold: true };
            worksheet.getCell(`A${row + 1}`).font = { bold: true };
            worksheet.getCell(`B${row}`).font = { bold: true };
            worksheet.getCell(`B${row + 1}`).font = { bold: true };

            worksheet.getCell(`B${row}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '8C78E0' },
            };
            worksheet.getCell(`B${row + 1}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'AFFF66' },
            };

            // COLUMN WIDTH
            worksheet.getColumn(1).width = 25;
            worksheet.getColumn(2).width = 15;
            let startingCol = 3;
            for (let i = 0; i < numOfSchoolDays; i++) {
                worksheet.getColumn(startingCol).width = 20;
                startingCol++;
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Section Schedules.xlsx');
    };

    const exportScheds = () => {
        console.log('Starting export process...');

        timetable.forEach((value, key) => {
            // console.log('key: ', key);
            if (key.startsWith('Section:')) {
                sectionScheds.push({ [key]: value });
            } else if (key.startsWith('Teacher:')) {
                teacherScheds.push({ [key]: value });
            }
        });

        // console.log('hahahfsaa');

        exportTeacherScheds();
        exportSectionScheds();

        close();
    };

    useEffect(() => {
        console.log('timetable: ', timetable);
        exportScheds();
    }, [timetable]);

    return null;
};

export default ExportSchedules;
