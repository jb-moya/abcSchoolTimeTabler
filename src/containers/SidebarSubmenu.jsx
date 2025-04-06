import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function SidebarSubmenu({ submenu, name, icon }) {
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);
    const userInfo = useSelector((state) => state.user);

    const hasPermission = (menuItem) => {
        if (!menuItem.permissions || menuItem.permissions.length === 0) return true;
        if (userInfo?.user?.role === 'super admin') return true;
        if (!Array.isArray(userInfo?.user?.permissions)) return false;
        return menuItem.permissions.every((perm) => userInfo.user.permissions.includes(perm));
    };

    const visibleSubmenu = submenu.filter((item) => hasPermission(item));

    /** Open Submenu list if path found in routes, this is for directly loading submenu routes  first time */
    useEffect(() => {
        if (
            visibleSubmenu.filter((m) => {
                return m.path === location.pathname;
            })[0]
        )
            setIsExpanded(true);
    }, []);

    // Don't render anything if no visible submenu items
    if (visibleSubmenu.length === 0) return null;

    return (
        <div className='flex flex-col'>
            {/** Route header */}
            <div className='w-full block' onClick={() => setIsExpanded(!isExpanded)}>
                {icon} {name}
                <ChevronDownIcon
                    className={
                        'w-5 h-5 mt-1 float-right delay-400 duration-500 transition-all  ' + (isExpanded ? 'rotate-180' : '')
                    }
                />
            </div>

            {/** Submenu list */}
            <div className={` w-full ` + (isExpanded ? '' : 'hidden')}>
                <ul className={`menu menu-compact`}>
                    {visibleSubmenu.map((m, k) => {
                        return (
                            <li key={k} className={!hasPermission(m) ? 'opacity-50 pointer-events-none' : ''}>
                                <Link to={m.path}>
                                    {m.icon} {m.name}
                                    {location.pathname == m.path ? (
                                        <span
                                            className='absolute mt-1 mb-1 inset-y-0 left-0 w-1 rounded-tr-md rounded-br-md bg-primary '
                                            aria-hidden='true'
                                        ></span>
                                    ) : null}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default SidebarSubmenu;
