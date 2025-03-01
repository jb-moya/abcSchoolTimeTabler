import routes from '../routes/sidebar';
import { NavLink, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import SidebarSubmenu from './SidebarSubmenu';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import { useDispatch } from 'react-redux';
import { getAuthUserUid } from '../utils/localStorageUtils';
import { GoCopy } from 'react-icons/go';

function LeftSidebar() {
    const location = useLocation();
    const uid = getAuthUserUid();
    const navigate = useNavigate();

    const dispatch = useDispatch();

    const close = (e) => {
        document.getElementById('left-sidebar-drawer').click();
    };

    const openInNewTab = (path) => {
        const baseURL = window.location.origin;
        window.open(`${baseURL}${path}`, '_blank');
    };

    const handleOpenSearch = () => {
        openInNewTab('/search/' + uid);
    };

    return (
        <div className='drawer-side  z-30  '>
            <label htmlFor='left-sidebar-drawer' className='drawer-overlay'></label>
            <ul className='menu  pt-2 w-80 bg-base-100 min-h-full   text-base-content'>
                <button
                    className='btn btn-ghost bg-base-300  btn-circle z-50 top-0 right-0 mt-4 mr-2 absolute lg:hidden'
                    onClick={() => close()}
                >
                    <XMarkIcon className='h-5 inline-block w-5' />
                </button>

                <div className='mb-3'>
                    <div className='flex items-center gap-2'>
                        <div>
                            <button
                                className='text-xl flex items-center font-semibold'
                                onClick={() => navigate('/app/dashboard')}
                            >
                                <img className='mask self-start mask-squircle w-10' src='/Batasan Logo.png' alt='DashWind Logo' />
                                BHS Timetabling
                            </button>
                            <div className='pl-10 flex gap-2'>
                                <div className='tooltip tooltip-bottom' data-tip={`redirect`}>
                                    <button onClick={handleOpenSearch}>link to search</button>
                                </div>
                                <div className='tooltip tooltip-bottom' data-tip='copy link'>
                                    <button className=''>
                                        <GoCopy />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {routes.map((route, k) => {
                    return (
                        <li className='' key={k}>
                            {route.submenu ? (
                                <SidebarSubmenu {...route} />
                            ) : (
                                <NavLink
                                    end
                                    to={route.path}
                                    className={({ isActive }) => `${isActive ? 'font-semibold  bg-base-200 ' : 'font-normal'}`}
                                >
                                    {route.icon} {route.name}
                                    {location.pathname === route.path ? (
                                        <span
                                            className='absolute inset-y-0 left-0 w-1 rounded-tr-md rounded-br-md bg-primary '
                                            aria-hidden='true'
                                        ></span>
                                    ) : null}
                                </NavLink>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default LeftSidebar;
