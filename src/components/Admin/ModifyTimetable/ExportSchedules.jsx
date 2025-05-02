import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { getTimeSlotString } from '@utils/timeSlotMapper';
import colors from '@utils/colors';
import { useSelector } from 'react-redux';

import depedLogo from '@assets/pictures/DEPED_Logo.png';
import bhnhsLogo from '@assets/pictures/BHNHS_logo.png';

const ExportSchedules = ({ 
    programs, 
    buildings,
    sections, 
    teachers, 
    ranks, 
    departments, 
    schedule, 
    close 
}) => {
    
// ======================================================================================================

    const { configurations } = useSelector((state) => state.configuration);

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    const selectedDays = days.slice(0, configurations[1].defaultNumberOfSchoolDays);

// ======================================================================================================

    const [timetable, setTimetable] = useState(schedule);

    useEffect(() => {
        if (schedule) {
            setTimetable(schedule);
        }
    }, [schedule]);

// =====================================================================================================

    const sectionScheds = [];
    const teacherScheds = [];

    const getImageBuffer = async (url) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
      };

    function columnLetterToNumber(letter) {
        let num = 0;
        for (let i = 0; i < letter.length; i++) {
            num *= 26;
            num += letter.charCodeAt(i) - 64; // A = 65
        }
        return num;
    }

    const exportTeacherScheds = async () => {
        const workbook = new ExcelJS.Workbook();

        for (const sched of teacherScheds) {

            let row = 0;

            const key = Object.keys(sched)[0];
            const val = sched[key];

            const parts = key.split(' - ');
            const teacherName = parts[0].replace('Teacher: ', '');

            if (!teacherName) {
                console.error('Teacher name not found in key:', key);
                return;
            }

            const worksheet = workbook.addWorksheet(teacherName);

            /*
                IMAGES
            */
            // const DEPED_logo = await getImageBuffer(depedLogo);
            // const school_logo = await getImageBuffer(bhnhsLogo);
            
            // const DEPEDId = workbook.addImage({
            //     buffer: DEPED_logo,
            //     extension: 'png',
            // });

            // const schoolId = workbook.addImage({
            //     buffer: school_logo,
            //     extension: 'png',
            // });
            
            /*
                IMAGES
            */


            // ***************** HEADER *****************
            // **

            const teacher = Object.values(teachers).find((teacher) => teacher.teacher === teacherName);
            if (!teacher) {
                console.error('Teacher not found:', teacherName);
                return;
            }

            let sectionDisplay = '';

            const sectionAssignment = Object.values(sections).find(
            (section) => section.teacher === teacher.id
            );

            if (sectionAssignment) {
                const sectionProgram = Object.values(programs).find(
                    (program) => program.id === sectionAssignment.program
                );

                const programName = sectionProgram ? sectionProgram.program : '';
                sectionDisplay = `${sectionAssignment.year} - ${sectionAssignment.section} (${programName})`;
            }

            const departmentName = departments[teacher.department]?.name || '';
            const rankName = ranks[teacher.rank]?.rank || '';
            const additionalSchedules = teachers[teacher.id]?.additionalTeacherScheds || [];

            let ancillaryLoad = 0;
            let advisoryLoad = 0;

            additionalSchedules.forEach((sched) => {
                if (!sched.shown) {

                    if (!sched.shown && sched.name === 'Advisory Load') {
                        advisoryLoad += sched.duration * sched.frequency;
                    } else {
                        ancillaryLoad += sched.duration * sched.frequency;
                    }

                }
            });
            
            worksheet.addRow(['']);
            row++;

            // HEADER
            const header = ['Republic of the Philippines', 'DEPARTMENT OF EDUCATION', 'National Capital Region',
                'Schools of Division of Quezon City', 'BATASAN HILLS NATIONAL HIGH SCHOOL'
            ];

            let s = 0;
            for (let i = 2; i < 7; i++) {
                worksheet.addRow(['', '', '', header[s]]);
                worksheet.mergeCells(`D${i}:F${i}`);

                const cell = worksheet.getCell(`D${row}`);
                cell.alignment = { vertical: 'middle', horizontal: 'center' };

                row++;
                s++;
            }
            for (let x = 2; x < 7; x++) {
                const cell = worksheet.getCell(`D${x}`);
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }

            worksheet.addRow(['']);
            row= row + 2;

            // DEPARTMENT PROGRAM
            worksheet.addRow(['', '', '', `${departmentName} Teacher's Program`]);
            worksheet.mergeCells(`D${row}:F${row}`);
            worksheet.getRow(row).eachCell((cell) => {
                if (typeof cell.value === 'string') {
                    cell.value = cell.value.toUpperCase();
                }

                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { bold: true };
            });
            row++;

            // SCHOOL YEAR
            worksheet.addRow(['', '', '', '', 'S.Y. 2025 - 2026']);
            worksheet.getRow(row).eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { bold: true };
            });
            row++;

            // TEACHER NAME AND RANK
            let col = String.fromCharCode('B'.charCodeAt(0) + (selectedDays.length + 2 - 1));
            let start = columnLetterToNumber('B');
            let end = columnLetterToNumber(col);

            worksheet.addRow(['', `${teacherName} - ${rankName}`]);
            worksheet.mergeCells(`B${row}:${col}${row}`);
            
            for (let i = start; i <= end; i++) {
                const cellRef = worksheet.getRow(row).getCell(i);

                cellRef.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }

            const cell = worksheet.getCell(`B${row}`);
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.font = { bold: true };
            row++;

            // TABLE HEADERS
            col = String.fromCharCode('B'.charCodeAt(0) + (selectedDays.length + 2 - 1));
            start = columnLetterToNumber('B');
            end = columnLetterToNumber(col);

            worksheet.addRow(['', 'TIME', 'No. of Minutes', ...selectedDays]);
            for (let i = start; i <= end; i++) {
                const cellRef = worksheet.getRow(row).getCell(i);

                cellRef.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
            worksheet.getRow(row).eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { bold: true };
            });
            row++;

            worksheet.addRow(['']);
            for (let i = start; i <= end; i++) {
                const cellRef = worksheet.getRow(row).getCell(i);

                const border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                };

                if (i === start) {
                    border.left = { style: 'thin' };
                }
                if (i === end) {
                    border.right = { style: 'thin' };
                }

                cellRef.border = border;
            }
            row++;

            // **
            // ***************** HEADER *****************

            const timeslots = [];
            const startTimes = [];

            const sects = new Map();
            let nextKey = 0;

            const classBlocks = [];

            for (const [, value] of val.entries()) {
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
                    const timeslotValue = Array.from({ length: configurations[1].defaultNumberOfSchoolDays }, () => ({
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

            let totalTeacherLoad = 0;
            for (const [key, value] of normalizedTimeslots.entries()) {
                const backgroundColor = row % 2 === 0 ? 'FFF0FFFF' : 'FFF0F0F5';

                col = String.fromCharCode('B'.charCodeAt(0) + 1);
                start = columnLetterToNumber('B');
                end = columnLetterToNumber('C');

                worksheet.mergeCells(`B${row}:B${row + 2}`);
                worksheet.mergeCells(`C${row}:C${row + 2}`);

                worksheet.getCell(`B${row}`).value = key;
                worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet.getCell(`B${row}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: backgroundColor },
                };

                for (let i = start; i <= end; i++) {
                    const cellRef = worksheet.getRow(row).getCell(i);
    
                    cellRef.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }

                let column = 'D';
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

                    for (let r = row; r <= row + 2; r++) {
                        const cell = worksheet.getCell(`${column}${r}`);
                        cell.border = {
                            left: { style: 'thin' },
                            right: { style: 'thin' },
                        };

                        if (r === row) {
                            cell.border.top = { style: 'thin' };
                        }

                        if (r === row + 2) {
                            cell.border.bottom = { style: 'thin' };
                        }
                    }

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

                totalTeacherLoad += totalMinutes;

                worksheet.getCell(`C${row}`).value = totalMinutes;
                worksheet.getCell(`C${row}`).alignment = { vertical: 'middle', horizontal: 'center' };

                // Move to the next set of rows
                row += 3;
            }

            start = columnLetterToNumber('B');
            end = columnLetterToNumber('D');

            worksheet.addRow(['', 'Advisory Class', '', sectionDisplay]);
            worksheet.addRow(['', 'Ancillary Task Load', '', ancillaryLoad]);
            worksheet.addRow(['', 'Total No. of Minutes on Teaching Load', '', totalTeacherLoad]);
            worksheet.addRow(['', 'Advisory Task Load', '', advisoryLoad]);
            worksheet.addRow(['', 'Total No. of Minutes of Workload', '', ancillaryLoad + totalTeacherLoad + advisoryLoad]);

            for (let x = row; x < row + 5; x++) {
                for (let i = start; i <= end; i++) {
                    const cellRef = worksheet.getRow(x).getCell(i);
    
                    cellRef.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }

                worksheet.getCell(`B${x}`).alignment = { vertical: 'middle' };
                worksheet.getCell(`B${x}`).font = { bold: true };

                worksheet.getCell(`C${x}`).alignment = { vertical: 'middle', horizontal: 'right' };

                if (x === row + 4) worksheet.getCell(`D${x}`).font = { bold: true };

                worksheet.mergeCells(`B${x}:C${x}`);

            }
            row += 6;

            worksheet.addRow(['']);

            worksheet.getCell(`B${row}`).value = 'Prepared By:';
            worksheet.getCell(`F${row}`).value = 'Conforme:';

            worksheet.getCell(`B${row}`).alignment = { vertical: 'middle' };
            worksheet.getCell(`F${row}`).alignment = { vertical: 'middle' };

            worksheet.getCell(`B${row}`).font = { bold: true };
            worksheet.getCell(`F${row}`).font = { bold: true };

            row++;

            worksheet.mergeCells(`B${row}:D${row}`);
            worksheet.mergeCells(`F${row}:H${row}`);

            worksheet.getCell(`B${row}`).border = { bottom: { style: 'thin' }};
            worksheet.getCell(`F${row}`).border = { bottom: { style: 'thin' }};

            row++;

            worksheet.getCell(`C${row}`).value = 'Position';
            worksheet.getCell(`G${row}`).value = 'Position';

            worksheet.getCell(`C${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`G${row}`).alignment = { vertical: 'middle', horizontal: 'center' };

            worksheet.getCell(`C${row}`).font = { italic: true };
            worksheet.getCell(`G${row}`).font = { italic: true };

            row += 2;

            worksheet.getCell(`D${row}`).value = 'Approved By:';
            worksheet.getCell(`D${row}`).alignment = { vertical: 'middle' };
            worksheet.getCell(`D${row}`).font = { bold: true };

            row++;

            worksheet.mergeCells(`D${row}:F${row}`);
            worksheet.getCell(`D${row}`).border = { bottom: { style: 'thin' }};

            row++;

            worksheet.getCell(`E${row}`).value = 'Position';
            worksheet.getCell(`E${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`E${row}`).font = { italic: true };

            row++;

            // worksheet.addImage(DEPEDId, {
            //     tl: { col: 2.6, row: 1 },
            //     ext: { width: 100, height: 100 },
            // });

            // worksheet.addImage(schoolId, {
            //     tl: { col: 6, row: 1 },
            //     ext: { width: 100, height: 100 },
            // });

            // COLUMN WIDTH
            worksheet.getColumn(2).width = 20;
            worksheet.getColumn(3).width = 20;
            let startingCol = 4;
            for (let i = 0; i < configurations[1].defaultNumberOfSchoolDays; i++) {
                worksheet.getColumn(startingCol).width = 20;
                startingCol++;
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Teacher Schedules.xlsx');
    };

    const exportSectionScheds = async () => {

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

            console.log('sections: ', sections);

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

            const startColumn = 'B';
            const startColumn_2 = 'C';
            const endColumn = String.fromCharCode(66 + Number(configurations[1].defaultNumberOfSchoolDays));

            worksheet.mergeCells(`${startColumn}2:${endColumn}2`); // Section name cell
            worksheet.mergeCells(`${startColumn}3:${endColumn}3`); // Program name cell
            worksheet.mergeCells(`${startColumn}4:${startColumn}5`); // Time header label cell
            worksheet.mergeCells(`${startColumn_2}4:${endColumn}4`); // Day header label cell

            worksheet.getCell(`${startColumn}2`).value = sectionName;
            worksheet.getCell(`${startColumn}3`).value = programs[section.program]?.program || '';
            worksheet.getCell(`${startColumn}4`).value = 'TIME';
            worksheet.getCell(`${startColumn_2}4`).value = 'Day';

            worksheet.getCell(`${startColumn}2`).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell(`${startColumn}3`).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell(`${startColumn}4`).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell(`${startColumn_2}4`).alignment = { horizontal: 'center', vertical: 'middle' };

            worksheet.getCell(`${startColumn}2`).font = { bold: true, size: 14 };
            worksheet.getCell(`${startColumn}3`).font = { bold: true, size: 12 };
            worksheet.getCell(`${startColumn}4`).font = { bold: true };
            worksheet.getCell(`${startColumn_2}4`).font = { bold: true };

            worksheet.getCell(`${startColumn}2`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } ,bottom: { style: 'thin' } };
            worksheet.getCell(`${startColumn}3`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } ,bottom: { style: 'thin' } };
            worksheet.getCell(`${startColumn}4`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } ,bottom: { style: 'thin' } };
            worksheet.getCell(`${startColumn_2}4`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } ,bottom: { style: 'thin' } };

            // col = String.fromCharCode(startColumn.charCodeAt(0) + Number(configurations[1].defaultNumberOfSchoolDays));
            // start = columnLetterToNumber('B');
            // end = columnLetterToNumber(col);

            worksheet.getCell(`${startColumn}6`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } ,bottom: { style: 'thin' } };

            let column = 'C';
            for (let i = 0; i < configurations[1].defaultNumberOfSchoolDays; i++) {
                worksheet.getCell(`${column}5`).value = days[i];
                worksheet.getCell(`${column}6`).value = section.modality[i] === 1 ? 'ONSITE' : 'OFFSITE';

                worksheet.getCell(`${column}5`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell(`${column}6`).alignment = { horizontal: 'center', vertical: 'middle' };

                worksheet.getCell(`${column}5`).font = { bold: true };
                worksheet.getCell(`${column}6`).font = {
                    color: { argb: 'FFFFFFFF' },
                    bold: true,
                };

                worksheet.getCell(`${column}6`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: section.modality[i] === 1 ? 'FF006400' : 'FF8B0000' },
                };

                worksheet.getCell(`${column}5`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } ,bottom: { style: 'thin' } };
                worksheet.getCell(`${column}6`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } ,bottom: { style: 'thin' } };

                column = String.fromCharCode(column.charCodeAt(0) + 1);
            }

            // **
            // ***************** TEMPORARY *****************

            const timeslots = [];
            const startTimes = [];

            const sects = new Map();
            let nextKey = 0;

            const classBlocks = [];

            for (const [, value] of val.entries()) {
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
                    const timeslotValue = Array.from({ length: configurations[1].defaultNumberOfSchoolDays }, () => ({
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

            let row = 7;
            let counter = 0;
            for (const [key, value] of normalizedTimeslots.entries()) {
                const backgroundColor = counter % 2 === 0 ? 'FFF0FFFF' : 'FFF0F0F5';

                worksheet.mergeCells(`B${row}:B${row + 1}`);

                worksheet.getCell(`B${row}`).value = key;
                worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet.getCell(`B${row}`).font = { bold: true };
                worksheet.getCell(`B${row}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: backgroundColor },
                };

                worksheet.getCell(`B${row}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } ,bottom: { style: 'thin' } };

                let column = 'C';
                let mergedStartCell = null;
                let mergedEndCell = null;

                for (let i = 0; i < value.length; i++) {
                    const data = value[i];

                    let bgColor;

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

                    worksheet.getCell(`${column}${row}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
                    worksheet.getCell(`${column}${row + 1}`).border = { left: { style: 'thin' }, right: { style: 'thin' } ,bottom: { style: 'thin' } };

                    column = String.fromCharCode(column.charCodeAt(0) + 1);
                }

                // Move to the next set of rows
                row += 2;
                counter++;
            }

            worksheet.getCell(`B${row}`).value = 'Adviser';
            worksheet.getCell(`B${row + 1}`).value = 'Room';
            worksheet.getCell(`C${row}`).value = teacher;
            worksheet.getCell(`C${row + 1}`).value = room;

            worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`B${row + 1}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`C${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`C${row + 1}`).alignment = { vertical: 'middle', horizontal: 'center' };

            worksheet.getCell(`B${row}`).font = { bold: true };
            worksheet.getCell(`B${row + 1}`).font = { bold: true };
            worksheet.getCell(`C${row}`).font = { bold: true };
            worksheet.getCell(`C${row + 1}`).font = { bold: true };

            worksheet.getCell(`B${row}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
            worksheet.getCell(`B${row + 1}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
            worksheet.getCell(`C${row}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
            worksheet.getCell(`C${row + 1}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

            // COLUMN WIDTH
            let startingCol = 2;
            for (let i = 0; i < configurations[1].defaultNumberOfSchoolDays + 1; i++) {
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
            if (key.startsWith('Section:')) {
                sectionScheds.push({ [key]: value });
            } else if (key.startsWith('Teacher:')) {
                teacherScheds.push({ [key]: value });
            }
        });

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
