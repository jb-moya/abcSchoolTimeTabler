import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import debounce from 'debounce';
import { RiEdit2Fill } from 'react-icons/ri';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoSearch } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import ModifyTimetableContainer from '@components/Admin/ModifyTimetable/ModifyTimetableContainer';
import DeleteData from '../DeleteData';
import { convertStringDataToMap } from '@components/Admin/ModifyTimetable/utils';

const TimetableListContainer = () => {
    const { subjects, loading: subjectsLoading, error: subjectsError } = useSelector((state) => state.subjects);
    const { programs, loading: programsLoading, error: programsError } = useSelector((state) => state.programs);
    const { sections, loading: sectionsLoading, error: sectionsError } = useSelector((state) => state.sections);
    const { ranks, loading: ranksLoading, error: ranksError } = useSelector((state) => state.ranks);
    const { teachers, loading: teachersLoading, error: teachersError } = useSelector((state) => state.teachers);
    const { departments, loading: departmentsLoading, error: departmentsError } = useSelector((state) => state.departments);
    const { schedules, loading: schedulesLoading, error: schedulesError } = useSelector((state) => state.schedules);
    const { buildings, loading: buildingsLoading, error: buildingsError } = useSelector((state) => state.buildings);
    console.log('buildings: ', buildings);
    console.log('teachers: ', teachers);
    console.log('sections: ', sections);

    const location = useLocation();
    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState('');

    const table = location.state?.generatedMap ?? new Map();

    const [editSchedFirebaseId, setEditSchedFirebaseId] = useState(null);
    const [editSchedName, setEditSchedName] = useState('');
    const [timetable, setTimetable] = useState(table);

    const [searchSchedResult, setSearchSchedResult] = useState(schedules);
    const [searchSchedValue, setSearchSchedValue] = useState('');

    const handleEditClick = (FirebaseId) => {
        const newTimetable = convertStringDataToMap(schedules[FirebaseId].data);
        setEditSchedFirebaseId(FirebaseId);
        setEditSchedName(schedules[FirebaseId].name);
        setTimetable(newTimetable);
    };

    const resetTimetable = () => {
        setEditSchedFirebaseId(null);
        setEditSchedName('');
        setTimetable(new Map());
        resetURLState();
    };

    const resetURLState = () => {
        navigate(location.pathname, { state: null });
    };

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
        if (
            subjectsLoading ||
            programsLoading ||
            sectionsLoading ||
            teachersLoading ||
            ranksLoading ||
            departmentsLoading ||
            schedulesLoading ||
            buildingsLoading
        )
            return;

        debouncedSearch(searchSchedValue, schedules);
    }, [
        searchSchedValue,
        schedules,
        debouncedSearch,
        subjectsLoading,
        programsLoading,
        sectionsLoading,
        teachersLoading,
        ranksLoading,
        departmentsLoading,
        schedulesLoading,
        buildingsLoading,
    ]);

    const itemsPerPage = 5; // Change this to adjust the number of items per page
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(Object.values(searchSchedResult).length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchSchedResult).slice(indexOfFirstItem, indexOfLastItem);
    console.log('currentItems: ', currentItems);
    // const buildingData = {
    //     floors: 2,
    //     id: 1,
    //     image: null,
    //     name: 'BLDG 1',
    //     nearbyBuildings: [],
    //     rooms: [
    //         [
    //             { roomName: 'BLDG 1 - 101' },
    //             { roomName: 'BLDG 1 - 102' },
    //             { roomName: 'BLDG 1 - 103' },
    //             { roomName: 'BLDG 1 - 104' },
    //             { roomName: 'BLDG 1 - 105' },
    //         ],
    //         [
    //             { roomName: 'BLDG 1 - 201' },
    //             { roomName: 'BLDG 1 - 202' },
    //             { roomName: 'BLDG 1 - 203' },
    //             { roomName: 'BLDG 1 - 204' },
    //             { roomName: 'BLDG 1 - 205' },
    //         ],
    //     ],
    // };

    // const string_building = JSON.stringify(buildingData, null, 2);

    // console.log('string: ', string_building);

    // const parsed_building = JSON.parse(string_building);
    // console.log('parsed_building: ', parsed_building);

    if (
        subjectsLoading ||
        programsLoading ||
        sectionsLoading ||
        teachersLoading ||
        ranksLoading ||
        departmentsLoading ||
        schedulesLoading ||
        buildingsLoading
    ) {
        return (
            <div className='w-full flex justify-center items-center h-[50vh]'>
                <span className='loading loading-bars loading-lg'></span>
            </div>
        );
    }

    if (
        subjectsError ||
        programsError ||
        sectionsError ||
        teachersError ||
        ranksError ||
        departmentsError ||
        schedulesError ||
        buildingsError
    ) {
        return (
            <div role='alert' className='alert alert-error alert-soft'>
                <span>
                    {subjectsError ||
                        programsError ||
                        sectionsError ||
                        teachersError ||
                        ranksError ||
                        departmentsError ||
                        schedulesError ||
                        buildingsError}
                </span>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className='flex flex-col gap-4'>
                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body mb-4'>
                        <div className='flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5'>
                            {currentItems.length > 0 && (
                                <div className='join flex justify-center mb-4 md:mb-0'>
                                    <button
                                        className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
                                        onClick={() => {
                                            if (currentPage > 1) {
                                                setCurrentPage(currentPage - 1);
                                            }
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
                                        <th className='whitespace-nowrap'>Status</th>
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
                                                <th>{schedule.id}</th>

                                                <td>{schedule.name}</td>
                                                <td>
                                                    <div
                                                        className={`badge ${
                                                            schedule.status === 'Verified' ? 'badge-success' : 'badge-error'
                                                        }`}
                                                    >
                                                        {schedule.status}
                                                    </div>
                                                </td>
                                                <td className='w-28'>
                                                    <div className='flex'>
                                                        <button
                                                            className='btn btn-xs btn-ghost text-blue-500'
                                                            onClick={() => handleEditClick(schedule.id)}
                                                        >
                                                            <RiEdit2Fill size={20} />
                                                        </button>

                                                        <DeleteData id={schedule.id} collection={'schedules'} />
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

                {timetable.size > 0 && (
                    <div className='card w-full bg-base-100 shadow-md'>
                        <button className='absolute top-2 right-2 text-gray-500 hover:text-gray-700' onClick={resetTimetable}>
                            ✖
                        </button>
                        <div className='card-body'>
                            <ModifyTimetableContainer
                                subjects={subjects}
                                programs={programs}
                                sections={sections}
                                teachers={teachers}
                                ranks={ranks}
                                departments={departments}
                                schedules={schedules}
                                buildings={buildings}
                                hashMap={timetable}
                                timetableName={editSchedName}
                                firebaseId={editSchedFirebaseId}
                                errorMessage={errorMessage}
                                setErrorMessage={setErrorMessage}
                                errorField={errorField}
                                setErrorField={setErrorField}
                            />
                        </div>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
};

export default TimetableListContainer;
