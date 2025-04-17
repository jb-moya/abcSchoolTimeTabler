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

            <div role='tablist' className='tabs tabs-lifted tabs-lg'>
                <input
                    type='radio'
                    name='my_tabs_2'
                    role='tab'
                    className='tab'
                    aria-label='Create New User'
                    checked={activeTab === 'createUser'}
                    onChange={() => {
                        setActiveTab('createUser');
                        setEditingUser(null);
                    }}
                />
                <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                    <CreateUser />
                </div>

                <input
                    type='radio'
                    name='my_tabs_2'
                    role='tab'
                    className='tab'
                    aria-label='User List'
                    checked={activeTab === 'userList'}
                    onChange={() => {
                        setActiveTab('userList');
                        setEditingUser(null);
                    }}
                />
                <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                    <UserList onEditUser={handleEditUser} />
                </div>

                <input
                    type='radio'
                    name='my_tabs_2'
                    role='tab'
                    className='tab'
                    aria-label='Edit User'
                    checked={activeTab === 'editUser'}
                    onChange={() => setActiveTab('editUser')}
                    disabled={!editingUser}
                />
                {activeTab === 'editUser' && (
                    <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                        <EditUser userId={editingUser} />
                    </div>
                )}

                <input
                    type='radio'
                    name='my_tabs_2'
                    role='tab'
                    className='tab'
                    aria-label='User Logs'
                    checked={activeTab === 'userLogs'}
                    onChange={() => setActiveTab('userLogs')}
                />
                {activeTab === 'userLogs' && (
                    <div role='tabpanel' className='tab-content bg-base-100 border-base-300 rounded-box p-6'>
                        <UserLogs />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
