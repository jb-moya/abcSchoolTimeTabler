import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { themeChange } from 'theme-change';
import useAuth from './app/useAuth.js';
import initializeApp from './app/init';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './pages/ProtectedRoute';
import { fetchSections } from './features/sectionSlice.jsx';
import { useDispatch } from 'react-redux';
import { listenToFirestore } from './features/sectionSlice.jsx';
// Importing pages
const Layout = lazy(() => import('./containers/Layout'));
const Login = lazy(() => import('./pages/Login.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Register = lazy(() => import('./pages/Register'));
const Documentation = lazy(() => import('./pages/Documentation'));
const GuestPage = lazy(() => import('./pages/Guest.jsx'));
const SuspenseContent = lazy(() => import('./containers/SuspenseContent'));
const Authentication = lazy(() => import('./pages/Authentication'));
const Page404 = lazy(() => import('./pages/404'));
// Initializing different libraries
// initializeApp()

// Check for login and initialize axios

function App() {
    const { user, loading } = useAuth();
    const dispatch = useDispatch();

    useEffect(() => {
        // Set the default theme to light on initial load
        document.documentElement.setAttribute('data-theme', 'light');
        // 👆 daisy UI themes initialization
        themeChange(false);


    }, []);

    useEffect(() => {
        console.log("Initial")
        const unsubscribe = dispatch(listenToFirestore('subjects'));

        return () => {
            unsubscribe(); // Cleanup listener on unmount
        };
    }, [dispatch]);

    if (loading) {
        return <SuspenseContent />; // Replace with your loader
    }

    return (
        <>
            <Suspense fallback={<SuspenseContent />}>
                <Router>
                    <Routes>
                        <Route path='/search/:uid' element={<GuestPage />} />
                        <Route path='/auth/login' element={user ? <Navigate to='/app/dashboard' /> : <Login />} />
                        <Route path='/auth/register' element={user ? <Navigate to='/app/dashboard' /> : <Register />} />
                        <Route path='/404' element={<Page404 />} />
                        <Route path='/auth/:mode' element={<Authentication />} />
                        <Route path='/forgot-password' element={<ForgotPassword />} />
                        <Route path='/documentation' element={<Documentation />} />
                        {/* Place new routes over this */}
                        <Route path='/app/*' element={<ProtectedRoute element={<Layout />} />} />
                        {/* <Route path='*' element={<Navigate to={token ? '/app/welcome' : '/search'} replace />} /> */}
                        {/* <Route path='*' element={<Navigate to={user ? '/app/welcome' : '/search'} replace />} /> */}
                    </Routes>
                </Router>
            </Suspense>
        </>
    );
}

export default App;
