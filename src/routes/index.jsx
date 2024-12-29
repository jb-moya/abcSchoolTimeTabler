// All components mapping with path for internal routes

import { lazy } from 'react';

const Dashboard = lazy(() => import('../pages/protected/Dashboard'));
const Welcome = lazy(() => import('../pages/protected/Welcome'));
const Page404 = lazy(() => import('../pages/protected/404'));
const Blank = lazy(() => import('../pages/protected/Blank'));
const Charts = lazy(() => import('../pages/protected/Charts'));
const Leads = lazy(() => import('../pages/protected/Leads'));
const Integration = lazy(() => import('../pages/protected/Integration'));
const Calendar = lazy(() => import('../pages/protected/Calendar'));
const Team = lazy(() => import('../pages/protected/Team'));
const Transactions = lazy(() => import('../pages/protected/Transactions'));
const Bills = lazy(() => import('../pages/protected/Bills'));
const ProfileSettings = lazy(() =>
  import('../pages/protected/ProfileSettings')
);
const GettingStarted = lazy(() => import('../pages/GettingStarted'));
const DocFeatures = lazy(() => import('../pages/DocFeatures'));
const DocComponents = lazy(() => import('../pages/DocComponents'));
const Timetable = lazy(() => import('../pages/protected/admin/Timetable'));
const ModifyTeachers = lazy(() =>
  import('../pages/protected/admin/ModifyTeachers')
);
const ModifySubjects = lazy(() =>
  import('../pages/protected/admin/ModifySubjects')
);
const ModifySections = lazy(() =>
  import('../pages/protected/admin/ModifySections')
);
const ModifyDepartments = lazy(() =>
  import('../pages/protected/admin/ModifyDepartments')
);
const RoomMapping = lazy(() =>
  import('../pages/protected/admin/RoomMapping')
);
const DisplaySectionSchedule = lazy(() =>
  import('../pages/protected/reports/SectionSchedules')
);
const DisplaySubjectSchedule = lazy(() =>
  import('../pages/protected/reports/SubjectSchedules')
);
const DisplayTeacherSchedule = lazy(() =>
  import('../pages/protected/reports/TeacherSchedules')
);
const routes = [
  {
    path: '/dashboard', // the url
    component: Dashboard, // view rendered
  },
  {
    path: '/admin/generate-timetable', // the url
    component: Timetable, // view rendered
  },
  {
    path: '/admin/modify-teachers', // the url
    component: ModifyTeachers, // view rendered
  },
  {
    path: '/admin/modify-subjects', // the url
    component: ModifySubjects, // view rendered
  },
  {
    path: '/admin/modify-sections', // the url
    component: ModifySections, // view rendered
  },
  {
    path: '/admin/modify-departments', // the url
    component: ModifyDepartments, // view rendered
  },
  {
    path: '/admin/room-mapping', // the url
    component: RoomMapping, // view rendered
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
    path: '/calendar',
    component: Calendar,
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
    path: '/charts',
    component: Charts,
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
