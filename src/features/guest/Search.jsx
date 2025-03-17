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

    // useEffect(() => {
    //     if (sectionStatus === 'idle') {
    //         dispatch(fetchSections());
    //     }
    // }, [sectionStatus, dispatch]);

    // example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark ohexample mo mark oh example mo mark oh example mo mark oh example mo mark oh
    // example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark ohexample mo mark oh example mo mark oh example mo mark oh example mo mark oh
    // example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark ohexample mo mark oh example mo mark oh example mo mark oh example mo mark oh
    // example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark ohexample mo mark oh example mo mark oh example mo mark oh example mo mark oh
    // example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark ohexample mo mark oh example mo mark oh example mo mark oh example mo mark oh
    // example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark ohexample mo mark oh example mo mark oh example mo mark oh example mo mark oh
    // example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark ohexample mo mark oh example mo mark oh example mo mark oh example mo mark oh
    // example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark ohexample mo mark oh example mo mark oh example mo mark oh example mo mark oh
    // example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark oh example mo mark ohexample mo mark oh example mo mark oh example mo mark oh example mo mark oh
    const exampleTimetable = [
        ['t', 86, null, 9, 'REG-7-SEC-3', 4, 'English 7', '8-16', 1],
        ['t', 86, null, 9, 'REG-7-SEC-3', 4, 'English 7', '8-16', 2],
        ['t', 86, null, 9, 'REG-7-SEC-3', 4, 'English 7', '8-16', 3],
        ['t', 86, null, 9, 'REG-7-SEC-3', 4, 'English 7', '8-16', 4],
        ['t', 86, null, 9, 'REG-7-SEC-3', 4, 'English 7', '8-16', 5],
        ['t', 86, null, 6, 'STAR-7', 4, 'English 7', '16-24', 1],
        ['t', 86, null, 6, 'STAR-7', 4, 'English 7', '16-24', 2],
        ['t', 86, null, 6, 'STAR-7', 4, 'English 7', '16-24', 3],
        ['t', 86, null, 6, 'STAR-7', 4, 'English 7', '16-24', 4],
        ['t', 86, null, 6, 'STAR-7', 4, 'English 7', '16-24', 5],
        ['t', 86, null, 13, 'REG-7-SEC-7', 4, 'English 7', '24-32', 1],
        ['t', 86, null, 13, 'REG-7-SEC-7', 4, 'English 7', '24-32', 2],
        ['t', 86, null, 13, 'REG-7-SEC-7', 4, 'English 7', '24-32', 3],
        ['t', 86, null, 13, 'REG-7-SEC-7', 4, 'English 7', '24-32', 4],
        ['t', 86, null, 13, 'REG-7-SEC-7', 4, 'English 7', '24-32', 5],
        ['t', 86, null, 15, 'REG-7-SEC-9', 4, 'English 7', '38-46', 1],
        ['t', 86, null, 15, 'REG-7-SEC-9', 4, 'English 7', '38-46', 2],
        ['t', 86, null, 15, 'REG-7-SEC-9', 4, 'English 7', '38-46', 3],
        ['t', 86, null, 15, 'REG-7-SEC-9', 4, 'English 7', '38-46', 4],
        ['t', 86, null, 15, 'REG-7-SEC-9', 4, 'English 7', '38-46', 5],
        ['t', 86, null, 14, 'REG-7-SEC-8', 4, 'English 7', '46-54', 1],
        ['t', 86, null, 14, 'REG-7-SEC-8', 4, 'English 7', '46-54', 2],
        ['t', 86, null, 14, 'REG-7-SEC-8', 4, 'English 7', '46-54', 3],
        ['t', 86, null, 14, 'REG-7-SEC-8', 4, 'English 7', '46-54', 4],
        ['t', 86, null, 14, 'REG-7-SEC-8', 4, 'English 7', '46-54', 5],
        ['t', 86, null, 12, 'REG-7-SEC-6', 4, 'English 7', '54-62', 1],
        ['t', 86, null, 12, 'REG-7-SEC-6', 4, 'English 7', '54-62', 2],
        ['t', 86, null, 12, 'REG-7-SEC-6', 4, 'English 7', '54-62', 3],
        ['t', 86, null, 12, 'REG-7-SEC-6', 4, 'English 7', '54-62', 4],
        ['t', 86, null, 12, 'REG-7-SEC-6', 4, 'English 7', '54-62', 5],
        ['t', 86, null, 5, 'TECHVOC-7', 4, 'English 7', '62-70', 1],
        ['t', 86, null, 5, 'TECHVOC-7', 4, 'English 7', '62-70', 2],
        ['t', 86, null, 5, 'TECHVOC-7', 4, 'English 7', '62-70', 3],
        ['t', 86, null, 5, 'TECHVOC-7', 4, 'English 7', '62-70', 4],
        ['t', 86, null, 5, 'TECHVOC-7', 4, 'English 7', '62-70', 5],
        ['t', 86, null, 2, 'STE-7-2', 4, 'English 7', '84-92', 1],
        ['t', 86, null, 2, 'STE-7-2', 4, 'English 7', '84-92', 2],
        ['t', 86, null, 2, 'STE-7-2', 4, 'English 7', '84-92', 3],
        ['t', 86, null, 2, 'STE-7-2', 4, 'English 7', '84-92', 4],
        ['t', 86, null, 2, 'STE-7-2', 4, 'English 7', '84-92', 5],
    ];

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
                    <div className='absolute left-0 top-full w-full rounded-b-3xl bg-white shadow-md z-10 border-t '>
                        {results.length == 0 && isSearchClicked && (
                            <p className='text-center text-gray-500 py-20 border border-b'>
                                No results found for <b>{query}</b> in {role.toLowerCase()} timetables
                            </p>
                        )}

                        <ul className=''>
                            {results.map((result) => (
                                <li
                                    key={result.id}
                                    className='group flex items-center justify-between px-4 py-2 hover:bg-gray-300 cursor-pointer last:rounded-b-3xl'
                                    onClick={() => {
                                        console.log('fff');
                                        inputRef.current.blur();
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
                                </li>
                            ))}

                            {suggestions.slice(0, 5).map((suggestion, index) => (
                                <li
                                    key={index}
                                    className='group flex items-center justify-between px-4 py-2 hover:bg-gray-300 cursor-pointer last:rounded-b-3xl'
                                    onClick={() => {
                                        console.log('fff');
                                        inputRef.current.blur();
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
                                            // setIsSuggestionsVisible(false);
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
                            <IoSearch className='' />
                        </div>
                    ) : (
                        <IoSearch className='mr-2' />
                    )}

                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
            {valueMap.size > 0 && (
                <div className={`overflow-x-auto w-full pt-5${suggestions.length > 0 && isSuggestionsVisible ? 'pt-72' : ''}`}>
                    {Array.from(valueMap).map(([outerKey, nestedMap]) => {
                        // console.log('OuterKey: ', outerKey);

                        // Group by time slots (start-end) after sorting
                        const groupedByTime = new Map();

                        // Convert to array and sort by start time
                        Array.from(nestedMap)
                            .sort((a, b) => a[1].start - b[1].start)
                            .forEach(([innerKey, innerMap]) => {
                                // console.log('innerMap: ', innerMap);
                                const timeSlot = `${convertToTime(innerMap.start)}-${convertToTime(innerMap.end)}`;
                                let fieldName1 = '';
                                let fieldName2 = innerMap.subject;

                                if (innerMap.type === 's') {
                                    fieldName1 = innerMap.teacher;
                                } else {
                                    fieldName1 = innerMap.section;
                                }

                                if (!groupedByTime.has(timeSlot)) {
                                    groupedByTime.set(timeSlot, {
                                        time: timeSlot,
                                        days: Array(5).fill([]),
                                    });
                                    // console.log('Group: ', groupedByTime);
                                }
                                groupedByTime.get(timeSlot).days[innerMap.day - 1] = [fieldName1 ?? 'Break ', fieldName2];
                            });

                        return (
                            <div key={outerKey}>
                                <div>{outerKey}</div>
                                <table className='table w-full'>
                                    <thead>
                                        <tr>
                                            <th className='text-center w-2/12'>Time</th>
                                            <th className='text-center'>Monday</th>
                                            <th className='text-center'>Tuesday</th>
                                            <th className='text-center'>Wednesday</th>
                                            <th className='text-center'>Thursday</th>
                                            <th className='text-center'>Friday</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from(groupedByTime.values()).map(({ time, days }) => (
                                            <tr key={time}>
                                                <td>{time}</td>
                                                {days.map((fields, index) => {
                                                    // console.log('days: ', days);
                                                    // console.log('fields: ', fields);
                                                    return (
                                                        <td key={index}>
                                                            <div className='flex flex-col items-center'>
                                                                <div>{fields[0]}</div>
                                                                <div>{fields[1]}</div>
                                                                {fields[0] && fields[1] && <div>{time}</div>}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Search;
