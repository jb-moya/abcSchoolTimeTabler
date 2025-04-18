import { themeChange } from 'theme-change';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BellIcon from '@heroicons/react/24/outline/BellIcon';
import Bars3Icon from '@heroicons/react/24/outline/Bars3Icon';
import MoonIcon from '@heroicons/react/24/outline/MoonIcon';
import SunIcon from '@heroicons/react/24/outline/SunIcon';
import { openRightDrawer } from '../features/common/rightDrawerSlice';
import { RIGHT_DRAWER_TYPES } from '../utils/globalConstantUtil';

import { Link } from 'react-router-dom';
import { logoutUser } from '../features/userSlice';
import { resetNewLogsCount } from '../features/slice/notificationUserLogs';

function Header() {
    const dispatch = useDispatch();
    const { pageTitle } = useSelector((state) => state.header);
    const { newLogsCount } = useSelector((state) => state.notificationUserLogs);
    const [currentTheme, setCurrentTheme] = useState(
        localStorage.getItem('theme') || 'light' // Default to light mode
    );

    const [isPinging, setIsPinging] = useState(false); // State to track animation

    const { user, loading: userLoading } = useSelector((state) => state.user);

    useEffect(() => {
        themeChange(false); // Initialize themeChange for Tailwind/DaisyUI

        const storedTheme = localStorage.getItem('theme');

        // Set theme based on localStorage or default to light
        if (!storedTheme) {
            localStorage.setItem('theme', 'light');
            setCurrentTheme('light');
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            setCurrentTheme(storedTheme);
            document.documentElement.setAttribute('data-theme', storedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setCurrentTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const openNotification = () => {
        dispatch(
            openRightDrawer({
                header: 'Notifications',
                bodyType: RIGHT_DRAWER_TYPES.NOTIFICATION,
            })
        );
        dispatch(resetNewLogsCount());
    };

    function clearLocalStorage() {
        localStorage.clear();
    }

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser());
            clearLocalStorage();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    useEffect(() => {
        if (newLogsCount > 0) {
            setIsPinging(true);
            const timer = setTimeout(() => {
                setIsPinging(false); // Stop the ping animation after a short time
            }, 1000); // Adjust duration as needed
            return () => clearTimeout(timer); // Cleanup timeout on component unmount
        }
    }, [newLogsCount]);

    return (
        <>
            <div className='navbar sticky top-0 bg-base-100 z-10 '>
                <div className='flex-1 items-center flex gap-2'>
                    <label htmlFor='left-sidebar-drawer' className='btn btn-primary drawer-button lg:hidden'>
                        <Bars3Icon className='h-5 inline-block w-5' />
                    </label>
                    <h1 className='text-2xl font-semibold ml-2'>{pageTitle}</h1>
                </div>

                <div className='flex-none'>
                    {/* Theme Toggle */}
                    <button onClick={toggleTheme} className='btn btn-ghost btn-circle'>
                        {currentTheme === 'light' ? <MoonIcon className='w-6 h-6' /> : <SunIcon className='w-6 h-6' />}
                    </button>

                    {/* Notification icon */}
                    <button className='btn btn-ghost ml-4 btn-circle' onClick={openNotification}>
                        <div className='indicator'>
                            <BellIcon className='h-6 w-6' />
                            {newLogsCount > 0 && (
                                <span className='relative flex size-5 items-center justify-center'>
                                    <span className='absolute z-20 text-base-100'>{newLogsCount}</span>
                                    <span
                                        className={`absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 ${
                                            isPinging ? 'animate-ping' : ''
                                        }`}
                                    ></span>
                                    <span className='relative inline-flex size-5 rounded-full bg-accent'></span>
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Profile Icon */}
                    <div className='dropdown dropdown-end ml-4'>
                        <label tabIndex={0} className='btn btn-ghost'>
                            <div className='rounded-full flex items-center gap-2'>
                                <div>{userLoading ? '' : <div className='dropdown dropdown-end'>{user?.email}</div>}</div>
                                <div className='w-10 avatar'>
                                    <img src='/profile.png' alt='profile' />
                                </div>
                            </div>
                        </label>
                        <ul
                            tabIndex={0}
                            className='menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52'
                        >
                            <li className='justify-between'>
                                <Link to={'/app/settings-profile'}>Profile Settings</Link>
                            </li>
                            <div className='divider mt-0 mb-0'></div>
                            <li>
                                <a onClick={handleLogout}>Logout</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Header;
