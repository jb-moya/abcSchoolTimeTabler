import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { convertToNumber } from '@utils/convertToNumber';
import { convertToTime } from '@utils/convertToTime';

import { fetchSubjects } from '@features/subjectSlice';
import { fetchTeachers } from '@features/teacherSlice';
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
    setItemWidth,
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
}) => {
    const itemRef = useRef(null);

    const [targetPosition, setTargetPosition] = useState(initialPosition);
    const [timeRange, setTimeRange] = useState(0);
    const [options, setOptions] = useState([]);
    // const { subjects, status: subjectStatus } = useSelector((state) => state.subject);
    const dispatch = useDispatch();

    const { teachers, status: teacherStatus } = useSelector((state) => state.teacher);
    const [errors, setErrors] = useState({});
    const [hovering, setHovering] = useState(false);

    // useEffect(() => {
    //     if (subjectStatus === 'idle') {
    //         dispatch(fetchSubjects());
    //     }
    // }, [subjectStatus, dispatch]);

    useEffect(() => {
        if (teacherStatus === 'idle') {
            dispatch(fetchTeachers());
        }
    }, [teacherStatus, dispatch]);

    const x = useMotionValue(initialPosition.x);
    const y = useMotionValue(initialPosition.y);

    // Update motion values when `initialPosition` changes

    useEffect(() => {
        if (itemRef.current) {
            const { width } = itemRef.current.getBoundingClientRect();
            setItemWidth(width);
        }
        setTimeRange(String(Math.round(((cell.end - cell.start + 0.5) / 2) * 2) / 2));
    }, [cell, setItemWidth]);

    useEffect(() => {
        // console.log('clicked');
        // console.log('add: ', addClicked);
        if (addClicked) {
            setEditingCell(null);
            setModalOpen(true);
            setTimeout(() => {
                document.getElementById('my_modal_2').showModal();
            }, 0);
        }
        // setAddClicked(false);
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
        // console.log('clicked: on', cell);
        // console.log('isDragging', isDragging);
        // console.log('modalOpen', modalOpen);

        if (isDragging || modalOpen) return;
        // console.log('clicked: on', cell);
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

            // Find the closest line and column
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

            // Set intermediate and final target positions
            const intermediatePosition = {
                x: closestColumn + offset,
                y: closestLine + offset,
            };
            setTargetPosition(intermediatePosition);
            setIsDragging(false);

            const initialStart = lineRowPositions.indexOf(closestLine);
            const start = getUpdatedStart(mode, initialStart);
            const day = lineColPositions.indexOf(closestColumn) + 1;
            // console.log('range: ', Number(timeRange));

            // console.log('range: ', Number(timeRange));
            // const end = start + Number(timeRange) * 2;
            // console.log('end: ', end);

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
        if (isDragging) return; // Prevent the effect from running while dragging

        setTargetPosition(initialPosition);
    }, [initialPosition, isDragging]); // Include isDragging in the dependency array

    // useEffect(() => {
    //     setOptions(getTeacherIdsBySubject(cell.subjectID));
    // }, [editMode]);

    function getTeacherIdsBySubject(subjectID) {
        return Object.values(teachers) // Convert the object to an array of teacher values
            .filter((teacher) => teacher.subjects.includes(subjectID)) // Filter by subjectID
            .map((teacher) => teacher.id); // Map to IDs
    }

    const handleTeacherSelection = (teacherID, teacher) => {
        setLoading(true);
        setModalOpen(false);

        setTimeout(() => {
            handleSwitchTeacher({ teacherID, teacher }, editingCell);
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

    const addSchedule = () => {
        console.log('added');
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
        return cellValue ? cellValue : 'NA';
    }, [cell.teacher, cell.section, cellValue]);
    return (
        <motion.div
            drag={!editMode} // Draggable only if editMode is false
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
                type: 'spring', // Use spring physics
                stiffness: 50, // Controls the rigidity of the spring
                damping: 15, // Controls the "bounciness" (lower = more bounce)
                mass: 1, // Affects inertia (higher = slower motion)
                restDelta: 1, // Minimum movement before stopping
            }}
            title={!modalOpen ? `${cell.teacher || ''} \n${cell.subject || ''}` : undefined}
        >
            {/* Hover Wrapper */}
            <div className='relative w-full h-full'>
                {/* Original Content */}
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

                {/* Edit Label */}
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
            {/* Hover State Management */}
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
                    setModalOpen={setModalOpen}
                    getTeacherIdsBySubject={getTeacherIdsBySubject}
                    errors={errors}
                    addSchedule={addSchedule}
                    setAddClicked={setAddClicked}
                />
            )}
        </motion.div>
    );
};

export default ItemCells;
