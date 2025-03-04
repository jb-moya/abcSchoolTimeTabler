import React, { lazy, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { themeChange } from 'theme-change';
import checkAuth from './app/auth';
import initializeApp from './app/init';

// Importing pages
const Layout = lazy(() => import('./containers/Layout'));
const Login = lazy(() => import('./pages/Login.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Register = lazy(() => import('./pages/Register'));
const Documentation = lazy(() => import('./pages/Documentation'));
const GuestPage = lazy(() => import('./pages/Guest.jsx'));

// Initializing different libraries
// initializeApp()

// Check for login and initialize axios
const token = checkAuth();

function App() {
    useEffect(() => {
        // Set the default theme to light on initial load
        document.documentElement.setAttribute('data-theme', 'light');
        // 👆 daisy UI themes initialization
        themeChange(false);
    }, []);

    return (
        <>
            <Router>
                <Routes>
                    <Route path='/search' element={<GuestPage />} />
                    <Route path='/search' element={<GuestPage />} />

                    <Route path='/login' element={<Login />} />
                    <Route path='/forgot-password' element={<ForgotPassword />} />
                    <Route path='/register' element={<Register />} />
                    <Route path='/documentation' element={<Documentation />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/forgot-password' element={<ForgotPassword />} />
                    <Route path='/register' element={<Register />} />
                    <Route path='/documentation' element={<Documentation />} />

                    {/* Place new routes over this */}
                    <Route path='/app/*' element={<Layout />} />
                    <Route path='/app/*' element={<Layout />} />

                    <Route path='*' element={<Navigate to={token ? '/app/welcome' : '/search'} replace />} />
                </Routes>
            </Router>
        </>
    );
}

export default App;
