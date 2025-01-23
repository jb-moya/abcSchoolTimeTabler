import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DragDrop from './DragDrop(FOR DELETE)';
import { generateTimeSlots } from './utils';
import { produce } from 'immer';
import { PiConfetti } from 'react-icons/pi';
import { deployTimetable } from '../../features/deployTimetable';

import { addSched, fetchScheds } from '@features/schedulesSlice';

const ForTest = ({ hashMap }) => {
    const dispatch = useDispatch();
    const inputNameRef = useRef();

    const { schedules, status: schedStatus } = useSelector((state) => state.schedule);

    const [scheduleVerName, setScheduleVerName] = useState('');

    useEffect(() => {
        if (schedStatus === 'idle') {
            dispatch(fetchScheds());
        }
    }, [schedStatus, dispatch]);

    const [selectedModeValue, setSelectedModeValue] = useState('5m');

    const [valueMap, setValueMap] = useState(hashMap);

    const handleSelectChange = (event) => {
        setSelectedModeValue(event.target.value);
    };

    const tableRefs = useRef({}); // Make sure this initializes as an object
    const [history, setHistory] = useState([new Map()]); // history stack (array of Maps)
    const [historyIndex, setHistoryIndex] = useState(0); // current position in history
    const isUndoRedo = useRef(false);
    const renderCount = useRef(0); // Track render count
    const [paginatedValueMap, setPaginatedValueMap] = useState(new Map()); // Store paginated data in state
    const [search, setSearch] = useState('');
    const [searchField, setSearchField] = useState('');
    const [errorCount, setErrorCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [addClicked, setAddClicked] = useState(false);
    const [overlapsDisplay, setOverlapsDisplay] = useState([]);

    const [timeSlots, setTimeSlots] = useState([]);
    const [tableHeight, setTableHeight] = useState(0);
    const [tableWidth, setTableWidth] = useState(0);
    const [currentPage, setCurrentPage] = useState(1); // State to track the current page
    const [itemsPerPage, setItemsPerPage] = useState(1); // Default items per page
    const totalPages = Math.ceil(valueMap.size / itemsPerPage);
    const [pageNumbers, setPageNumbers] = useState([]); // State for page numbers
    const [editMode, setEditMode] = useState(false); // State for page numbers

    const generatePageNumbers = (filtered) => {
        const pages = [];
        const pageCount = Math.ceil(filtered.size / itemsPerPage); // Calculate total pages based on filtered data

        // console.log("check: ", pageCount);

        // If there are fewer than or equal to 6 pages, just add all pages
        if (pageCount <= 6) {
            for (let i = 1; i <= pageCount; i++) {
                pages.push(i);
            }
        } else {
            // Add first page
            pages.push(1);

            // If the current page is near the beginning, show the next 2 pages
            if (currentPage <= 3) {
                for (let i = 2; i <= 3; i++) {
                    pages.push(i);
                }
            } else if (currentPage >= pageCount - 2) {
                // If the current page is near the end, show the previous 2 pages
                for (let i = pageCount - 2; i <= pageCount - 1; i++) {
                    pages.push(i);
                }
            } else {
                // Add previous page
                pages.push(currentPage - 1);

                // Add current page
                pages.push(currentPage);

                // Add next page
                pages.push(currentPage + 1);
            }

            // Add ellipsis (null)
            pages.push(null);

            // Add last page
            pages.push(pageCount);
        }
        // console.log('pages: ', pages);
        return pages;
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const undo = () => {
        if (historyIndex > 1) {
            isUndoRedo.current = true; // Indicate this is an undo action
            setHistoryIndex((prevIndex) => prevIndex - 1); // Move back in history
            setValueMap(new Map(history[historyIndex - 1])); // Set valueMap to the previous state
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            isUndoRedo.current = true; // Indicate this is a redo action
            setHistoryIndex((prevIndex) => prevIndex + 1); // Move forward in history
            setValueMap(new Map(history[historyIndex + 1])); // Set valueMap to the next state
        }
    };

    const save = () => {
        function mapToObject(map) {
            if (!(map instanceof Map)) return map;

            return Object.fromEntries(Array.from(map.entries()).map(([key, value]) => [key, mapToObject(value)]));
        }

        console.log('saved');
        console.log('valueMap: ', valueMap);

        if (!scheduleVerName.trim()) {
            alert('Please enter a version name');
            return;
        }

        const duplicateScheduleName = Object.values(schedules).find(
            (schedule) => schedule.name.trim().toLowerCase() === scheduleVerName.trim().toLowerCase()
        );

        if (duplicateScheduleName) {
            alert('A schedule with this name already exists');
            return;
        } else {
            const schedObject = mapToObject(valueMap);

            dispatch(
                addSched({
                    name: scheduleVerName,
                    data: schedObject,
                })
            );

            document.getElementById('confirm_schedule_save_modal').close();
        }
    };

    const deploy = async () => {
        deployTimetable(valueMap);
    };

    const clear = () => {
        console.log('clear');
        setCurrentPage(1);
        setSearch('');
        setSearchField('');
    };

    const add = () => {
        setAddClicked(true);
        console.log('add');
    };

    useEffect(() => {
        const overlaps = detectOverlaps(valueMap);
        console.log('overlaps', overlaps);
        setOverlapsDisplay(overlaps);
        const resolvedMap = updateOverlapFields(overlaps);
        // console.log('resolvedmap: ', resolvedMap);
        setValueMap(resolvedMap);

        if (!deepEqualMaps(history[historyIndex], valueMap)) {
            const newHistory = history.slice(0, historyIndex + 1); // Remove future history if undo/redo happened
            if (overlaps.length > 0) {
                setHistory([...newHistory, new Map(resolvedMap)]); // Add current valueMap to history
            } else {
                setHistory([...newHistory, new Map(valueMap)]); // Add current valueMap to history
            }
            setHistoryIndex((prevIndex) => prevIndex + 1); // Update the history index
        }

        isUndoRedo.current = false; // Reset the flag
        // console.log('overlaps: ');
    }, [valueMap]);

    function deepEqualMaps(map1, map2) {
        if (map1 === map2) return true;

        if (!(map1 instanceof Map) || !(map2 instanceof Map)) return false;

        if (map1.size !== map2.size) return false;

        for (let [key, value] of map1) {
            if (!map2.has(key)) return false;

            const value2 = map2.get(key);
            if (value instanceof Map && value2 instanceof Map) {
                if (!deepEqualMaps(value, value2)) return false;
            } else if (JSON.stringify(value) !== JSON.stringify(value2)) {
                return false;
            }
        }

        return true;
    }

    function detectOverlaps(valueMap) {
        const overlappingCells = [];

        for (const [tableKey, table] of valueMap.entries()) {
            const dayMap = new Map();

            for (const [cellKey, cell] of table.entries()) {
                if (!dayMap.has(cell.day)) {
                    dayMap.set(cell.day, []);
                }
                dayMap.get(cell.day).push({ ...cell, cellKey });
            }

            for (const [day, cells] of dayMap.entries()) {
                cells.sort((a, b) => a.start - b.start);

                for (let i = 0; i < cells.length - 1; i++) {
                    const currentCell = cells[i];
                    const nextCell = cells[i + 1];

                    if (currentCell.end > nextCell.start) {
                        // console.log('overlap1 : ', currentCell);
                        // console.log('overlap2 : ', nextCell);

                        currentCell.overlap = true;
                        nextCell.overlap = true;

                        const currentKey = [tableKey, currentCell.cellKey, currentCell.type];
                        const nextKey = [tableKey, nextCell.cellKey, nextCell.type];

                        if (!overlappingCells.some(([t, c]) => t === tableKey && c === currentCell.cellKey)) {
                            overlappingCells.push(currentKey);
                        }
                        if (!overlappingCells.some(([t, c]) => t === tableKey && c === nextCell.cellKey)) {
                            overlappingCells.push(nextKey);
                        }
                    }
                }
            }
        }
        // console.log('overlappingCells: ', overlappingCells);
        const additionalOverlaps = [];

        // Iterate over overlappingCells to find duplicates and push the matching ones
        if (overlappingCells.length > 0) {
            for (const [tableKey, table] of valueMap.entries()) {
                for (const [overlapTableKey, overlapCellKey] of overlappingCells) {
                    // const partnerType =
                    //     valueMap.get(overlapTableKey).get(overlapCellKey)
                    //         .type === 'teacher'
                    //         ? 'section'
                    //         : 'teacher';
                    // const keyToFind = overlapCellKey.replace(
                    //     /(type-)([^-]+)/,
                    //     `$1${partnerType}`
                    // );
                    const keyToFind = valueMap.get(overlapTableKey).get(overlapCellKey).partnerKey;

                    const cell = table.get(keyToFind); // Use cellId directly to access the cell in each table
                    if (cell) {
                        const currentKey = [tableKey, cell.dynamicID, cell.type];
                        if (!overlappingCells.some(([t, c]) => t === tableKey && c === cell.dynamicID)) {
                            additionalOverlaps.push(currentKey);
                        }
                    }
                }
            }
        }
        // Push the additional overlaps to the main array
        overlappingCells.push(...additionalOverlaps);
        setErrorCount(overlappingCells.length);
        // console.log('overlappingCells: ', overlappingCells);
        return overlappingCells;
    }

    const updateOverlapFields = (overlapKeys) => {
        // Create a new copy and return it
        return produce(valueMap, (draft) => {
            // Create a Set for the keys of the overlap keys for quick lookup
            const overlapKeySet = new Set(overlapKeys.map(([tableKey, cellKey]) => `${tableKey}:${cellKey}`));

            // Iterate through each table in the draft
            for (let [tableKey, table] of draft.entries()) {
                // Iterate through each cell in the table
                for (let [cellKey, cell] of table.entries()) {
                    // If the cell has overlap set to true, and it's not in the overlapKeys, set it to false
                    if (cell.overlap && !overlapKeySet.has(`${tableKey}:${cellKey}`)) {
                        const updatedCell = { ...cell, overlap: false };
                        table.set(cellKey, updatedCell);
                    }
                }
            }

            // Now, update the overlap values for cells present in overlapKeys
            for (let [tableKey, cellKey] of overlapKeys) {
                const table = draft.get(tableKey);

                if (!table) {
                    console.error(`Table with key "${tableKey}" not found.`);
                    continue;
                }

                const cell = table.get(cellKey);
                if (!cell) {
                    console.error(`Cell with ID "${cellKey}" not found in table "${tableKey}".`);
                    continue;
                }

                // If the cell does not already have an overlap, update it
                if (!cell.overlap) {
                    // Clone the cell and set the overlap property
                    const updatedCell = { ...cell, overlap: true };
                    table.set(cellKey, updatedCell); // Safely update the table
                    // console.log('Updated cell in overlap:', table.get(cellKey));
                }
            }
        });
    };

    const scrollToTable = (cell) => {
        let targetTableId = null;

        for (let [tableKey, table] of valueMap) {
            // console.log('tableKey: ', tableKey);
            // console.log('table: ', table);

            // const partnerType = cell.type === 'teacher' ? 'section' : 'teacher';
            // const keyToFind = cell.dynamicID.replace(
            //     /(type-)([^-]+)/,
            //     `$1${partnerType}`
            // );
            const keyToFind = cell.partnerKey;
            // console.log('keyToFind: ', keyToFind);
            const targetCell = table.get(keyToFind);

            if (targetCell) {
                targetTableId = targetCell.tableKey;
                setCurrentPage(1);
                setSearch(targetTableId);
                setSearchField(targetTableId);
                break;
            }
        }
        if (!targetTableId) {
            console.error('No table found');
        }
    };

    const Column = () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri'];
        return (
            <div className='flex'>
                <div className='min-w-[105px] max-w-[105px] border border-base-content border-opacity-20 text-center font-bold'>
                    Time
                </div>
                <div className='w-full flex border border-base-content border-opacity-20'>
                    {days.map((day, index) => (
                        <div
                            key={`header-${index}`}
                            className='border-r border-base-content border-opacity-20 flex-1 text-center font-bold'
                        >
                            {day}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    useEffect(() => {
        const updatePaginatedValueMap = () => {
            const filteredValueMap = new Map(
                Array.from(valueMap.entries()).filter(([key, value]) => key.toLowerCase().includes(searchField.toLowerCase()))
            );

            if (filteredValueMap.size < 1) return;

            const validCurrentPage = Math.min(currentPage, totalPages);
            setCurrentPage(validCurrentPage);

            // console.log('valueMap: ', valueMap);
            // console.log('filteredValueMap: ', filteredValueMap);

            // // Calculate the paginated items
            // console.log('currentPage: ', currentPage);
            let curpage = null;
            if (currentPage === 0) {
                curpage = 1;
            } else {
                curpage = currentPage;
            }
            const start = (curpage - 1) * itemsPerPage;
            const end = curpage * itemsPerPage;

            // Slice the filtered map to get the correct range
            const newPaginatedValueMap = new Map(Array.from(filteredValueMap.entries()).slice(start, end));
            // console.log('start: ', start);
            // console.log('end: ', end);

            // console.log('newPaginatedValueMap: ', newPaginatedValueMap);

            setPaginatedValueMap(newPaginatedValueMap);

            const updatedPageNumbers = generatePageNumbers(filteredValueMap);
            setPageNumbers(updatedPageNumbers);
        };
        updatePaginatedValueMap();
    }, [currentPage, itemsPerPage, valueMap, searchField]);

    const handleInputChange = (event) => {
        setSearch(event.target.value);
    };

    const handleSearch = () => {
        setSearchField(search);
    };

    useEffect(() => {
        setValueMap(hashMap);
    }, [hashMap]);

    useEffect(() => {
        const startTime = localStorage.getItem('morningStartTime') || '08:00 PM';
        const endTime = '08:00 PM';

        const slots = generateTimeSlots(startTime, endTime, 60); // You can change the interval here
        const tableHeight = Math.round(110.625 * slots.length);
        // console.log(slots)
        setTimeSlots(slots);
        setTableHeight(tableHeight);

        const overlaps = detectOverlaps(valueMap);
        // console.log('overlaps', overlaps);
        const resolvedMap = updateOverlapFields(overlaps);
        // console.log('resolvedmap: ', resolvedMap);
        setValueMap(resolvedMap);
    }, []);

    const handleErrorClick = () => {
        const modal = document.getElementById('my_modal_3');
        if (modal) {
            modal.showModal();
        }
    };

    const handleButtonErrorClick = (error) => {
        setCurrentPage(1);
        setSearch(error);
        setSearchField(error);
    };

    return (
        Array.from(paginatedValueMap.entries()).length > 0 && (
            <div className='overflow-hidden select-none'>
                <div className='flex flex-row space-x-5 justify-end pt-10 pr-5'>
                    <div className='pagination-buttons join justify-between items-center'>
                        <div className='min-w-[310px] flex flex-grow mr-5'>
                            <button
                                className='join-item btn flex-grow'
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                «
                            </button>
                            {pageNumbers.map((page, index) => (
                                <button
                                    key={index}
                                    className={`join-item btn flex-grow ${currentPage === page ? 'btn-active' : ''} ${
                                        page === null ? 'btn-disabled' : ''
                                    }`}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page || '...'}
                                </button>
                            ))}
                            <button
                                className='join-item btn flex-grow'
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pageNumbers[pageNumbers.length - 1]}
                            >
                                »
                            </button>
                        </div>

                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className='min-w-20 p-2 border border-primary-content rounded-lg bg-primary-content text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            {[1, 5, 10, 20, 50].map((count) => (
                                <option key={count} value={count}>
                                    {count} per page
                                </option>
                            ))}
                        </select>
                    </div>
                    <label className='input input-bordered flex-grow flex items-center gap-2'>
                        <input
                            type='text'
                            className='grow w-full'
                            placeholder='Search'
                            value={search}
                            onChange={handleInputChange}
                        />
                        <svg
                            onClick={handleSearch}
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 16 16'
                            fill='currentColor'
                            className='h-4 w-4 opacity-70 cursor-pointer'
                        >
                            <path
                                fillRule='evenodd'
                                d='M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z'
                                clipRule='evenodd'
                            />
                        </svg>
                    </label>
                    <button onClick={clear} className='btn btn-secondary' disabled={!searchField}>
                        Clear
                    </button>
                </div>

                {/* Modal */}
                <dialog id='my_modal_3' className='modal'>
                    <div className='modal-box'>
                        <form method='dialog'>
                            <button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'>✕</button>
                            <h3 className='font-bold text-lg mb-4'>Error Details</h3>
                            <div className='flex flex-col space-y-4'>
                                {overlapsDisplay.length > 0 ? (
                                    Object.entries(
                                        overlapsDisplay.reduce((acc, [error, something, type]) => {
                                            const key = `${error}-${type}`; // Use both error and type as a unique key
                                            if (!acc[key]) {
                                                acc[key] = { count: 0, error, type };
                                            }
                                            acc[key].count += 1; // Increment the count
                                            return acc;
                                        }, {})
                                    ).map(([key, { error, type, count }], index) => (
                                        <button
                                            key={index}
                                            className='btn capitalize'
                                            onClick={() => handleButtonErrorClick(error)}
                                        >
                                            {error} (Error: {count})
                                        </button>
                                    ))
                                ) : (
                                    <div className='flex justify-center gap-2 items-center'>
                                        <span className='text-xl'>No errors found!</span>
                                        <span className='flex'>
                                            <PiConfetti className='text-2xl text-primary' />
                                            <PiConfetti className='text-2xl text-secondary' />
                                            <PiConfetti className='text-2xl text-accent' />
                                        </span>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </dialog>

                <div className='flex flex-row items-center justify-between pt-10 px-5'>
                    <button
                        className='btn btn-outline flex-row items-center justify-center cursor-pointer'
                        onClick={handleErrorClick}
                    >
                        <span className=''>Status:</span>

                        <div className={`badge ${errorCount === 0 ? 'badge-success' : 'badge-error'} gap-2`}>
                            {errorCount === 0 ? 'Verified' : `Error ${errorCount}`}
                        </div>
                    </button>

                    <div className='flex flex-row items-center space-x-2 ml-auto'>
                        <button onClick={add} className='btn btn-secondary'>
                            Add
                        </button>
                        <div className='form-control'>
                            <label className='label cursor-pointer'>
                                <span className='label-text px-5'>Edit</span>
                                <input
                                    type='checkbox'
                                    className='toggle toggle-success'
                                    checked={editMode}
                                    onChange={() => setEditMode(!editMode)} // Toggle editMode on click
                                />
                            </label>
                        </div>
                        <h2 className='text-lg font-semibold self-center'>Mode:</h2>
                        <select
                            value={selectedModeValue}
                            onChange={handleSelectChange}
                            className='min-w-20 p-2 border border-primary-content rounded-lg bg-primary-content text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            <option value='5m'>5m</option>
                            <option value='10m'>10m</option>
                            <option value='20m'>20m</option>
                            <option value='30m'>30m</option>
                            <option value='60m'>60m</option>
                        </select>
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 1} // Disable if at the start of history
                            className='btn btn-secondary'
                        >
                            Undo
                        </button>
                        <button
                            onClick={redo}
                            className='btn btn-secondary'
                            disabled={historyIndex === history.length - 1} // Disable if at the start of history
                        >
                            Redo
                        </button>
                        <button
                            className='btn btn-secondary'
                            disabled={errorCount > 0}
                            onClick={() => document.getElementById('confirm_schedule_save_modal').showModal()}
                        >
                            Save
                        </button>
                        <button onClick={deploy} className='btn btn-primary' disabled={errorCount > 0}>
                            Deploy
                        </button>
                    </div>
                </div>

                {/* Conditional rendering for empty paginatedValue */}
                {Array.from(paginatedValueMap.entries()).length === 0 ? (
                    <div className='text-center text-lg font-semibold pt-10'>No Value</div>
                ) : (
                    Array.from(paginatedValueMap.entries()).map(([key, value], index) => {
                        let containerType = null;
                        for (const [key, cell] of value.entries()) {
                            if (cell.type) {
                                containerType = cell.type;
                                break; // Exit the loop when .type is found
                            }
                        }

                        return (
                            <div
                                key={index}
                                className='flex flex-col space-y-5 p-5'
                                ref={(el) => (tableRefs.current[key] = el)} // Assign ref dynamically
                            >
                                {/* Card for each section */}
                                <div className='card bg-base-100 w-full shadow-xl pt-5'>
                                    <div className='card-body'>
                                        {/* Dynamically render section name */}
                                        <h2 className='card-title capitalize'>{key}</h2>
                                        <Column />
                                        <div
                                            className='flex flex-row'
                                            style={{
                                                maxHeight: `${tableHeight}px`,
                                                minHeight: `${tableHeight}px`,
                                            }}
                                        >
                                            {/* Time slots */}
                                            <div
                                                className='flex flex-col items-center min-w-20 max-w-[105px] '
                                                style={{
                                                    maxHeight: `${tableHeight}px`,
                                                    minHeight: `${tableHeight}px`,
                                                }}
                                            >
                                                {timeSlots.map((time, timeIndex) => (
                                                    <div
                                                        style={{
                                                            height: `calc(${tableHeight}px / ${timeSlots.length})`,
                                                        }}
                                                        key={timeIndex}
                                                        className='flex items-center justify-center text-lg w-full text-center border border-base-content border-opacity-20 font-semibold shadow py-10 mx-5'
                                                    >
                                                        {time}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* DragDrop Component */}

                                            <DragDrop
                                                mode={selectedModeValue}
                                                tableKey={key}
                                                value={value}
                                                tableHeight={tableHeight}
                                                timeSlots={timeSlots}
                                                setValueMap={setValueMap}
                                                scrollToTable={scrollToTable}
                                                editMode={editMode}
                                                setLoading={setLoading}
                                                loading={loading}
                                                addClicked={addClicked}
                                                setAddClicked={setAddClicked}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                <dialog id='confirm_schedule_save_modal' className='modal'>
                    <div className='modal-box'>
                        <div className='modal-action'>
                            <div className='w-full'>
                                <label className='block text-sm font-medium mb-2 w-full'>
                                    Provide a name for this set of schedules:
                                </label>
                                <input
                                    type='text'
                                    // className={`input input-bordered w-full ${
                                    //     errorField === 'name' ? 'border-red-500' : ''
                                    // }`}
                                    className={`input input-bordered w-full mb-4`}
                                    value={scheduleVerName}
                                    onChange={(e) => setScheduleVerName(e.target.value)}
                                    placeholder='Enter name'
                                    ref={inputNameRef}
                                />
                                <div className='flex justify-center gap-2'>
                                    <button className='btn btn-primary' onClick={save}>
                                        Confirm
                                    </button>
                                    <button className='btn btn-error border-0' onClick={() => setScheduleVerName('')}>
                                        Reset
                                    </button>
                                </div>
                            </div>

                            <button
                                className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
                                onClick={() => document.getElementById('confirm_schedule_save_modal').close()}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </dialog>
            </div>
        )
    );
};

export default ForTest;
