import clsx from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { IoSearch } from 'react-icons/io5';
import { MdHistory, MdOutlineCancel } from 'react-icons/md';
import useSearchTimetable from '../../hooks/useSearchTimetable';

const Search = () => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
    const [role, setRole] = useState('Sections');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const { search, results, loading, error } = useSearchTimetable();

    // console.log('rendered');

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

    const handleSearch = () => {
        if (!query.trim()) return;

        const updatedHistory = [query, ...searchHistory.filter((item) => item !== query)];
        setSearchHistory(updatedHistory);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));

        // setQuery('');
        const cleanedQuery = query.replace(/\s+/g, ' ').trim();
        search(cleanedQuery.split(' '));
        setSuggestions([]);
    };

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
                console.log("JHAHAHHAHAAHAHH")
                setIsSuggestionsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className='w-full h-full flex flex-col items-center px-4 lg:px-12 mt-[50px] select-none space-y-8'>
            <div className='text-center w-full max-w-4xl space-y-2'>
                <h1 className='font-bold text-2xl lg:text-5xl'>How can we help?</h1>
                <p className='font-light text-sm lg:text-base'>Easily Find and Access Your Personalized Schedule by Searching</p>
            </div>

            <div
                ref={dropdownRef}
                className={clsx(
                    'w-full max-w-3xl flex items-center shadow-md bg-white relative  px-4 py-2',
                    { 'rounded-3xl rounded-b-none': isSuggestionsVisible },
                    { 'rounded-3xl': !isSuggestionsVisible }
                )}
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
                        if (e.key === 'Enter') handleSearch();
                    }}
                    onFocus={handleFocus}
                    onBlur={() => console.log('onBlur')}
                />

                {suggestions.length > 0 && isSuggestionsVisible && (
                    <div className='absolute left-0 top-full w-full rounded-b-3xl bg-white shadow-md z-10 border-t'>
                        <ul className=''>
                            {suggestions.slice(0, 5).map((suggestion, index) => (
                                <li
                                    key={index}
                                    className='group flex items-center justify-between px-4 py-2 hover:bg-gray-300 cursor-pointer last:rounded-b-3xl'
                                    onClick={() => {
                                        console.log('fff');
                                        inputRef.current.blur();
                                        setIsSuggestionsVisible(false);
                                        handleSuggestionClick(suggestion);
                                        handleSearch();
                                    }}
                                >
                                    <div className='flex items-center gap-4'>
                                        <MdHistory className='text-xl text-gray-500' />
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
                    className='flex items-center justify-center text-white bg-black rounded-full px-6 py-2 text-sm lg:text-base hover:bg-gray-800'
                    onClick={handleSearch}
                >
                    <IoSearch className='mr-2' />
                    Search
                </button>
            </div>
        </div>
    );
};

export default Search;
