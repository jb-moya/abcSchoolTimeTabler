import { useState } from 'react';
import DashboardStats from './components/DashboardStats';
import UserGroupIcon from '@heroicons/react/24/outline/UserGroupIcon';

import BuildingOfficeIcon from '@heroicons/react/24/outline/BuildingOfficeIcon';
import BookOpenIcon from '@heroicons/react/24/outline/BookOpenIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import RectangleGroupIcon from '@heroicons/react/24/outline/RectangleGroupIcon';
import ComputerDesktopIcon from '@heroicons/react/24/outline/ComputerDesktopIcon';

import { useSelector } from 'react-redux';

function Dashboard() {
    const { subjects, loading: subjectsLoading, error: subjectsError } = useSelector((state) => state.subjects);
    const { programs, loading: programsLoading, error: programsError } = useSelector((state) => state.programs);
    const { sections, loading: sectionsLoading, error: sectionsError } = useSelector((state) => state.sections);
    const { ranks, loading: ranksLoading, error: ranksError } = useSelector((state) => state.ranks);
    const { teachers, loading: teachersLoading, error: teachersError } = useSelector((state) => state.teachers);
    const { departments, loading: departmentsLoading, error: departmentsError } = useSelector((state) => state.departments);
    const { schedules, loading: schedulesLoading, error: schedulesError } = useSelector((state) => state.schedules);
    const { buildings, loading: buildingsLoading, error: buildingsError } = useSelector((state) => state.buildings);

    // const dispatch = useDispatch();
    const statsData = [
        {
            title: 'Subjects',
            value: subjects ? Object.keys(subjects).length.toString() : '0',
            icon: <BookOpenIcon className='w-8 h-8' />,
            description: 'Total number of subjects for all programs.',
            loading: subjectsLoading,
        },
        {
            title: 'Teachers',
            value: teachers ? Object.keys(teachers).length.toString() : '0',
            icon: <UserGroupIcon className='w-8 h-8' />,
            description: 'Combined departments.',
            loading: teachersLoading,
        },
        {
            title: 'Ranks',
            value: ranks ? Object.keys(ranks).length.toString() : '0',
            icon: <ChartBarIcon className='w-8 h-8' />,
            description: 'The total number of teacher ranks within the school.',
            loading: ranksLoading,
        },
        {
            title: 'Sections',
            value: sections ? Object.keys(sections).length.toString() : '0',
            icon: <RectangleGroupIcon className='w-8 h-8' />,
            description: 'For all programs.',
            loading: sectionsLoading,
        },
        {
            title: 'Programs',
            value: programs ? Object.keys(programs).length.toString() : '0',
            icon: <BookOpenIcon className='w-8 h-8' />,
            description: 'The total number of programs within the school.',
            loading: programsLoading,
        },
        {
            title: 'Buildings',
            value: buildings ? Object.keys(buildings).length.toString() : '0',
            icon: <BuildingOfficeIcon className='w-8 h-8' />,
            description: 'The total number of buildings currently in use.',
            loading: buildingsLoading,
        },
        {
            title: 'Departments',
            value: departments ? Object.keys(departments).length.toString() : '0',
            icon: <ComputerDesktopIcon className='w-8 h-8' />,
            description: 'The total number of departments within the school.',
            loading: departmentsLoading,
        },
        {
            title: 'Schedules',
            value: schedules ? Object.keys(schedules).length.toString() : '0',
            icon: <BookOpenIcon className='w-8 h-8' />,
            description: 'The total number of generated schedules saved.',
            loading: schedulesLoading,
        },
    ];

    return (
        <>
            <div className='grid lg:grid-cols-3 mt-2 md:grid-cols-2 grid-cols-1 gap-6'>
                {statsData.map((d, k) => (
                    <DashboardStats key={k} {...d} colorIndex={k} />
                ))}
            </div>
        </>
    );
}

export default Dashboard;
