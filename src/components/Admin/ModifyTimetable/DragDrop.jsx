import React, { useEffect, useState } from 'react';
import ItemCells from './ItemCells';
import { produce } from 'immer';

const DragDrop = ({
    mode,
    value,
    tableHeight,
    timeSlots,
    setValueMap,
    tableKey,
    scrollToTable,
    editMode,
    setLoading,
    loading,
    addClicked,
    setAddClicked,
    containerType,
    teachers,
    subjects,
    sections,
}) => {
    const containerRef = React.useRef(null);
    const [lineRowPositions, setRowPositions] = useState([]);
    const [lineColPositions, setColPositions] = useState([]);
    const [originalRowPositions, setOriginalRowPositions] = useState([]);

    const [itemWidth, setItemWidth] = useState(null);
    const columns = 5;
    const [highlightedLine, setHighlightedLine] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCell, setEditingCell] = useState({});

    const handleCellUpdate = async (tableKey, cellId, newCardData, editingCell = null) => {
        let keyToFind = '';
        if (editingCell) {
            // console.log('has editing cell');
            tableKey = editingCell.tableKey;
            cellId = editingCell.dynamicID;
        }
        setValueMap((prevState) =>
            produce(prevState, (draft) => {
                // console.log('cellId:', cellId);
                // console.log('prevState:', prevState);
                // console.log('draft:', draft);
                // console.log('newCardData:', newCardData);
                // console.log('tableKey:', tableKey);

                const table = draft.get(tableKey);
                if (!table) {
                    console.error(`Table with key \"${tableKey}\" not found.`);
                    return;
                }

                const cell = table.get(cellId);
                if (!cell) {
                    console.error(`Cell with ID \"${cellId}\" not found in table \"${tableKey}\".`);
                    return;
                }

                // const partnerType =
                //     cell.type === 'teacher' ? 'section' : 'teacher';
                // keyToFind = cellId.replace(
                //     /(type-)([^-]+)/,
                //     `$1${partnerType}`
                // );
                keyToFind = cell.partnerKey;

                // console.log('keytoFind: ', keyToFind);
                const range = cell.end - cell.start;
                if (!editingCell) {
                    newCardData.end = newCardData.start + range;
                }
                // console.log('newCardData: ', newCardData);
                table.set(cellId, { ...cell, ...newCardData });
                if (editingCell) {
                    setEditingCell(table.get(cellId));
                }
                // console.log('Updated cell:', table.get(cellId));
            })
        );

        setValueMap((prevState) =>
            produce(prevState, (draft) => {
                for (const [currentTableKey, table] of draft.entries()) {
                    const cell = table.get(keyToFind);
                    if (cell) {
                        table.set(keyToFind, { ...cell, ...newCardData });
                        return;
                    }
                }

                console.error(`Key not found: ${keyToFind}`);
            })
        );
    };

    const isEqualProperties = (obj1, obj2) => {
        return Object.keys(obj1).every((key) => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]);
    };

    const handleDeleteBlock = (data, deleteCheckbox) => {
        console.log('data: ', data);
        console.log('deleteCheckbox: ', deleteCheckbox);
        setValueMap((prevState) =>
            produce(prevState, (draft) => {
                const table = draft.get(data.tableKey);
                if (!table) {
                    console.error(`Table with key \"${data.tableKey}\" not found.`);
                    return;
                }
                console.log('table:', table);

                const cell = table.get(data.id);
                console.log('cell:', cell);
                const isMatch = isEqualProperties(data, cell);

                console.log(isMatch ? '✅ data matches cell' : '❌ data does NOT match cell', { data, cell });
                if (isMatch) {
                    table.delete(data.id);
                }

                if (deleteCheckbox) {
                    const partnerType = data.type === 't' ? 's' : 't';
                    let partnerKey = data.partnerKey;
                    const stringType = partnerType === 't' ? 'Teacher' : 'Section';
                    const partnerContainer = data.type === 't' ? data.section : data.teacher;
                    console.log('partnerContainer: ', partnerContainer);
                    let targetTableKey = `${stringType}: ${partnerContainer}`; // Variable to store the matching tableKey
                    console.log('targetTableKey: ', targetTableKey);

                    const partnerTable = draft.get(targetTableKey);

                    if (!partnerTable) {
                        console.error(`Table with key \"${targetTableKey}\" not found.`);
                        return;
                    }

                    console.log('partnerKey: ', partnerKey);
                    partnerTable.delete(partnerKey);
                }

                // table.delete(cellDynamicID);
            })
        );
    };
    const handleAddTeacher = (newCardData, checkbox, cell) => {
        console.log('Addddeeeeddd: ', newCardData);
        console.log('checkbox: ', checkbox);
        console.log('cell: ', cell);

        setValueMap((prevState) =>
            produce(prevState, (draft) => {
                // console.log('cellId:', cellId);
                // console.log('prevState:', prevState);
                // console.log('draft:', draft);
                // console.log('newCardData:', newCardData);
                // console.log('tableKey:', tableKey);

                const table = draft.get(cell.tableKey);
                if (!table) {
                    console.error(`Table with key \"${cell.tableKey}\" not found.`);
                    return;
                }

                const validSectionID = cell.type === 't' ? newCardData.sectionID : cell.sectionID;
                const validTeacherID = cell.type === 's' ? newCardData.teacherID : cell.teacherID;
                let newObjectID = `${validSectionID ?? 'n'}-${validTeacherID ?? 'n'}-${newCardData.subjectID ?? 'n'}-${
                    newCardData.day ?? 'n'
                }-${cell.type}`;
                let duplicate = false;
                if (table.has(newObjectID)) {
                    // scheduleKey = `additional-section-${schedule.section}-teacher-${schedule.teacher}-subject-${schedule.subject}-day-${i}-type-${type}`;
                    duplicate = true;
                    scheduleKey = `a-${validSectionID ?? 'n'}-${validTeacherID ?? 'n'}-${newCardData.subjectID ?? 'n'}-${
                        newCardData.day ?? 'n'
                    }-${cell.type}`;
                }

                const partnerType = cell.type === 't' ? 's' : 't';
                let partnerKey = newObjectID.replace(/[^-]+$/, partnerType ?? 'n');

                table.set(newObjectID, {
                    day: newCardData.day,
                    end: newCardData.end,
                    start: newCardData.start,
                    id: newObjectID,
                    dynamicID: newObjectID,
                    sectionID: validSectionID,
                    subject: newCardData.subject,
                    subjectID: newCardData.subjectID,
                    tableKey: cell.tableKey,
                    partnerKey: partnerKey,
                    teacherID: validTeacherID,
                    type: cell.type,
                    containerName: cell.containerName,
                    additional: duplicate ? true : false,
                    overlap: false,
                    ...(cell.type === 't' && { section: newCardData.section }),
                    ...(cell.type === 's' && { teacher: newCardData.teacher }),
                });
                console.log('added cell:', table.get(newObjectID));

                if (checkbox) {
                    const stringType = partnerType === 't' ? 'Teacher' : 'Section';
                    const partnerContainer = cell.type === 't' ? newCardData.section : newCardData.teacher;
                    console.log('partnerContainer: ', partnerContainer);
                    let targetTableKey = `${stringType}: ${partnerContainer}`; // Variable to store the matching tableKey
                    console.log('targetTableKey: ', targetTableKey);

                    const partnerTable = draft.get(targetTableKey);

                    if (!partnerTable) {
                        console.error(`Table with key \"${targetTableKey}\" not found.`);
                        return;
                    }
                    let partnerDuplicate = false;

                    if (partnerTable.has(partnerKey)) {
                        // scheduleKey = `additional-section-${schedule.section}-teacher-${schedule.teacher}-subject-${schedule.subject}-day-${i}-type-${type}`;
                        partnerDuplicate = true;

                        partnerKey = `a-${validSectionID ?? 'n'}-${validTeacherID ?? 'n'}-${newCardData.subjectID ?? 'n'}-${
                            newCardData.day ?? 'n'
                        }-${partnerType}`;
                    }

                    partnerTable.set(partnerKey, {
                        day: newCardData.day,
                        end: newCardData.end,
                        start: newCardData.start,
                        id: partnerKey,
                        dynamicID: partnerKey,
                        sectionID: validSectionID,
                        subject: newCardData.subject,
                        subjectID: newCardData.subjectID,
                        tableKey: targetTableKey,
                        partnerKey: newObjectID,
                        teacherID: validTeacherID,
                        type: partnerType,
                        containerName: partnerContainer,
                        additional: partnerDuplicate ? true : false,
                        overlap: false,
                        ...(partnerType === 't' && { section: cell.containerName }),
                        ...(partnerType === 's' && { teacher: cell.containerName }),
                    });
                    console.log('added partner cell:', partnerTable.get(partnerKey));
                }
            })
        );
    };
    const handleSwitchTeacher = (tableKey, cellDynamicID, newCardData) => {
        console.log('newCardData: ', newCardData);
        let keyToFind = '';

        setValueMap((prevState) =>
            produce(prevState, (draft) => {
                // console.log('cellDynamicID:', cellDynamicID);
                // console.log('prevState:', prevState);
                // console.log('draft:', draft);
                // console.log('tableKey:', tableKey);

                const table = draft.get(tableKey);
                if (!table) {
                    console.error(`Table with key \"${tableKey}\" not found.`);
                    return;
                }

                const cell = table.get(cellDynamicID);
                if (!cell) {
                    console.error(`Cell with ID \"${cellDynamicID}\" not found in table \"${tableKey}\".`);
                    return;
                }

                const newObject = {
                    day: 0,
                    end: 0,
                    start: 0,
                    id: '',
                    dynamicID: '',
                    sectionID: 0,
                    subject: '',
                    subjectID: 0,
                    tableKey: '',
                    partnerKey: '',
                    teacherID: 0,
                    type: '',
                    containerName: '',
                    ...(cell.type === 't' ? { teacher: '' } : { section: '' }),
                };

                console.log('cell.type: ', cell.type);
                newObject.day = cell.day;
                newObject.start = cell.start;
                newObject.end = cell.end;
                newObject.subject = cell.subject;
                newObject.subjectID = cell.subjectID;
                newObject.teacherID = newCardData.teacherID;
                newObject.sectionID = cell.sectionID;
                newObject.type = cell.type === 's' ? 't' : 's';
                // newObject.containerName = cell.containerName;

                // let newObjectID = `section-${cell.sectionID}-teacher-${newCardData.teacherID}-subject-${cell.subjectID}-day-${cell.day}-type-teacher`;
                let newObjectID = `${cell.sectionID ?? 'n'}-${newCardData.teacherID ?? 'n'}-${cell.subjectID ?? 'n'}-${
                    cell.day ?? 'n'
                }-${cell.type === 's' ? 't' : 's'}`;

                // let currCellNewID = `section-${cell.sectionID}-teacher-${newCardData.teacherID}-subject-${cell.subjectID}-day-${cell.day}-type-${cell.type}`;
                let currCellNewID = `${cell.sectionID ?? 'n'}-${newCardData.teacherID ?? 'n'}-${cell.subjectID ?? 'n'}-${
                    cell.day ?? 'n'
                }-${cell.type ?? 'n'}`;

                if (cell.additional) {
                    // newObjectID = `additional-section-${cell.sectionID}-teacher-${newCardData.teacherID}-subject-${cell.subjectID}-day-${cell.day}-type-teacher`;
                    newObjectID = `a-${cell.sectionID ?? 'n'}-${newCardData.teacherID ?? 'n'}-${cell.subjectID ?? 'n'}-${
                        cell.day ?? 'n'
                    }-${cell.type === 's' ? 't' : 's'}`;

                    // currCellNewID = `additional-section-${cell.sectionID}-teacher-${newCardData.teacherID}-subject-${cell.subjectID}-day-${cell.day}-type-${cell.type}`;
                    currCellNewID = `a-${cell.sectionID ?? 'n'}-${newCardData.teacherID ?? 'n'}-${cell.subjectID ?? 'n'}-${
                        cell.day ?? 'n'
                    }-${cell.type ?? 'n'}`;
                }

                newObject.id = newObjectID;
                newObject.dynamicID = newObjectID;

                const partnerType = cell.type === 't' ? 's' : 't';
                // keyToFind = cellDynamicID.replace(/(type-)([^-]+)/, `$1${partnerType}`);
                keyToFind = cellDynamicID.replace(/[^-]+$/, partnerType[0] ?? 'n');

                const newObjPartnerKeyType = cell.type === 's' ? 's' : 't';
                // let newObjPartnerKey = newObjectID.replace(/(type-)([^-]+)/, `$1${newObjPartnerKeyType}`);
                let newObjPartnerKey = newObjectID.replace(/[^-]+$/, newObjPartnerKeyType[0] ?? 'n');

                // console.log('keytoFind: ', keyToFind);

                newObject.partnerKey = newObjPartnerKey;

                newCardData.dynamicID = currCellNewID;
                newCardData.partnerKey = newObjectID;
                // console.log('newCardData: ', newCardData);
                console.log('deleted cell:', table.get(cellDynamicID));
                table.delete(cellDynamicID);

                table.set(currCellNewID, { ...cell, ...newCardData });

                // console.log('Updated cell:', table.get(currCellNewID));

                draft.forEach((iterTable, iterTableKey) => {
                    const targetCell = iterTable.get(keyToFind);
                    if (targetCell) {
                        console.log('targetCell: ', targetCell.id);
                        console.log('targetCell containerName: ', targetCell.containerName);

                        if ('section' in newObject) {
                            console.log('targetCell section: ', targetCell.section);

                            newObject.section = targetCell?.section;
                        }
                        if ('teacher' in newObject) {
                            console.log('targetCell teacher: ', targetCell.teacher);

                            newObject.teacher = targetCell?.teacher;
                        }
                        // console.log(
                        //     `Deleting cell "${keyToFind}" from table "${iterTableKey}"`
                        // );
                        iterTable.delete(keyToFind);
                    }
                });

                // let targetTableKey = '';

                // draft.forEach((iterTable) => {
                //     const firstKey = iterTable.keys().next().value; // Get the first key
                //     if (!firstKey) return; // Skip if the Map is empty

                //     const targetCell = iterTable.get(firstKey); // Get the first value using the key

                //     // Check if teacherID matches targetTeacherID
                //     if (targetCell.teacherID !== newCardData.teacherID) return; // Skip to the next iterTable if no match
                //     // console.log('targetCell: ', iterTable);
                //     targetTableKey = targetCell.tableKey; // Assign the matching tableKey
                //     newObject.containerName = targetCell?.containerName;

                // });

                const stringType = partnerType === 't' ? 'Teacher' : 'Section';
                const partnerContainer = cell.type === 't' ? newCardData.section : newCardData.teacher;
                console.log('partnerContainer: ', partnerContainer);
                let targetTableKey = `${stringType}: ${partnerContainer}`; // Variable to store the matching tableKey
                console.log('targetTableKey: ', targetTableKey);

                const partnerTable = draft.get(targetTableKey);

                if (!partnerTable) {
                    console.error(`Table with key \"${targetTableKey}\" not found.`);
                    return;
                }
                let partnerDuplicate = false;

                if (partnerTable.has(newObjPartnerKey)) {
                    // scheduleKey = `additional-section-${schedule.section}-teacher-${schedule.teacher}-subject-${schedule.subject}-day-${i}-type-${type}`;
                    console.log('HAS DUP');

                    partnerDuplicate = true;

                    newObjPartnerKey = 'a-' + newObjPartnerKey;
                }
                newObject.additional = partnerDuplicate;
                newObject.containerName = partnerTable.containerName;

                newObject.tableKey = targetTableKey;

                const newTable = draft.get(targetTableKey);

                if (!newTable) {
                    console.error(`Table with key \"${targetTableKey}\" not found.`);
                    return;
                }

                newTable.set(newObjectID, newObject);
                // console.log('new table:', newTable);
                console.log('added cell:', newTable.get(newObjectID));
            })
        );
        setLoading(false);
    };

    const getLinesPerSegment = (mode) => {
        switch (mode) {
            case '5m':
                return 11;
            case '10m':
                return 5;
            case '20m':
                return 2;
            case '30m':
                return 1;
            case '60m':
                return 0;
            default:
                return 0;
        }
    };

    const linesPerSegment = getLinesPerSegment(mode);
    const containerHeight = tableHeight;
    const rows = Array.from({ length: timeSlots.length });
    const segmentHeight = containerHeight / rows.length;
    const subLineHeight = segmentHeight / (linesPerSegment + 1);

    const updateColumnPositions = async () => {
        if (containerRef.current) {
            const { width } = containerRef.current.getBoundingClientRect();
            const columnWidth = width / columns;
            const midpoints = Array.from({ length: columns }, (_, index) => {
                const columnLeft = index * columnWidth + 2;
                return columnLeft;
            });
            setColPositions(midpoints);
        }
    };

    useEffect(() => {
        const initializePositions = () => {
            // console.log('mode: ', mode);
            const newLinePositions = [];
            rows.forEach((_, index) => {
                const basePosition = index * segmentHeight;
                newLinePositions.push(basePosition);
                for (let i = 1; i <= linesPerSegment; i++) {
                    newLinePositions.push(basePosition + i * subLineHeight);
                }
            });

            if (originalRowPositions.length === 0 && mode === '5m') {
                setOriginalRowPositions(newLinePositions);
            }
            // console.log('row newLinePositions: ', newLinePositions);

            setRowPositions(newLinePositions);

            updateColumnPositions();
        };

        initializePositions();
    }, [mode, timeSlots, rows.length, segmentHeight, subLineHeight, columns]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            updateColumnPositions();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div className='flex-1 gap-5 w-full'>
            <div ref={containerRef} className='h-full w-full relative overflow-hidden'>
                {loading ? (
                    <div className='flex items-center justify-center h-full'>
                        <span className='loading loading-spinner loading-lg'></span>
                    </div>
                ) : (
                    <>
                        {rows.map((_, index) => {
                            const segmentHeight = tableHeight / rows.length;
                            const subLineHeight = segmentHeight / (linesPerSegment + 1);
                            return (
                                <React.Fragment key={index}>
                                    <div
                                        className={`absolute top-0 left-0 w-full border-b ${
                                            highlightedLine === (index + 1) * segmentHeight && isDragging
                                                ? 'border-blue-500 border-b-8'
                                                : 'border-base-content border-opacity-30 border-b-2'
                                        }`}
                                        style={{
                                            height: segmentHeight,
                                            top: `${index * segmentHeight}px`,
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    {Array.from({
                                        length: linesPerSegment,
                                    }).map((_, subIndex) => {
                                        const subLinePosition = index * segmentHeight + subIndex * subLineHeight;
                                        return (
                                            <div
                                                key={`sub-${index}-${subIndex}`}
                                                className={`absolute top-0 left-0 w-full border-b border-dashed border-opacity-25 ${
                                                    highlightedLine === index * segmentHeight + (subIndex + 1) * subLineHeight &&
                                                    isDragging
                                                        ? 'border-blue-500'
                                                        : 'border-base-content'
                                                }`}
                                                style={{
                                                    height: subLineHeight,
                                                    top: `${subLinePosition}px`,
                                                    pointerEvents: 'none',
                                                    zIndex: 0,
                                                }}
                                            />
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                        {Array.from({ length: columns }).map((_, colIndex) => {
                            const columnWidth = 100 / columns;
                            return (
                                <div
                                    key={`col-${colIndex}`}
                                    className='absolute top-0 h-full border-l border-dashed border-gray-400'
                                    style={{
                                        left: `${colIndex * columnWidth}%`,
                                        width: 0,
                                        pointerEvents: 'none',
                                        zIndex: 0,
                                    }}
                                />
                            );
                        })}
                        {lineRowPositions.length > 0 &&
                            lineColPositions.length > 0 &&
                            Array.from(value.entries()).map(([key, cell], index) => {
                                // console.log(originalRowPositions[cell.start]);

                                const pos = {
                                    x: lineColPositions[cell.day - 1],
                                    y: originalRowPositions[cell.start],
                                };

                                return (
                                    <ItemCells
                                        key={index}
                                        cell={cell}
                                        containerRef={containerRef}
                                        lineRowPositions={lineRowPositions}
                                        lineColPositions={lineColPositions}
                                        setHighlightedLine={setHighlightedLine}
                                        setIsDragging={setIsDragging}
                                        isDragging={isDragging}
                                        initialPosition={pos}
                                        mode={mode}
                                        setItemWidth={setItemWidth}
                                        handleCellUpdate={(newCardData, editingCell) => {
                                            handleCellUpdate(tableKey, cell.dynamicID, newCardData, editingCell);
                                        }}
                                        scrollToTable={scrollToTable}
                                        editMode={editMode}
                                        handleSwitchTeacher={(newCardData, cellChanged) => {
                                            console.log('cell log: ', cellChanged);
                                            handleSwitchTeacher(cellChanged.tableKey, cellChanged.dynamicID, newCardData);
                                        }}
                                        setLoading={setLoading}
                                        setModalOpen={setModalOpen}
                                        modalOpen={modalOpen}
                                        setEditingCell={setEditingCell}
                                        editingCell={editingCell}
                                        addClicked={addClicked}
                                        setAddClicked={setAddClicked}
                                        handleAddTeacher={(newCardData, checkbox) => {
                                            handleAddTeacher(newCardData, checkbox, cell);
                                        }}
                                        handleDeleteBlock={handleDeleteBlock}
                                        containerType={containerType}
                                        teachers={teachers}
                                        subjects={subjects}
                                        sections={sections}
                                    />
                                );
                            })}
                    </>
                )}
            </div>
        </div>
    );
};

export default DragDrop;
