// All components mapping with path for internal routes

import { lazy } from 'react';

const Dashboard = lazy(() => import('../pages/protected/Dashboard'));
const Welcome = lazy(() => import('../pages/protected/Welcome'));
const Page404 = lazy(() => import('../pages/404'));
const Blank = lazy(() => import('../pages/protected/Blank'));
const Leads = lazy(() => import('../pages/protected/Leads'));
const Integration = lazy(() => import('../pages/protected/Integration'));
const Users = lazy(() => import('../pages/protected/admin/Users'));
const Team = lazy(() => import('../pages/protected/Team'));
const Transactions = lazy(() => import('../pages/protected/Transactions'));
const Bills = lazy(() => import('../pages/protected/Bills'));
const ProfileSettings = lazy(() => import('../pages/protected/ProfileSettings'));
const GettingStarted = lazy(() => import('../pages/GettingStarted'));
const DocFeatures = lazy(() => import('../pages/DocFeatures'));
const DocComponents = lazy(() => import('../pages/DocComponents'));
const Timetable = lazy(() => import('../pages/protected/admin/Timetable'));
const ModifyTeachers = lazy(() => import('../pages/protected/admin/ModifyTeachers'));
const ModifySubjects = lazy(() => import('../pages/protected/admin/ModifySubjects'));
const ModifySections = lazy(() => import('../pages/protected/admin/ModifySections'));
const ModifyDepartments = lazy(() => import('../pages/protected/admin/ModifyDepartments'));
const RoomMapping = lazy(() => import('../pages/protected/admin/RoomMapping'));
const ModifyTimetable = lazy(() => import('../pages/protected/admin/ModifyTimeTable'));
const DisplaySectionSchedule = lazy(() => import('../pages/protected/reports/SectionSchedules'));
const DisplaySubjectSchedule = lazy(() => import('../pages/protected/reports/SubjectSchedules'));
const DisplayTeacherSchedule = lazy(() => import('../pages/protected/reports/TeacherSchedules'));

const routes = [
    {
        path: '/dashboard', // the url
        component: Dashboard, // view rendered
    },
    {
        path: '/admin/generate-timetable', // the url
        component: Timetable, // view rendered
        permissions: ['Generate Timetable'],
    },
    {
        path: '/admin/modify-teachers', // the url
        component: ModifyTeachers, // view rendered
        permissions: ['Modify Teachers'],
    },
    {
        path: '/admin/modify-subjects', // the url
        component: ModifySubjects, // view rendered
        permissions: ['Modify Subjects and Programs'],
    },
    {
        path: '/admin/modify-sections', // the url
        component: ModifySections, // view rendered
        permissions: ['Modify Sections'],
    },
    {
        path: '/admin/modify-departments', // the url
        component: ModifyDepartments, // view rendered
        permissions: ['Modify Departments'],
    },
    {
        path: '/admin/users',
        component: Users,
        role: 'super admin',
        permissions: ['Modify Users'],
    },
    {
        path: '/admin/room-mapping', // the url
        component: RoomMapping, // view rendered
        permissions: ['Room Utilization'],
    },
    {
        path: '/admin/modify-timetable', // the url
        component: ModifyTimetable, // view rendered
        permissions: ['Modify TimeTable'],
    },
    {
        path: '/reports/display-teachers-schedule', // the url
        component: DisplayTeacherSchedule, // view rendered
    },
    {
        path: '/reports/display-subjects-schedule', // the url
        component: DisplaySubjectSchedule, // view rendered
    },
    {
        path: '/reports/display-sections-schedule', // the url
        component: DisplaySectionSchedule, // view rendered
    },
    {
        path: '/welcome', // the url
        component: Welcome, // view rendered
    },
    {
        path: '/leads',
        component: Leads,
    },
    {
        path: '/settings-team',
        component: Team,
    },
    {
        path: '/transactions',
        component: Transactions,
    },
    {
        path: '/settings-profile',
        component: ProfileSettings,
    },
    {
        path: '/settings-billing',
        component: Bills,
    },
    {
        path: '/getting-started',
        component: GettingStarted,
    },
    {
        path: '/features',
        component: DocFeatures,
    },
    {
        path: '/components',
        component: DocComponents,
    },
    {
        path: '/integration',
        component: Integration,
    },
    {
        path: '/404',
        component: Page404,
    },
    {
        path: '/blank',
        component: Blank,
    },
];

export default routes;
