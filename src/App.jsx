import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { themeChange } from 'theme-change';
import checkAuth from './app/auth';
import initializeApp from './app/init';
import { Suspense, lazy } from 'react';

// Importing pages
const Layout = lazy(() => import('./containers/Layout'));
const Login = lazy(() => import('./pages/Login.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Register = lazy(() => import('./pages/Register'));
const Documentation = lazy(() => import('./pages/Documentation'));
const GuestPage = lazy(() => import('./pages/Guest.jsx'));
const SuspenseContent = lazy(() => import('./containers/SuspenseContent'));
const Authentication = lazy(() => import('./pages/Authentication'));
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
            <Suspense fallback={<SuspenseContent />}>
                <Router>
                    <Routes>
                        <Route path='/search' element={<GuestPage />} />
                        {/* <Route path='/login' element={<Login />} /> */}
                        {/* <Route path='/register' element={<Register />} /> */}
                        <Route path='/auth/:mode' element={<Authentication />} />
                        <Route path='/forgot-password' element={<ForgotPassword />} />
                        {/* <Route path='/register' element={<Register />} /> */}
                        <Route path='/documentation' element={<Documentation />} />
                        {/* Place new routes over this */}
                        <Route path='/app/*' element={<Layout />} />
                        {/* <Route path='*' element={<Navigate to={token ? '/app/welcome' : '/search'} replace />} /> */}
                        <Route path='*' element={<Navigate to={token ? '/app/welcome' : '/search'} replace />} />
                    </Routes>
                </Router>
            </Suspense>
        </>
    );
}

export default App;
