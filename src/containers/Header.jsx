import { themeChange } from 'theme-change';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BellIcon from '@heroicons/react/24/outline/BellIcon';
import Bars3Icon from '@heroicons/react/24/outline/Bars3Icon';
import MoonIcon from '@heroicons/react/24/outline/MoonIcon';
import SunIcon from '@heroicons/react/24/outline/SunIcon';
import { openRightDrawer } from '../features/common/rightDrawerSlice';
import { RIGHT_DRAWER_TYPES } from '../utils/globalConstantUtil';
import { useNavigate } from 'react-router-dom';
import useAuth from '../app/useAuth';

import { NavLink, Routes, Link, useLocation } from 'react-router-dom';
import { logoutUser } from '../features/userSlice';

function Header() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { noOfNotifications, pageTitle } = useSelector((state) => state.header);
    const [currentTheme, setCurrentTheme] = useState(
        localStorage.getItem('theme') || 'light' // Default to light mode
    );
    const { user, loading: userLoading } = useAuth();

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
                            {noOfNotifications > 0 && (
                                <span className='indicator-item badge badge-secondary badge-sm'>{noOfNotifications}</span>
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
