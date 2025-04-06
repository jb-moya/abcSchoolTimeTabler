import { useState, useRef, useEffect } from 'react';
import { IoChevronDown, IoRemove, IoAdd } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import clsx from 'clsx';

import { fetchDocuments } from '../../hooks/CRUD/retrieveDocuments';

const SearchableDropdownToggler = ({ 
    selectedList, 
    setSelectedList, 
    isEditMode = false 
}) => {

    // const subjects = useSelector((state) => state.subject.subjects);

    const { documents: subjects, loading1, error1 } = fetchDocuments('subjects');

    const [searchSubjectValue, setSearchSubjectValue] = useState('');
    const searchInputRef = useRef(null);

    const searchResults = filterObject(subjects, ([, subject]) => {
        const escapedSearchValue = escapeRegExp(searchSubjectValue).split('\\*').join('.*');

        const pattern = new RegExp(escapedSearchValue, 'i');
        return pattern.test(subject.subject);
    });

    // useEffect(() => {
    //   console.log(searchResults);
    // }, [searchResults]);

    const handleInputChange = (e) => {
        setSearchSubjectValue(e.target.value);
    };

    const toggleSubject = (subjectID) => {
        const updatedList = selectedList.includes(subjectID)
            ? selectedList.filter((id) => id !== subjectID)
            : [...selectedList, subjectID];

        setSelectedList(updatedList);
        // console.log(`Updated selected list:`, updatedList); // Log updated selected list
    };

    return (
        <div className='dropdown w-full max-w-md md:max-w-lg lg:max-w-full'>
            <div tabIndex={0} role='button' className='btn m-1 w-full flex justify-between items-center'>
                {isEditMode ? (
                    <div className='text-left'>
                        Edit Subject<span>(s)</span>
                    </div>
                ) : (
                    <div className='text-left'>Add subject</div>
                )}
                <IoChevronDown size={16} />
            </div>
            <ul
                tabIndex={0}
                className='dropdown-content menu bg-base-100 rounded-box z-[1] w-full h-auto shadow max-h-48 overflow-y-auto' // Updated here
                style={{ overflowX: 'hidden' }} // Ensure no horizontal scroll
            >
                
                <div
                    className='overflow-y-scroll h-full max-h-40 scrollbar-hide'
                    style={{ WebkitOverflowScrolling: 'touch', overflowX: 'hidden' }} // Added overflowX: hidden here
                >
                  <li>
                    <input
                        type='text'
                        placeholder='Search subject'
                        ref={searchInputRef}
                        className='input input-bordered input-sm w-full'
                        value={searchSubjectValue}
                        onChange={handleInputChange}
                    />
                  </li> 
                    {Object.keys(searchResults).length === 0 ? (
                        <div className='px-4 py-2 opacity-50'>Not found</div>
                    ) : (
                        Object.entries(searchResults).map(([, subject]) => (
                            <li role='button' key={subject.id} onClick={() => toggleSubject(subject.id)}>
                                <div className='flex justify-between whitespace-nowrap items-center'>
                                    <a className={clsx('w-full')}>{subject.subject}</a>
                                    {selectedList.includes(subject.id) ? (
                                        <IoRemove size={20} className='text-red-500' />
                                    ) : (
                                        <IoAdd size={20} className='text-green-400' />
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </div>
            </ul>
        </div>
    );
};

export default SearchableDropdownToggler;
