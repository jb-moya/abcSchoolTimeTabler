import React from 'react';

const Users = () => {
    return (
        <div role='tablist' className='tabs tabs-lifted'>
            <input type='radio' name='my_tabs_2' role='tab' className='tab' aria-label='User Dashboard' />
            <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                Tab content 1
            </div>

            <input type='radio' name='my_tabs_2' role='tab' className='tab' aria-label='Create New User' defaultChecked />
            <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                Tab content 2
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
    );
};

export default Users;
