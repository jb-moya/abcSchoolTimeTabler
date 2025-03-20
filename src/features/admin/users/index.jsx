import React from 'react';
import CreateUser from './createUser';
import Breadcrumbs from '@components/Admin/Breadcrumbs';

const Users = () => {
    const links = [{ name: 'Home', href: '/' }];

    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Users' links={links} />

            <div role='tablist' className='tabs tabs-lifted tabs-lg'>
                <input type='radio' name='my_tabs_2' role='tab' className='tab' aria-label='User Dashboard' />
                <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                    Tab content 1
                </div>

                <input type='radio' name='my_tabs_2' role='tab' className='tab' aria-label='Create New User' defaultChecked />
                <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                    <CreateUser />
                </div>

                <input type='radio' name='my_tabs_2' role='tab' className='tab' aria-label='Edit User' defaultChecked />
                <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                    Edit
                </div>

                <input type='radio' name='my_tabs_2' role='tab' className='tab' aria-label='User Logs' />
                <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                    Tab content 3
                </div>
            </div>
        </div>
    );
};

export default Users;
