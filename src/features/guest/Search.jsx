import React, { useState, useEffect, useRef } from 'react';
import { IoSearch } from 'react-icons/io5';
import { MdHistory, MdOutlineCancel } from 'react-icons/md';

const Search = () => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]); // Start with empty suggestions
    const [searchHistory, setSearchHistory] = useState([]);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        setSearchHistory(storedHistory);
    }, []);

    useEffect(() => {
        if (query.trim()) {
            const filteredSuggestions = searchHistory.filter((item) =>
                item.toLowerCase().includes(query.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]); // Hide suggestions if query is empty
        }
    }, [query, searchHistory]);

    const handleSearch = () => {
        if (!query.trim()) return;

        const updatedHistory = [query, ...searchHistory.filter((item) => item !== query)];
        setSearchHistory(updatedHistory);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));

        setQuery('');
        setSuggestions([]); // Clear suggestions after search
    };

    const handleDeleteSuggestion = (itemToDelete) => {
        const updatedHistory = searchHistory.filter((item) => item !== itemToDelete);
        setSearchHistory(updatedHistory);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    };

    const handleFocus = () => {
        if (searchHistory.length > 0) {
            setSuggestions(searchHistory); // Show suggestions when input is focused
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        inputRef.current.focus();
        setSuggestions([]); // Close suggestions on suggestion click
    };

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !inputRef.current.contains(event.target)
            ) {
                setSuggestions([]); // Close suggestions if clicking outside
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="space-y-8 w-full h-full flex flex-col items-center justify-center px-4 lg:px-12 mt-[-100px] select-none">
            {/* Heading */}
            <div className="text-center w-full max-w-9xl space-y-4">
                <h1 className="font-bold text-3xl lg:text-6xl">
                    How can we help?
                </h1>
                <p className="font-light text-base lg:text-lg">
                    Easily Find and Access Your Personalized Schedule by Searching
                </p>
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-4xl relative" ref={dropdownRef}>
                <div
                    className={`flex flex-col bg-white shadow-lg text-black ${suggestions.length > 0 ? 'rounded-t-3xl' : 'rounded-3xl'}`}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-2 w-full px-4 py-3 md:px-6 md:py-4 lg:px-8 lg:py-5">
                        <input
                            ref={inputRef}
                            type="text"
                            className="grow text-sm md:text-base w-full bg-transparent outline-none placeholder-gray-400"
                            placeholder="Search your schedules"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearch();
                            }}
                            onFocus={handleFocus}
                        />
                        <IoSearch
                            className="text-xl md:text-2xl text-gray-500 cursor-pointer"
                            onClick={handleSearch}
                        />
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="absolute left-0 top-full w-full bg-white rounded-b-3xl shadow-md z-10">
                            <ul className="">
                                {suggestions.slice(0, 5).map((suggestion, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 cursor-pointer rounded-3xl"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <MdHistory className="text-xl text-gray-500" />
                                            <span className="text-sm md:text-base text-gray-700">{suggestion}</span>
                                        </div>
                                        <MdOutlineCancel
                                            className="text-xl text-gray-500 cursor-pointer mx-4"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSuggestion(suggestion);
                                            }}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Search;
