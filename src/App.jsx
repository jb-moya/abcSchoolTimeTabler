import { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { themeChange } from 'theme-change';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './pages/ProtectedRoute';
import { useSelector } from 'react-redux';
import useAuth from './app/useAuth';
import useFirestoreCollectionListeners from './firebase/listeners/collectionListeners.js';

import {
    upsert as upsertTimetableConfiguration,
    remove as removeTimetableConfiguration,
    setLoading as setTimetableConfigurationLoading,
} from './features/slice/timetableConfigurationSlice.jsx';
import {
    upsert as upsertDepartments,
    remove as removeDepartments,
    setLoading as setDepartmentsLoading,
} from './features/slice/departmentsSlice.jsx';
import {
    upsert as upsertTeachers,
    remove as removeTeachers,
    setLoading as setTeachersLoading,
} from './features/slice/teachersSlice.jsx';
import {
    upsert as upsertSections,
    remove as removeSections,
    setLoading as setSectionsLoading,
} from './features/slice/sectionsSlice.jsx';
import {
    upsert as upsertSubjects,
    remove as removeSubjects,
    setLoading as setSubjectsLoading,
} from './features/slice/subjectsSlice.jsx';
import { upsert as upsertRanks, remove as removeRanks, setLoading as setRanksLoading } from './features/slice/ranksSlice.jsx';
import {
    upsert as upsertPrograms,
    remove as removePrograms,
    setLoading as setProgramsLoading,
} from './features/slice/programsSlice.jsx';
import {
    upsert as upsertBuildings,
    remove as removeBuildings,
    setLoading as setBuildingsLoading,
} from './features/slice/buildingsSlice.jsx';
import {
    upsert as upsertSchedules,
    remove as removeSchedules,
    setLoading as setSchedulesLoading,
} from './features/slice/schedulesSlice.jsx';
import {
    upsert as upsertLogs,
    remove as removeLogs,
    setLoading as setLogsLoading,
} from './features/slice/notificationUserLogs.jsx';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { firestore } from './firebase/firebase.js';

const Layout = lazy(() => import('./containers/Layout'));
const Login = lazy(() => import('./pages/Login.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Register = lazy(() => import('./pages/Register'));
const Documentation = lazy(() => import('./pages/Documentation'));
const GuestPage = lazy(() => import('./pages/Guest.jsx'));
const SuspenseContent = lazy(() => import('./containers/SuspenseContent'));
const Authentication = lazy(() => import('./pages/Authentication'));
const Page404 = lazy(() => import('./pages/404'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

const collections = [
    {
        addAction: upsertTimetableConfiguration,
        updateAction: upsertTimetableConfiguration,
        removeAction: removeTimetableConfiguration,
        setLoading: setTimetableConfigurationLoading,
        queryBuilder: query(collection(firestore, 'timetableConfiguration')),
    },
    {
        addAction: upsertDepartments,
        updateAction: upsertDepartments,
        removeAction: removeDepartments,
        setLoading: setDepartmentsLoading,
        queryBuilder: query(collection(firestore, 'departments')),
    },
    {
        addAction: upsertTeachers,
        updateAction: upsertTeachers,
        removeAction: removeTeachers,
        setLoading: setTeachersLoading,
        queryBuilder: query(collection(firestore, 'teachers')),
    },
    {
        addAction: upsertSections,
        updateAction: upsertSections,
        removeAction: removeSections,
        setLoading: setSectionsLoading,
        queryBuilder: query(collection(firestore, 'sections')),
    },
    {
        addAction: upsertSubjects,
        updateAction: upsertSubjects,
        removeAction: removeSubjects,
        setLoading: setSubjectsLoading,
        queryBuilder: query(collection(firestore, 'subjects')),
    },
    {
        addAction: upsertRanks,
        updateAction: upsertRanks,
        removeAction: removeRanks,
        setLoading: setRanksLoading,
        queryBuilder: query(collection(firestore, 'ranks')),
    },
    {
        addAction: upsertPrograms,
        updateAction: upsertPrograms,
        removeAction: removePrograms,
        setLoading: setProgramsLoading,
        queryBuilder: query(collection(firestore, 'programs')),
    },
    {
        addAction: upsertBuildings,
        updateAction: upsertBuildings,
        removeAction: removeBuildings,
        setLoading: setBuildingsLoading,
        queryBuilder: query(collection(firestore, 'buildings')),
    },
    {
        addAction: upsertSchedules,
        updateAction: upsertSchedules,
        removeAction: removeSchedules,
        setLoading: setSchedulesLoading,
        queryBuilder: query(collection(firestore, 'schedules')),
    },
    {
        addAction: upsertLogs,
        updateAction: upsertLogs,
        removeAction: removeLogs,
        setLoading: setLogsLoading,
        queryBuilder: query(collection(firestore, 'logs'), where('t', '>', new Date()), orderBy('t')),
    },
];

function App() {
    useAuth();
    const { user, loading: userLoading } = useSelector((state) => state.user);
    useFirestoreCollectionListeners(user ? collections : []);

    console.log('🚀 ~ App ~ user:', user);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        themeChange(false);
    }, []);

    if (userLoading) {
        return <SuspenseContent />;
    }

    return (
        <>
            <Suspense fallback={<SuspenseContent />}>
                <Router>
                    <Routes>
                        <Route path='/' element={<Navigate to='/app/dashboard' replace />} />
                        <Route path='/search/:uid' element={<GuestPage />} />
                        <Route
                            path='/auth/login'
                            element={userLoading ? <SuspenseContent /> : user ? <Navigate to='/app/dashboard' /> : <Login />}
                        />

                        {/* <Route
                            path='/auth/register'
                            element={user && !userLoading ? <Navigate to='/app/dashboard' /> : <Register />}
                        /> */}
                        <Route path='/404' element={<Page404 />} />
                        <Route path='/auth/:mode' element={<Authentication />} />
                        <Route path='/forgot-password' element={<ForgotPassword />} />
                        <Route path='/documentation' element={<Documentation />} />
                        <Route path='/unauthorized' element={<Unauthorized />} />
                        {/* Place new routes over this */}
                        <Route
                            path='/app/*'
                            element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }
                        />
                        {/* <Route path='*' element={<Navigate to={token ? '/app/welcome' : '/search'} replace />} /> */}
                        {/* <Route path='*' element={<Navigate to={user ? '/app/welcome' : '/search'} replace />} /> */}
                    </Routes>
                </Router>
            </Suspense>
        </>
    );
}

export default App;
