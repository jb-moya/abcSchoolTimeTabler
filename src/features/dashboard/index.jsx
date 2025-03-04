import { useEffect, useState } from 'react';
import DashboardStats from './components/DashboardStats';
import UserGroupIcon from '@heroicons/react/24/outline/UserGroupIcon';
import { getAllEntitiesFromDB, STORE_NAMES } from '../../indexedDB'; // Import your IndexedDB helpers
// import { useDispatch } from 'react-redux';
// import { showNotification } from '../common/headerSlice';

import BuildingOfficeIcon from '@heroicons/react/24/outline/BuildingOfficeIcon';
import BookOpenIcon from '@heroicons/react/24/outline/BookOpenIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import RectangleGroupIcon from '@heroicons/react/24/outline/RectangleGroupIcon';
import ComputerDesktopIcon from '@heroicons/react/24/outline/ComputerDesktopIcon';

function Dashboard() {
    // const dispatch = useDispatch();
    const [statsData, setStatsData] = useState([
        {
            title: 'Subjects',
            value: '0',
            icon: <BookOpenIcon className='w-8 h-8' />,
            description: 'Total number of subjects for all programs.',
        },
        {
            title: 'Teachers',
            value: '0',
            icon: <UserGroupIcon className='w-8 h-8' />,
            description: 'Combined departments.',
        },
        { title: 'Ranks', value: '0', icon: <ChartBarIcon className='w-8 h-8' />, description: 'The total number of teacher ranks within the school.' },
        {
            title: 'Sections',
            value: '0',
            icon: <RectangleGroupIcon className='w-8 h-8' />,
            description: 'For all programs.',
        },
        { title: 'Buildings', value: '0', icon: <BuildingOfficeIcon className='w-8 h-8' />, description: 'The total number of buildings currently in use.' },
        { title: 'Departments', value: '0', icon: <ComputerDesktopIcon className='w-8 h-8' />, description: 'The total number of departments within the school.' },
    ]);

    const fetchStats = async () => {
        try {
            const counts = await Promise.all(
                Object.values(STORE_NAMES).map(async (storeName) => {
                    const entities = await getAllEntitiesFromDB(storeName);
                    return Object.keys(entities).length;
                })
            );

            setStatsData((prevStats) =>
                prevStats.map((stat, index) => ({
                    ...stat,
                    value: counts[index].toString(),
                }))
            );
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // const updateDashboardPeriod = (newRange) => {
    //     dispatch(showNotification({ message: `Period updated to ${newRange.startDate} to ${newRange.endDate}`, status: 1 }));
    // };

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
