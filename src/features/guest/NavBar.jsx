import MoonIcon from '@heroicons/react/24/outline/MoonIcon';
import SunIcon from '@heroicons/react/24/outline/SunIcon';
import { themeChange } from 'theme-change';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NavBar = () => {
    const navigate = useNavigate();
    // const [currentTheme, setCurrentTheme] = useState(
    //     localStorage.getItem('theme') || 'dark' // Default to dark mode
    // );

    // useEffect(() => {
    //     themeChange(false); // Initialize themeChange for Tailwind/DaisyUI

    //     const storedTheme = localStorage.getItem('theme');

    //     // Set theme based on localStorage or default to dark
    //     if (!storedTheme) {
    //         localStorage.setItem('theme', 'dark');
    //         setCurrentTheme('dark');
    //         document.documentElement.setAttribute('data-theme', 'dark');
    //     } else {
    //         setCurrentTheme(storedTheme);
    //         document.documentElement.setAttribute('data-theme', storedTheme);
    //     }
    // }, []);

    // function logoutUser() {
    //     localStorage.clear();
    //     window.location.href = '/';
    // }

    function goToLoginPage() {
        // window.location.href = '/login';
        navigate('/auth/login');
    }

    // const toggleTheme = () => {
    //     const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    //     setCurrentTheme(newTheme);
    //     localStorage.setItem('theme', newTheme);
    //     document.documentElement.setAttribute('data-theme', newTheme);
    // };

    return (
        <div className='navbar bg-[#003049] px-0 md:px-10'>
            <div className='navbar-start'>
                <div className='dropdown'>
                    <div tabIndex={0} role='button' className='btn btn-ghost lg:hidden'>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-5 w-5'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h8m-8 6h16' />
                        </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className='menu menu-sm  dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow'
                    >
                        <li>
                            <a>FAQ</a>
                        </li>
                        <li>
                            <a>ABOUT</a>
                        </li>
                    </ul>
                </div>
                <a className='btn btn-ghost text-xl z-30'>
                    <img className='mask mask-squircle w-12' src='/Batasan Logo.png' alt='BHS Logo' />
                    BHNHS TIMETABLING
                </a>
            </div>
            {/* <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <a>FAQ</a>
                    </li>
                    <li>
                        <a>ABOUT</a>
                    </li>
                </ul>
            </div> */}
            <div className='navbar-end'>
                {/* Theme Toggle
                <button onClick={toggleTheme} className="btn btn-ghost btn-circle">
                    {currentTheme === 'light' ? (
                        <MoonIcon className="w-6 h-6" />
                    ) : (
                        <SunIcon className="w-6 h-6" />
                    )}
                </button> */}
                <ul className='menu menu-horizontal px-2 hidden lg:flex'>
                    <li>
                        <a>FAQ</a>
                    </li>
                    <li>
                        <a>ABOUT</a>
                    </li>
                </ul>
                {/* <a onClick={goToLoginPage} className='btn btn-outline rounded-3xl'>
                    Log In
                </a>
            </div>
        </div>
    );
};

export default NavBar;
