import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { convertToNumber } from '@utils/convertToNumber';
import { convertToTime } from '@utils/convertToTime';

import ScheduleDialog from './ScheduleDialog';

const ItemCells = ({
    containerRef,
    lineRowPositions,
    lineColPositions,
    cell,
    setHighlightedLine,
    setIsDragging,
    isDragging,
    initialPosition,
    mode,
    handleCellUpdate,
    scrollToTable,
    editMode,
    handleSwitchTeacher,
    setLoading,
    setModalOpen,
    modalOpen,
    setEditingCell,
    editingCell,
    addClicked,
    setAddClicked,
    handleAddTeacher,
    handleDeleteBlock,
    containerType,
    teachers,
    subjects,
    sections,
}) => {
    const itemRef = useRef(null);

    const [targetPosition, setTargetPosition] = useState(initialPosition);
    const [timeRange, setTimeRange] = useState(0);
    const [options, setOptions] = useState([]);
    const [errors, setErrors] = useState({});
    const [hovering, setHovering] = useState(false);

    const x = useMotionValue(initialPosition.x);
    const y = useMotionValue(initialPosition.y);

    useEffect(() => {
        setTimeRange(String(Math.round(((cell.end - cell.start + 0.5) / 2) * 2) / 2));
    }, [cell]);

    useEffect(() => {
        if (addClicked) {
            setEditingCell(null);
            setModalOpen(true);
            setTimeout(() => {
                document.getElementById('my_modal_2').showModal();
            }, 0);
        }
    }, [addClicked]);
    const getUpdatedStart = (mode, start) => {
        switch (mode) {
            case '5m':
                return start * 1;
            case '10m':
                return start * 2;
            case '20m':
                return start * 4;
            case '30m':
                return start * 6;
            case '60m':
                return start * 12;
            default:
                return null;
        }
    };

    const handleDragStart = (e) => {
        setIsDragging(true);
    };

    const handleClick = () => {
        if (isDragging || modalOpen) return;
        if (editMode && !modalOpen) {
            setEditingCell(cell);
            setModalOpen(true);
            setTimeout(() => {
                document.getElementById('my_modal_2').showModal();
            }, 0);
        } else {
            if (!cell.teacher && !cell.section) return;
            scrollToTable(cell);
        }
    };

    const handleDragEnd = () => {
        if (itemRef.current && !editMode) {
            const { width } = itemRef.current.getBoundingClientRect();

            const closestLine = lineRowPositions.reduce((prev, curr) => {
                const prevDiff = Math.abs(prev - y.get());
                const currDiff = Math.abs(curr - y.get());
                return currDiff < prevDiff ? curr : prev;
            });

            const closestColumn = lineColPositions.reduce((prev, curr) => {
                const prevDiff = Math.abs(prev - x.get());
                const currDiff = Math.abs(curr - x.get());
                return currDiff < prevDiff ? curr : prev;
            });

            const offset = 2;

            const intermediatePosition = {
                x: closestColumn + offset,
                y: closestLine + offset,
            };
            setTargetPosition(intermediatePosition);
            setIsDragging(false);

            const initialStart = lineRowPositions.indexOf(closestLine);
            const start = getUpdatedStart(mode, initialStart);
            const day = lineColPositions.indexOf(closestColumn) + 1;

            setTimeout(() => {
                setTargetPosition({ x: closestColumn + 1, y: closestLine });
            }, 10);

            handleCellUpdate({ start, day });
        }
    };

    useMotionValueEvent(y, 'change', (currentY) => {
        const closestLine = lineRowPositions.reduce((prev, curr) =>
            Math.abs(curr - currentY) < Math.abs(prev - currentY) ? curr : prev
        );
        setHighlightedLine(closestLine);
    });

    useEffect(() => {
        if (isDragging) return;

        setTargetPosition(initialPosition);
    }, [initialPosition, isDragging]);

    const handleTeacherSelection = (fieldID, fieldName, type) => {
        setLoading(true);
        setModalOpen(false);

        setTimeout(() => {
            if (type === 's') {
                handleSwitchTeacher({ teacherID: fieldID, teacher: fieldName }, editingCell);
            } else if (type === 't') {
                handleSwitchTeacher({ sectionID: fieldID, section: fieldName }, editingCell);
            }
        }, 0);
    };

    const handleStartChange = (time) => {
        const newErrors = {};
        const start = convertToNumber(time);

        if (start >= editingCell.end) {
            newErrors.time = 'Invalid Time Set';
            setErrors(newErrors);
        } else {
            handleCellUpdate({ start }, editingCell);
        }
        setErrors(newErrors);
    };

    const handleEndChange = (time) => {
        const newErrors = {};
        const end = convertToNumber(time);

        if (end <= editingCell.start) {
            newErrors.time = 'Invalid Time Set';
        } else {
            handleCellUpdate({ end }, editingCell);
        }
        setErrors(newErrors);
    };

    const addSchedule = (teacher, subject, start, end, addCheckbox, selectedDay) => {
        console.log('added');
        console.log('teacher: ', teacher);
        console.log('subject: ', subject);
        const updatedStart = convertToNumber(start);
        const updatedEnd = convertToNumber(end);
        console.log('start: ', start);

        console.log('end: ', end);
        console.log('addCheckbox: ', addCheckbox);
        console.log('selectedDay: ', selectedDay);

        for (const day of selectedDay) {
            handleAddTeacher(
                {
                    teacherID: teacher.teacherID,
                    teacher: teacher.teacher,
                    subjectID: subject.subjectID,
                    subject: subject.subject,
                    start: updatedStart,
                    end: updatedEnd,
                    day: day + 1,
                },
                addCheckbox
            );
        }

        setModalOpen(false);
    };

    const startTime = useMemo(() => {
        if (cell.start !== null && cell.start !== undefined) {
            return convertToTime(cell.start);
        }
        return 'NA';
    }, [cell.start]);

    const endTime = useMemo(() => {
        if (cell.end !== null && cell.end !== undefined) {
            return convertToTime(cell.end);
        }
        return 'MA';
    }, [cell.end]);
    const cellValue = useMemo(() => (cell.teacher ? cell.teacher : cell.section), [cell.teacher, cell.section]);
    const cellVal = useMemo(() => {
        if (cell.teacher === null && cell.subject === null) {
            return 'Break';
        }
        return cellValue ? cellValue : '';
    }, [cell.teacher, cell.section, cellValue]);
    return (
        <motion.div
            drag={!editMode}
            dragConstraints={containerRef}
            style={{
                height: `${timeRange}%`,
                width: '19%',
                x,
                y,
            }}
            className={`absolute border border-base-content border-opacity-50 ${
                cell.overlap ? 'border-red-400 bg-red-400 bg-opacity-40' : 'bg-base-200'
            } ${hovering ? 'border-blue-400' : ''} rounded-lg`}
            ref={itemRef}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onClick={handleClick}
            dragMomentum={false}
            dragElastic={0}
            animate={targetPosition}
            transition={{
                type: 'spring',
                stiffness: 50,
                damping: 15,
                mass: 1,
                restDelta: 1,
            }}
            title={!modalOpen ? `${cell.teacher || ''} \n${cell.subject || ''}` : undefined}
        >
            <div className='relative w-full h-full'>
                {!editMode || !hovering ? (
                    <motion.div
                        className='absolute inset-0 flex truncate flex-col justify-center items-center p-1 sm:text-[9px] md:text-[11px] lg:text-base text-base'
                        initial={{ opacity: 1 }}
                        animate={{ opacity: editMode && hovering ? 0 : 1 }}
                    >
                        <div className='font-medium overflow-hidden text-center'>{cellVal}</div>
                        <div className='text-center overflow-hidden'>{cell.subject}</div>
                        <div className='text-center text-[80%] overflow-hidden pt-0.5'>
                            {startTime} {endTime}
                        </div>
                    </motion.div>
                ) : null}

                {editMode && (
                    <motion.div
                        className='absolute inset-0 flex items-center justify-center text-primary font-medium'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: hovering ? 1 : 0 }}
                    >
                        Edit
                    </motion.div>
                )}
            </div>
            <div
                className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : hovering && !editMode ? 'cursor-grab' : ''}`}
                onMouseEnter={() => {
                    console.log('cells: ', cell);
                    setHovering(true);
                }}
                onMouseLeave={() => setHovering(false)}
            />
            {modalOpen && (
                <ScheduleDialog
                    editingCell={editingCell}
                    handleTeacherSelection={handleTeacherSelection}
                    handleStartChange={handleStartChange}
                    handleEndChange={handleEndChange}
                    handleDeleteBlock={handleDeleteBlock}
                    setModalOpen={setModalOpen}
                    errors={errors}
                    addSchedule={addSchedule}
                    setAddClicked={setAddClicked}
                    containerType={containerType}
                    teachers={teachers}
                    subjects={subjects}
                    sections={sections}
                />
            )}
        </motion.div>
    );
};

export default ItemCells;
