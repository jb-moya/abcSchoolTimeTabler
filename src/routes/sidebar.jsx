import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import UsersIcon from '@heroicons/react/24/outline/UsersIcon';
import Table from '@heroicons/react/24/outline/TableCellsIcon';

import { MdOutlineMeetingRoom } from 'react-icons/md';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import { PiBooksThin } from 'react-icons/pi';
import { GrSchedules } from 'react-icons/gr';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { GrGroup } from 'react-icons/gr';

const iconClasses = `h-6 w-6`;
const submenuIconClasses = `h-5 w-5`;

const routes = [
    {
        path: '/app/dashboard',
        icon: <Squares2X2Icon className={iconClasses} />,
        name: 'Dashboard',
    },
    {
        path: '',
        icon: <Table className={`${iconClasses} inline`} />,
        name: 'Timetable',
        submenu: [
            {
                path: '/app/admin/generate-timetable',
                icon: <GrSchedules className={submenuIconClasses} />,
                name: 'Generate Timetable',
            },
            {
                path: '/app/admin/modify-subjects',
                icon: <PiBooksThin className={submenuIconClasses} />,
                name: 'Modify Subjects and Programs',
            },
            {
                path: '/app/admin/modify-teachers',
                icon: <FaChalkboardTeacher className={submenuIconClasses} />,
                name: 'Modify Teachers',
            },
            {
                path: '/app/admin/modify-sections',
                icon: <GrGroup className={submenuIconClasses} />,
                name: 'Modify Sections',
            },
            {
                path: '/app/admin/modify-departments',
                icon: <HiOutlineOfficeBuilding className={submenuIconClasses} />,
                name: 'Modify Departments',
            },
            {
                path: '/app/admin/room-mapping',
                icon: <MdOutlineMeetingRoom className={submenuIconClasses} />,
                name: 'Room Utilization',
            },
            {
                path: '/app/admin/modify-timetable',
                icon: <MdOutlineMeetingRoom className={submenuIconClasses} />,
                name: 'Modify TimeTable',
            },
        ],
    },
    {
        path: '/app/admin/users',
        icon: <UsersIcon className={`${iconClasses} inline`} />,
        name: 'Users',
    },
    {
        path: '',
        icon: <GrSchedules className={`${iconClasses} inline`} />,
        name: 'Report Schedules',
        submenu: [
            {
                path: '/app/reports/display-teachers-schedule',
                icon: <FaChalkboardTeacher className={submenuIconClasses} />,
                name: 'Teacher Schedule',
            },
            {
                path: '/app/reports/display-sections-schedule',
                icon: <GrGroup className={submenuIconClasses} />,
                name: 'Section Schedule',
            },
            {
                path: '/app/reports/display-subjects-schedule',
                icon: <UsersIcon className={submenuIconClasses} />,
                name: 'Subject Schedule',
            },
        ],
    },
];

export default routes;
