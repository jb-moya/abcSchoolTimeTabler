import Guest from '../features/guest/search';
import { themeChange } from 'theme-change';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BellIcon from '@heroicons/react/24/outline/BellIcon';
import Bars3Icon from '@heroicons/react/24/outline/Bars3Icon';
import MoonIcon from '@heroicons/react/24/outline/MoonIcon';
import SunIcon from '@heroicons/react/24/outline/SunIcon';
import { openRightDrawer } from '@features/common/rightDrawerSlice';
import { RIGHT_DRAWER_TYPES } from '@utils/globalConstantUtil';
import { NavLink, Routes, Link, useLocation } from 'react-router-dom';
import NavBar from '../features/guest/NavBar';
import Search from '../features/guest/Search';



function ExternalPage() {
    const dispatch = useDispatch();
    const { noOfNotifications, pageTitle } = useSelector(
        (state) => state.header
    );
    const [currentTheme, setCurrentTheme] = useState(
        localStorage.getItem('theme') || 'dark' // Default to light mode
    );

    useEffect(() => {
        themeChange(false); // Initialize themeChange for Tailwind/DaisyUI

        const storedTheme = localStorage.getItem('theme');

        // Set theme based on localStorage or default to light
        if (!storedTheme) {
            localStorage.setItem('theme', 'light');
            setCurrentTheme('light');
            document.documentElement.setAttribute('data-theme', 'dark');
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

    function logoutUser() {
        localStorage.clear();
        window.location.href = '/';
    }

    function goToLoginPage() {
        window.location.href = '/login';
    }

    return (
        <div data-theme="dark" className="h-screen">
            <div className="bg-[#fdf0d5] h-full">
                <div className="bg-[#003049] h-full flex flex-col">
                    {/* Navigation Bar */}
                    <NavBar />

                    {/* Main Content */}
                    <div className="flex flex-col items-center justify-center flex-grow mx-auto px-4 w-full max-w-screen-xl text-center">
                        {/* Search Component */}
                        <Search />
                    </div>
                </div>
            </div>



            {/* <div className="navbar sticky top-0 bg-base-100 z-10">
                <div className="flex-1 flex items-center">
                    <label
                        htmlFor="left-sidebar-drawer"
                        className="btn btn-primary drawer-button lg:hidden"
                    >
                        <Bars3Icon className="h-5 inline-block w-5" />
                    </label>
                    <div className="mb-2 flex items-center space-x-2">
                        <img
                            className="mask mask-squircle w-10"
                            src="/Batasan Logo.png"
                            alt="BHS Logo"
                        />
                        <div className="text-xl font-semibold">
                            BHS Scheduler
                        </div>
                    </div>
                </div> */}

            {/* <div className="flex-none"> */}
            {/* Theme Toggle */}
            {/* <button
                        onClick={toggleTheme}
                        className="btn btn-ghost btn-circle"
                    >
                        {currentTheme === 'light' ? (
                            <MoonIcon className="w-6 h-6" />
                        ) : (
                            <SunIcon className="w-6 h-6" />
                        )}
                    </button>

                    <button onClick={goToLoginPage}>Log in</button>
                </div>
            </div> */}

            {/* Search Input Centered on Screen */}
            {/* <div className="flex justify-center items-center min-h-screen">
                <div className="w-full max-w-md p-4">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div> */}

            {/* <Guest /> */}
        </div>
    );
}

export default ExternalPage;
