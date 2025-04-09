import { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { themeChange } from 'theme-change';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './pages/ProtectedRoute';
import { useSelector } from 'react-redux';
import useAuth from './app/useAuth';
import useFirestoreCacheListener from './firebase/listeners/timetableConfigurationListener.js';
import {
    upsertTimetableConfiguration,
    removeTimetableConfiguration,
    setLoading as setTimetableConfigurationLoading,
} from './features/slice/timetableConfigurationSlice.jsx';
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

const collections = [
    {
        collectionPath: 'timetableConfiguration',
        addAction: upsertTimetableConfiguration,
        updateAction: upsertTimetableConfiguration,
        removeAction: removeTimetableConfiguration,
        setLoading: setTimetableConfigurationLoading,
    },
];

function App() {
    useAuth();
    useFirestoreCacheListener(collections);

    const { user } = useSelector((state) => state.user);

    console.log('🚀 ~ App ~ user:', user);

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
