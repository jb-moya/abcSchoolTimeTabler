/** Icons are imported separatly to reduce build time */
import BellIcon from '@heroicons/react/24/outline/BellIcon';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import TableCellsIcon from '@heroicons/react/24/outline/TableCellsIcon';
import WalletIcon from '@heroicons/react/24/outline/WalletIcon';
import CodeBracketSquareIcon from '@heroicons/react/24/outline/CodeBracketSquareIcon';
import DocumentIcon from '@heroicons/react/24/outline/DocumentIcon';
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import ArrowRightOnRectangleIcon from '@heroicons/react/24/outline/ArrowRightOnRectangleIcon';
import UserIcon from '@heroicons/react/24/outline/UserIcon';
import Cog6ToothIcon from '@heroicons/react/24/outline/Cog6ToothIcon';
import BoltIcon from '@heroicons/react/24/outline/BoltIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import CurrencyDollarIcon from '@heroicons/react/24/outline/CurrencyDollarIcon';
import InboxArrowDownIcon from '@heroicons/react/24/outline/InboxArrowDownIcon';
import UsersIcon from '@heroicons/react/24/outline/UsersIcon';
import Table from '@heroicons/react/24/outline/TableCellsIcon';

import KeyIcon from '@heroicons/react/24/outline/KeyIcon';
import DocumentDuplicateIcon from '@heroicons/react/24/outline/DocumentDuplicateIcon';

const iconClasses = `h-6 w-6`;
const submenuIconClasses = `h-5 w-5`;

const routes = [
  {
    path: '/app/dashboard',
    icon: <Squares2X2Icon className={iconClasses} />,
    name: 'Dashboard',
  },
  {
    path: '', //no url needed as this has submenu
    icon: <Table className={`${iconClasses} inline`} />, // icon component
    name: 'Timetable', // name that appear in Sidebar
    submenu: [
      {
        path: '/app/admin/generate-timetable',
        icon: <ArrowRightOnRectangleIcon className={submenuIconClasses} />,
        name: 'Generate Timetable',
      },
      {
        path: '/app/admin/modify-subjects', //url
        icon: <UserIcon className={submenuIconClasses} />, // icon component
        name: 'Modify Subjects and Programs', // name that appear in Sidebar
      },
      {
        path: '/app/admin/modify-teachers',
        icon: <KeyIcon className={submenuIconClasses} />,
        name: 'Modify Teachers',
      },
      {
        path: '/app/admin/modify-sections',
        icon: <DocumentIcon className={submenuIconClasses} />,
        name: 'Modify Section',
      },
      {
        path: '/app/admin/building-map',
        icon: <DocumentIcon className={submenuIconClasses} />,
        name: 'Room Utilization',
      },
    ],
  },
  {
    path: '', //no url needed as this has submenu
    icon: <Cog6ToothIcon className={`${iconClasses} inline`} />, // icon component
    name: 'Report Schedules', // name that appear in Sidebar
    submenu: [
      {
        path: '/app/reports/display-teachers-schedule', //url
        icon: <UserIcon className={submenuIconClasses} />, // icon component
        name: 'Teacher Schedule', // name that appear in Sidebar
      },
      {
        path: '/app/reports/display-sections-schedule',
        icon: <WalletIcon className={submenuIconClasses} />,
        name: 'Section Schedule',
      },
      {
        path: '/app/reports/display-subjects-schedule', // url
        icon: <UsersIcon className={submenuIconClasses} />, // icon component
        name: 'Subject Schedule', // name that appear in Sidebar
      },
    ],
  },
];

export default routes;
