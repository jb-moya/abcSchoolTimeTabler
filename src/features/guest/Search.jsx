import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IoSearch } from 'react-icons/io5';
import { MdHistory, MdOutlineCancel } from 'react-icons/md';
import debounce from 'debounce';
import clsx from 'clsx';
import useSearchTimetable from '../../hooks/useSearchTimetable';
import { convertStringDataToMap } from '../../components/Admin/ModifyTimetable/utils';
import { convertToTime } from '@utils/convertToTime';
// import { fetchSections } from '@features/sectionSlice';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ScheduleModal = ({ outerKey, groupedByTime, buildingInfo, role, department, rank, AdviserName}) => {
    const generatePDF = () => {
        const doc = new jsPDF('landscape');
    
        // Title Section (Bold & Bigger Font)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(`${outerKey} - Schedule`, 14, 15);
    
        doc.setFontSize(12);
        doc.text(`Building: ${buildingInfo}`, 14, 25);
        doc.text(`Adviser: ${AdviserName}`, 14, 35);
    
        let startY = 40; // Ensure spacing between text and table
    
        const tableColumn = ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const tableRows = [];
    
        const defaultRowColors = [
            [255, 204, 204], // Light Red
            [204, 229, 255], // Light Blue
            [204, 255, 204], // Light Green
            [255, 255, 204], // Light Yellow
            [229, 204, 255], // Light Purple
            [255, 204, 229], // Light Pink
            [204, 204, 255], // Light Indigo
            [204, 255, 255], // Light Teal
            [255, 229, 204], // Light Orange
            [224, 224, 224], // Light Gray
            [229, 255, 204], // Light Lime
            [204, 255, 229], // Light Cyan
        ];
    
        // Add schedule data
        Array.from(groupedByTime.values()).forEach(({ time, days }, rowIndex) => {
            const row = [
                time,
                ...days.map((fields) =>
                    fields[0] && fields[1] ? `${fields[0]}\n${fields[1]}\n${time}` : fields[0] || fields[1] || ''
                ),
            ];
            tableRows.push(row);
        });
    
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            styles: { halign: 'center', cellPadding: 3, fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 12, fontStyle: 'bold' }, // Blue header
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index !== 0) {
                    const cellText = data.cell.raw;
                    if (cellText.includes('Math 7')) {
                        data.cell.styles.fillColor = [255, 204, 204]; // Light Red
                    } else {
                        const bgColor = defaultRowColors[data.row.index % defaultRowColors.length];
                        data.cell.styles.fillColor = bgColor;
                    }
                }
            },
        });
    
        doc.save(`${outerKey}-schedule.pdf`);
    };
    

    const rowColors = [
        'bg-red-200',
        'bg-blue-200',
        'bg-green-200',
        'bg-yellow-200',
        'bg-purple-200',
        'bg-pink-200',
        'bg-indigo-200',
        'bg-teal-200',
        'bg-orange-200',
        'bg-gray-200',
        'bg-lime-200',
        'bg-cyan-200',
    ];

    return (
        <dialog id={`modal-${outerKey}`} className='modal'>
            <div className='modal-box w-full max-w-6xl bg-white text-black p-6 rounded-lg'>
                <h3 className='font-bold text-lg text-center'>{outerKey} - Schedule</h3>
            
                {role === "Teachers" ? (
                    <>
                        <p className="text-center text-sm text-gray-700 mt-2">Department: {department}</p>
                        <p className="text-center text-sm text-gray-700 mt-2">Rank: {rank}</p>
                    </>
                ) : (
                    <>
                    <p className="text-center text-sm text-gray-700 mt-2">Building: {buildingInfo}</p>
                    <p className="text-center text-sm text-gray-700 mt-2">Adviser: {AdviserName}</p>
                    </>
                )}

                {/* Table */}
                <div className='overflow-x-auto mt-4'>
                    <table className='table w-full mt-2 border-2'>
                        <thead>
                            <tr className='bg-black text-white'>
                                <th className='text-center w-2/12'>Time</th>
                                <th className='text-center'>Monday</th>
                                <th className='text-center'>Tuesday</th>
                                <th className='text-center'>Wednesday</th>
                                <th className='text-center'>Thursday</th>
                                <th className='text-center'>Friday</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from(groupedByTime.values()).map(({ time, days }, rowIndex) => (
                                <tr key={time} className={rowColors[rowIndex % rowColors.length]}>
                                    <td className='text-center bg-white'>{time}</td>
                                    {days.map((fields, index) => (
                                        <td key={index} className='text-center'>
                                            <div>{fields[0]}</div>
                                            <div>{fields[1]}</div>
                                            {fields[0] && fields[1] && <div>{time}</div>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Buttons */}
                <div className='modal-action flex justify-center gap-4'>
                    <button className='btn btn-primary' onClick={generatePDF}>
                        Download PDF
                    </button>
                    <button
                        className='btn btn-error'
                        onClick={(e) => {
                            e.stopPropagation();
                            const modal = document.getElementById(`modal-${outerKey}`);
                            if (modal) modal.close();
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </dialog>
    );
};

const Search = () => {
    // const dispatch = useDispatch();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [results, setResults] = useState([]);
    const [isSearchClicked, setIsSearchClicked] = useState(false);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
    const [role, setRole] = useState('Sections');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const [valueMap, setValueMap] = useState(new Map());
    const { search, loading, error } = useSearchTimetable();
    // const { sections, status: sectionStatus } = useSelector((state) => state.section);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        setSearchHistory(storedHistory);
    }, []);

    useEffect(() => {
        if (query.trim()) {
            const filteredSuggestions = searchHistory.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
            setSuggestions(filteredSuggestions);
        } else {
            // ...
        }
    }, [query, searchHistory]);

    useEffect(() => {
        setIsSearchClicked(false);
    }, [query]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearchClicked(true);

        const updatedHistory = [query, ...searchHistory.filter((item) => item !== query)];
        setSearchHistory(updatedHistory);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));

        const cleanedQuery = query.replace(/\s+/g, ' ').trim();

        setResults(await search(cleanedQuery.split(' '), role == 'Sections' ? 's' : 't'));

        setSuggestions([]);
        setIsSuggestionsVisible(true);

        inputRef.current.focus();
        console.log('result', results);
    };

    useEffect(() => {
        console.log('potanginang results', results);
        if (results.length !== 0) {
            console.log('in');
            const convertedData = convertStringDataToMap(results[0]?.a);
            console.log('convertedData', convertedData);
            setValueMap(convertedData);
        }
    }, [results]);

    const handleDeleteSuggestion = (itemToDelete) => {
        setSearchHistory((prevHistory) => prevHistory.filter((item) => item !== itemToDelete));
        setSuggestions(searchHistory.filter((item) => item !== itemToDelete));
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    };

    const handleFocus = () => {
        if (searchHistory.length > 0) {
            setSuggestions(searchHistory);
            setIsSuggestionsVisible(true);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        console.log('🚀 ~ handleSuggestionClick ~ d:', suggestion);

        setQuery(suggestion);
        setIsSuggestionsVisible(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !inputRef.current.contains(event.target)) {
                console.log('JHAHAHHAHAAHAHH');
                setIsSuggestionsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    // console.log(sections[1]?.modality);
    return (
        <div className='w-full h-full flex flex-col items-center px-4 lg:px-12 mt-[50px] select-none space-y-8'>
            <div className='text-center w-full max-w-4xl space-y-2'>
                <h1 className='font-bold text-2xl lg:text-5xl'>Timetable Search</h1>
                <p className='font-light text-sm lg:text-base'>Easily Find and Access Your Schedule by Searching</p>
            </div>

            <div
                ref={dropdownRef}
                className={clsx('rounded-3xl w-full max-w-3xl flex items-center shadow-md bg-white relative  px-4 py-2', {
                    'rounded-b-none ': isSuggestionsVisible && suggestions.length > 0,
                })}
            >
                <select
                    className='bg-transparent text-center outline-none  text-gray-700 font-medium text-sm lg:text-base cursor-pointer'
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value='Sections'>Sections</option>
                    <option value='Teachers'>Teachers</option>
                </select>

                <div className='h-6 w-px bg-gray-300 mx-4'></div>

                <input
                    ref={inputRef}
                    type='text'
                    className={
                        'input input-sm grow text-sm lg:text-base bg-transparent outline-none text-black placeholder-gray-400 mr-4'
                    }
                    placeholder={`Search ${role.toLowerCase()} schedules`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                    onFocus={handleFocus}
                    onBlur={() => console.log('onBlur')}
                />

                {suggestions.length > 0 && isSuggestionsVisible && (
                    <div className='absolute left-0 top-full w-full rounded-b-3xl bg-white shadow-md z-10 border-t'>
                        {results?.length === 0 && isSearchClicked && (
                            <p className='text-center text-gray-500 py-20 border border-b'>
                                No results found for <b>{query}</b> in {role?.toLowerCase() ?? ''} timetables
                            </p>
                        )}

                        <ul>
                            {results?.map((result) => (
                                <li
                                    key={result.id}
                                    className='group flex items-center justify-between px-4 py-2 hover:bg-gray-300 cursor-pointer last:rounded-b-3xl'
                                    onClick={() => {
                                        inputRef.current?.blur();
                                        setIsSuggestionsVisible(false);
                                        handleSuggestionClick(result.n[0]);
                                    }}
                                >
                                    <div className='flex items-center gap-4'>
                                        <span className='text-xs w-10 border text-accent border-accent text-opacity-75 border-opacity-75'>
                                            result
                                        </span>
                                        <span className='text-sm md:text-base text-gray-700'>{result.n.join(' ')}</span>
                                    </div>

                                    {valueMap && valueMap.size > 0 && (
                                        <div className='flex flex-col space-y-2'>
                                            {Array.from(valueMap).map(([outerKey, nestedMap]) => {
                                                const groupedByTime = new Map();
                                                let department = '';
                                                let rank = '';
                                                
                                                Array.from(nestedMap)
                                                    .sort((a, b) => a[1].start - b[1].start)
                                                    .forEach(([innerKey, innerMap]) => {
                                                        const timeSlot = `${convertToTime(innerMap.start)}-${convertToTime(
                                                            innerMap.end
                                                        )}`;
                                                        let fieldName1 =
                                                            innerMap.type === 's' ? innerMap.teacher : innerMap.section;
                                                        let fieldName2 = innerMap.subject;

                                                        if (innerMap.type === 't') {
                                                            department = innerMap.department;
                                                            rank = innerMap.rank;
                                                        }

                                                        if (!groupedByTime.has(timeSlot)) {
                                                            groupedByTime.set(timeSlot, {
                                                                time: timeSlot,
                                                                days: Array(5).fill([]),
                                                            });
                                                        }
                                                        groupedByTime.get(timeSlot).days[innerMap.day - 1] = [
                                                            fieldName1 ?? 'Break',
                                                            fieldName2,
                                                        ];
                                                    });

                                                return (
                                                    <div key={outerKey}>
                                                        <button
                                                            className='btn btn-primary'
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const modal = document.getElementById(`modal-${outerKey}`);
                                                                if (modal) modal.showModal();
                                                            }}
                                                        >
                                                            View Schedule
                                                        </button>

                                                        <ScheduleModal
                                                            outerKey={outerKey}
                                                            groupedByTime={groupedByTime}
                                                            buildingInfo={"Building 1"}
                                                            role={role}
                                                            AdviserName={"Mr. Tagalogin"}
                                                            department={"Math Department"}
                                                            rank={"Teacher 1"}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </li>
                            ))}

                            {suggestions.slice(0, 5).map((suggestion, index) => (
                                <li
                                    key={index}
                                    className='group flex items-center justify-between px-4 py-2 hover:bg-gray-300 cursor-pointer last:rounded-b-3xl'
                                    onClick={() => {
                                        inputRef.current?.blur();
                                        setIsSuggestionsVisible(false);
                                        handleSuggestionClick(suggestion);
                                    }}
                                >
                                    <div className='flex items-center gap-4'>
                                        <MdHistory className='text-xl text-gray-500 w-10' />
                                        <span className='text-sm md:text-base text-gray-700'>{suggestion}</span>
                                    </div>

                                    <button
                                        className='group/hover-icon hidden group-hover:block'
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSuggestion(suggestion);
                                        }}
                                    >
                                        <MdOutlineCancel className='text-xl group-hover/hover-icon:scale-125 group-hover/hover-icon:text-red-400 text-gray-500 cursor-pointer mx-4' />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    className='btn btn-sm flex items-center justify-center text-white bg-black rounded-full px-4 text-sm lg:text-base hover:bg-gray-800'
                    onClick={handleSearch}
                    disabled={loading || query.trim() === ''}
                >
                    {loading ? (
                        <div className='animate-none md:animate-spin mr-2'>
                            <IoSearch />
                        </div>
                    ) : (
                        <IoSearch className='mr-2' />
                    )}
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
        </div>
    );
};

export default Search;
