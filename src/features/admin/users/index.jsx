import React, { useState } from 'react';
import CreateUser from './createUser';
import Breadcrumbs from '@components/Admin/Breadcrumbs';
import UserList from './userList';
import EditUser from './editUsers';
import UserLogs from './userLogs';

const Users = () => {
    const links = [{ name: 'Home', href: '/' }];
    const [activeTab, setActiveTab] = useState('userList');
    const [editingUser, setEditingUser] = useState(null);

    const handleEditUser = (userId) => {
        setEditingUser(userId);
        setActiveTab('editUser');
    };

    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Users' links={links} />

            <div role='tablist' className='tabs tabs-lifted tabs-lg w-full flex'>
                <input
                    type='radio'
                    name='tabs'
                    role='tab'
                    className='tab text-xs sm:text-sm md:text-base'
                    aria-label='Create New User'
                    checked={activeTab === 'createUser'}
                    onChange={() => {
                        setActiveTab('createUser');
                        setEditingUser(null);
                    }}
                />
                <input
                    type='radio'
                    name='tabs'
                    role='tab'
                    className='tab text-xs sm:text-sm md:text-base  '
                    aria-label='User List'
                    checked={activeTab === 'userList'}
                    onChange={() => {
                        setActiveTab('userList');
                        setEditingUser(null);
                    }}
                />
                <input
                    type='radio'
                    name='tabs'
                    role='tab'
                    className='tab text-xs sm:text-sm md:text-base'
                    aria-label='Edit User'
                    checked={activeTab === 'editUser'}
                    onChange={() => setActiveTab('editUser')}
                    disabled={!editingUser}
                />
                <input
                    type='radio'
                    name='tabs'
                    role='tab'
                    className='tab text-xs sm:text-sm md:text-base'
                    aria-label='User Logs'
                    checked={activeTab === 'userLogs'}
                    onChange={() => setActiveTab('userLogs')}
                />
            </div>

            <div className='bg-base-100 border border-t-0 border-base-300 rounded-box rounded-t-none p-6 w-full'>
                {activeTab === 'createUser' && <CreateUser />}
                {activeTab === 'userList' && <UserList onEditUser={handleEditUser} />}
                {activeTab === 'editUser' && editingUser && <EditUser userId={editingUser} />}
                {activeTab === 'userLogs' && <UserLogs />}
            </div>
        </div>
    );
};

export default Users;
