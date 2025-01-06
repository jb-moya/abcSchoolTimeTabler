import { useState, useRef, useEffect } from 'react';
import { IoChevronDown, IoRemove, IoAdd } from 'react-icons/io5';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import clsx from 'clsx';
const SearchableDropdownToggler = ({ teacherID, setSelectedList, currID, type }) => {
    const subjects = useSelector((state) => state.subject.subjects);
    const teachers = useSelector((state) => state.teacher.teachers);
    const [searchSubjectValue, setSearchSubjectValue] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredTeachers = teacherID.map((id) => teachers[id]).filter(Boolean);

    const searchResults = filterObject(filteredTeachers, ([, teachers]) => {
        const escapedSearchValue = escapeRegExp(searchSubjectValue).split('\\*').join('.*');

        const pattern = new RegExp(escapedSearchValue, 'i');
        return pattern.test(teachers.teacher);
    });

    const handleInputChange = (e) => {
        setSearchSubjectValue(e.target.value);
    };

    const toggleSubject = (teacherID, teacher) => {
        setIsDropdownOpen(!isDropdownOpen);
        setSelectedList(teacherID, teacher);
    };
    const teacherName = filteredTeachers.find((item) => item.id === currID)?.teacher || null;
    console.log('searchResults: ', searchResults);

    return (
        <div className='dropdown '>
            {/* Toggler */}
            <div
                role='button'
                tabIndex={type === 'section' ? 0 : -1} // Allow tab focus only if type === 'section'
                className={clsx(
                    'font-medium text-ellipsis whitespace-nowrap text-center text-[10px] sm:text-[10px] md:text-xs lg:text-sm flex items-center',
                    type === 'section' ? 'cursor-pointer' : 'cursor-default' // Change cursor based on type
                )}
            >
                <span>{teacherName}</span>
                {type === 'section' && <IoChevronDown size={16} />}
            </div>

            {type === 'section' && (
                <ul tabIndex={0} className='dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow'>
                    <li>
                        <input
                            type='text'
                            placeholder='Search subject'
                            className='input input-bordered input-sm w-full max-w-xs'
                            value={searchSubjectValue}
                            onChange={handleInputChange}
                        />
                    </li>
                    {Object.keys(searchResults).length === 0 ? (
                        <div className='px-4 py-2 opacity-50'>Not found</div>
                    ) : (
                        Object.entries(searchResults)
                            .slice(0, 4) // Limit to the first 4 entries
                            .map(([, subject]) => (
                                <li
                                    role='button'
                                    key={subject.id}
                                    onClick={(e) => subject.id !== currID && toggleSubject(subject.id, subject.teacher)}
                                    className={clsx(subject.id === currID && 'opacity-50 pointer-events-none')}
                                >
                                    <div className='flex justify-between whitespace-nowrap'>
                                        <a className={clsx('w-full')}>{subject.teacher}</a>
                                    </div>
                                </li>
                            ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchableDropdownToggler;
