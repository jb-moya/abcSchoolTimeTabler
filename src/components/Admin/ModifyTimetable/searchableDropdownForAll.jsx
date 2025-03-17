import { useState, memo, useMemo } from 'react';
import { IoChevronDown, IoRemove, IoAdd } from 'react-icons/io5';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import clsx from 'clsx';
const SearchableDropdownToggler = ({ fieldIDs, setSelectedList, currentFieldID, type, mode, setReset, typePlaceholder }) => {
    // const subjects = useSelector((state) => state.subject.subjects);
    // const fieldData = useSelector((state) => state.teacher.fieldData);
    const fieldData = useSelector((state) =>
        mode === 'Main'
            ? type === 't'
                ? state.section.sections
                : type === 's'
                ? state.teacher.teachers
                : state.subject.subjects
            : state.subject.subjects
    );
    const [searchValue, setsearchValue] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const fieldFields = fieldIDs.map((id) => fieldData[id]).filter(Boolean);
    // console.log('mode: ', mode);

    // console.log('fieldFields: ', fieldFields);
    const searchResults = filterObject(fieldFields, ([, value]) => {
        const escapedSearchValue = escapeRegExp(searchValue).split('\\*').join('.*');

        const pattern = new RegExp(escapedSearchValue, 'i');

        const updatedValue = type === 's' ? value.teacher : type === 't' ? value.section : undefined;

        const fieldToTest = mode === 'Main' ? updatedValue : value.subject;
        return pattern.test(fieldToTest);
    });

    const handleInputChange = (e) => {
        setsearchValue(e.target.value);
    };

    const toggleField = (fieldID, field) => {
        setIsDropdownOpen(!isDropdownOpen);
        if (mode === 'Main') {
            if (type === 's') {
                setSelectedList({ teacher: field, teacherID: fieldID });
            } else if (type === 't') {
                console.log('clicked: ');

                setSelectedList({ section: field, sectionID: fieldID });
            }
        } else {
            setSelectedList({ subject: field, subjectID: fieldID });
        }
        setReset(true);
    };
    const fieldName =
        fieldFields.find((item) => item.id === currentFieldID)?.[
            mode === 'Main' ? (type === 't' ? 'section' : type === 's' ? 'teacher' : 'subject') : 'subject'
        ] || `Select ${typePlaceholder}`;

    // const fieldName = useMemo(() => {
    //     return fieldFields.find((item) => item.id === currentFieldID)?.teacher || `Select ${mode}`;
    // }, [fieldFields, currentFieldID]);
    // console.log('fieldIDs: ', fieldIDs);
    // console.log('fieldName: ', fieldName);

    // console.log('type: ', type);
    // console.log('Mode: ', mode);
    // console.log('currentFieldID: ', currentFieldID);
    // console.log('fieldFields: ', fieldFields);
    console.log('RenderCount');

    return (
        <div className='dropdown border bordered rounded w-full'>
            {/* Toggler */}
            <div role='button' tabIndex={0} className={clsx('text-center flex items-center justify-between', 'cursor-pointer')}>
                <span className='flex-grow text-center font-medium text-ellipsis whitespace-nowrap text-lg'>{fieldName}</span>
                {<IoChevronDown size={16} className='ml-2' />}
            </div>

            <ul tabIndex={0} className='dropdown-content menu z-[2000] bg-base-100 rounded-box w-full p-2 shadow'>
                <li>
                    <input
                        type='text'
                        placeholder={`Search: ${typePlaceholder}`} // Dynamic placeholder
                        className='input input-bordered input-sm w-full'
                        value={searchValue}
                        onChange={handleInputChange}
                    />
                </li>
                {Object.keys(searchResults).length === 0 ? (
                    <div className='px-4 py-2 opacity-50'>Not found</div>
                ) : (
                    Object.entries(searchResults)
                        .slice(0, 4) // Limit to the first 4 entries
                        .map(([, value]) => (
                            <li
                                role='button'
                                key={value.id}
                                onClick={(e) =>
                                    value.id !== currentFieldID &&
                                    toggleField(
                                        value.id,
                                        mode === 'Main'
                                            ? type === 't'
                                                ? value.section
                                                : type === 's'
                                                ? value.teacher
                                                : value.subject
                                            : value.subject
                                    )
                                }
                                className={clsx(value.id === currentFieldID && 'opacity-50 pointer-events-none w-full')}
                            >
                                <div className='flex justify-between whitespace-nowrap'>
                                    <a className={clsx('w-full')}>
                                        {mode === 'Main'
                                            ? type === 't'
                                                ? value.section
                                                : type === 's'
                                                ? value.teacher
                                                : value.subject
                                            : value.subject}
                                    </a>
                                </div>
                            </li>
                        ))
                )}
            </ul>
        </div>
    );
};

export default memo(SearchableDropdownToggler);
