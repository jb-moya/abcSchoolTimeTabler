import React, { useState, useEffect, useRef } from 'react';
import { IoSearch } from 'react-icons/io5';
import { MdHistory, MdOutlineCancel } from 'react-icons/md';

const Search = () => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]); // Start with empty suggestions
    const [searchHistory, setSearchHistory] = useState([]);
    const [role, setRole] = useState("Students");
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        setSearchHistory(storedHistory);
    }, []);

    useEffect(() => {
        if (query.trim()) {
            const filteredSuggestions = searchHistory.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !inputRef.current.contains(event.target)) {
                setSuggestions([]); // Close suggestions if clicking outside
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-4 lg:px-12 mt-[-100px] select-none space-y-8">
        {/* Heading */}
        <div className="text-center w-full max-w-4xl space-y-2">
          <h1 className="font-bold text-2xl lg:text-5xl">How can we help?</h1>
          <p className="font-light text-sm lg:text-base">
            Easily Find and Access Your Personalized Schedule by Searching
          </p>
        </div>
  
        {/* Search Bar */}
        <div className="w-full max-w-3xl flex items-center shadow-md bg-white rounded-full border border-gray-300 px-4 py-2">
          {/* Dropdown */}
          <select
            className="bg-transparent text-center outline-none  text-gray-700 font-medium text-sm lg:text-base cursor-pointer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Students">Students</option>
            <option value="Teachers">Teachers</option>
          </select>
  
          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 mx-4"></div>
  
          {/* Input */}
          <input
            type="text"
            className="grow text-sm lg:text-base bg-transparent outline-none text-black placeholder-gray-400 mr-4"
            placeholder={`Search ${role.toLowerCase()} schedules`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
  
          {/* Search Button */}
          <button
            className="flex items-center justify-center text-white bg-black rounded-full px-6 py-2 text-sm lg:text-base hover:bg-gray-800"
            onClick={handleSearch}
          >
            <IoSearch className="mr-2" />
            Search
          </button>
        </div>
      </div>
      
    );
};

export default Search;
