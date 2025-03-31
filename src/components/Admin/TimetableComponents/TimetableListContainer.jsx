import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import debounce from 'debounce';
import { RiEdit2Fill } from 'react-icons/ri';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';

import ModifyTimetableContainer from '@components/Admin/ModifyTimetable/ModifyTimetableContainer';

import DeleteData from '../DeleteData';
import { convertStringDataToMap } from '@components/Admin/ModifyTimetable/utils';
import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';
import { addDocument } from '../../../hooks/CRUD/addDocument';

const TimetableListContainer = ({}) => {
    
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    // ===================================================================================================
    // const { teachers, status: teacherStatus } = useSelector((state) => state.teacher);
    // const { subjects, status: subjectStatus } = useSelector((state) => state.subject);
    // const { sections, status: sectionStatus } = useSelector((state) => state.section);
    // const { schedules, status: schedStatus } = useSelector((state) => state.schedule);

    // useEffect(() => {
    //     if (schedStatus === 'idle') {
    //         dispatch(fetchScheds());
    //     }
    // }, [dispatch, schedStatus]);

    // useEffect(() => {
    //     if (teacherStatus === 'idle') {
    //         dispatch(fetchTeachers());
    //     }
    // }, [teacherStatus, dispatch]);

    // useEffect(() => {
    //     if (subjectStatus === 'idle') {
    //         dispatch(fetchSubjects());
    //     }
    // }, [subjectStatus, dispatch]);

    // useEffect(() => {
    //     if (sectionStatus === 'idle') {
    //         dispatch(fetchSections());
    //     }
    // }, [sectionStatus, dispatch]);

    // ===================================================================================================

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState('');
    const { documents: schedules, loading1, error1 } = fetchDocuments('schedules');
    const { documents: teachers, loading2, error2 } = fetchDocuments('teachers');

    const { documents: sections, loading3, error3 } = fetchDocuments('sections');
    const { documents: subjects, loading4, error4 } = fetchDocuments('subjects');

    console.log('schedules: ', schedules);
    // const { documents: sections, loading2, error2 } = fetchDocuments('sections');
    // console.log('sched: ', schedules);

    // console.log('sections: ', sections);

    // const [timetables, setTimetables] = useState(schedules);

    // useEffect(() => {
    //     setTimetables(schedules);
    // }, [schedules]);

    // useEffect(() => {
    //     console.log('Updated timetables:', timetables);
    // }, [timetables]);
    // ==================================================================================================

    const table = location.state?.generatedMap ?? new Map();

    // ===================================================================================================

    // const [editRankId, setEditRankId] = useState(null);
    const [editSchedId, setEditSchedId] = useState(null);
    const [editSchedName, setEditSchedName] = useState('');
    const [editSchedData, setEditSchedData] = useState('');

    const [timetable, setTimetable] = useState(table);

    useEffect(() => {
        console.log('timetable: ', timetable);
    }, [timetable]);

    // ===================================================================================================

    const [searchSchedResult, setSearchSchedResult] = useState(schedules);
    const [searchSchedValue, setSearchSchedValue] = useState('');

    // ===================================================================================================

    const handleEditClick = (scheduleId) => {
        console.log();
        console.log('editing: ', schedules[scheduleId].data);
        // addDocument('schedules', {
        //     name: schedules[scheduleId].name,
        //     data: schedules[scheduleId].data,
        // });

        const newTimetable = convertStringDataToMap(schedules[scheduleId].data);
        console.log('newTimetable: ', newTimetable);
        console.log('scheduleID: ', scheduleId);
        console.log('schedules[scheduleId].name: ', schedules[scheduleId].name);
        setEditSchedId(scheduleId);
        setEditSchedName(schedules[scheduleId].name);
        setTimetable(newTimetable);
    };

    // ===================================================================================================

    const resetTimetable = () => {
        setEditSchedId(null);
        setEditSchedName('');
        setTimetable(new Map());
        resetURLState();
    };

    const resetURLState = () => {
        navigate(location.pathname, { state: null });
    };

    // ===================================================================================================

    // SEARCH FUNCTIONALITY
    const debouncedSearch = useCallback(
        debounce((searchValue, schedules) => {
            setSearchSchedResult(
                filterObject(schedules, ([, sched]) => {
                    if (!searchValue) return true;

                    const escapedSearchValue = escapeRegExp(searchValue).split('\\*').join('.*');

                    const pattern = new RegExp(escapedSearchValue, 'i');

                    return pattern.test(sched.name);
                })
            );
        }, 200),
        []
    );
    useEffect(() => {
        console.log('editSchedName', editSchedName);
    }, [editSchedName]);

    useEffect(() => {
        debouncedSearch(searchSchedValue, schedules);
    }, [searchSchedValue, schedules, debouncedSearch]);

    // PAGINATION
    const itemsPerPage = 5; // Change this to adjust the number of items per page
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages
    const totalPages = Math.ceil(Object.values(searchSchedResult).length / itemsPerPage);

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchSchedResult).slice(indexOfFirstItem, indexOfLastItem);

    // ===================================================================================================

    const buildingData = {
        floors: 2,
        id: 1,
        image: null,
        name: 'BLDG 1',
        nearbyBuildings: [],
        rooms: [
            [
                { roomName: 'BLDG 1 - 101' },
                { roomName: 'BLDG 1 - 102' },
                { roomName: 'BLDG 1 - 103' },
                { roomName: 'BLDG 1 - 104' },
                { roomName: 'BLDG 1 - 105' },
            ],
            [
                { roomName: 'BLDG 1 - 201' },
                { roomName: 'BLDG 1 - 202' },
                { roomName: 'BLDG 1 - 203' },
                { roomName: 'BLDG 1 - 204' },
                { roomName: 'BLDG 1 - 205' },
            ],
        ],
    };

    const string_building = JSON.stringify(buildingData, null, 2);

    console.log('string: ', string_building);

    const parsed_building = JSON.parse(string_building);
    console.log('parsed_building: ', parsed_building);

    return (
        <React.Fragment>
            <div className='flex flex-col gap-4'>
                {/* Timetable List */}
                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body mb-4'>
                        <div className='flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5'>
                            {/* Pagination */}
                            {currentItems.length > 0 && (
                                <div className='join flex justify-center mb-4 md:mb-0'>
                                    <button
                                        className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
                                        onClick={() => {
                                            if (currentPage > 1) {
                                                setCurrentPage(currentPage - 1);
                                            }
                                            handleCancelRankEditClick();
                                        }}
                                        disabled={currentPage === 1}
                                    >
                                        «
                                    </button>
                                    <button className='join-item btn'>
                                        Page {currentPage} of {totalPages}
                                    </button>
                                    <button
                                        className={`join-item btn ${currentPage === totalPages ? 'btn-disabled' : ''}`}
                                        onClick={() => {
                                            if (currentPage < totalPages) {
                                                setCurrentPage(currentPage + 1);
                                            }
                                            handleCancelRankEditClick();
                                        }}
                                        disabled={currentPage === totalPages}
                                    >
                                        »
                                    </button>
                                </div>
                            )}

                            {currentItems.length === 0 && currentPage > 1 && (
                                <div className='hidden'>{setCurrentPage(currentPage - 1)}</div>
                            )}

                            {/* Search Timetable */}
                            <div className='flex-grow w-full md:w-1/3 lg:w-1/4'>
                                <label className='input input-bordered flex items-center gap-2 w-full'>
                                    <input
                                        type='text'
                                        className='grow p-3 text-sm w-full'
                                        placeholder='Search Timetable'
                                        value={searchSchedValue}
                                        onChange={(e) => setSearchSchedValue(e.target.value)}
                                    />
                                    <IoSearch className='text-xl' />
                                </label>
                            </div>
                        </div>
                        <div className='overflow-x-auto'>
                            <table className='table table-sm table-zebra w-full'>
                                <thead>
                                    <tr>
                                        <th className='whitespace-nowrap'>ID</th>
                                        <th className='whitespace-nowrap'>Name</th>
                                        <th className='w-28 text-right'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan='5' className='text-center'>
                                                No timetables found
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map(([, schedule], index) => (
                                            <tr key={schedule.id} className='group hover'>
                                                <th>{schedule.custom_id}</th>

                                                <td>{schedule.name}</td>

                                                <td className='w-28'>
                                                    <div className='flex'>
                                                        <button
                                                            className='btn btn-xs btn-ghost text-blue-500'
                                                            onClick={() => handleEditClick(schedule.custom_id)}
                                                        >
                                                            <RiEdit2Fill size={20} />
                                                        </button>

                                                        <DeleteData
                                                            id={schedule.id}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Open Timetable */}
                {timetable.size > 0 && (
                    <div className='card w-full bg-base-100 shadow-md'>
                        <button className='absolute top-2 right-2 text-gray-500 hover:text-gray-700' onClick={resetTimetable}>
                            ✖
                        </button>
                        <div className='card-body'>
                            <ModifyTimetableContainer
                                hashMap={timetable}
                                timetableName={editSchedName}
                                timetableId={editSchedId}
                                errorMessage={errorMessage}
                                setErrorMessage={setErrorMessage}
                                errorField={errorField}
                                setErrorField={setErrorField}
                                teachers={teachers}
                                sections={sections}
                                subjects={subjects}
                            />
                        </div>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
};

export default TimetableListContainer;
