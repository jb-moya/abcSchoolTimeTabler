import React, { useState } from 'react';
import { APP_CONFIG } from '../../../constants';
import { RiDeleteBin7Line } from 'react-icons/ri';
import { useUsers } from './hooks/useUsers';
import { useEditUser } from './hooks/useUpdateUser';
import { useDispatch } from 'react-redux';
import { editUser as editUserAction } from './usersSlice';
import { toast } from 'sonner';
import { useToggleAllowedStatus } from './hooks/useToggleUserStatus';
import useAuth from '../../../app/useAuth';

const UserList = ({ onEditUser }) => {
    const dispatch = useDispatch();

    const [showDetailedPermissions, setShowDetailedPermissions] = useState(true);
    const [userToChangeStatus, setUserToChangeStatus] = useState(null);
    const [statusConfirmation, setStatusConfirmation] = useState('');
    const { users, loading, error } = useUsers();

    const { editUser, loading: editUserLoading, error: editUserError } = useEditUser();
    const { toggleStatus, loading: toggleStatusLoading, error: toggleStatusError } = useToggleAllowedStatus();

    const handleEdit = (userId) => {
        onEditUser(userId);
    };

    const handleChangeStatus = async (user) => {
        try {
            const newStatus = user.status === 'active' ? 'inactive' : 'active';
            await editUser(user.id, { status: newStatus });

            const editedUser = {
                ...user,
                status: newStatus,
            };
            await toggleStatus(user.id, newStatus === 'active');
            dispatch(editUserAction(editedUser));
            setUserToChangeStatus(null);
        } catch (error) {
            toast.error('Error changing user status: ' + (error?.message || error));
        }
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <span className='loading loading-spinner loading-lg'></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex justify-center items-center h-64'>
                <div className='text-error'>{error}</div>
            </div>
        );
    }

    return (
        <div className='w-full max-w-[95vw] mx-auto'>
            <div className='overflow-x-auto'>
                <table className='table table-zebra w-full'>
                    <thead>
                        <tr>
                            <th className='whitespace-nowrap'>Email</th>
                            <th className='whitespace-nowrap'>Role</th>
                            <th className='whitespace-nowrap'>Status</th>
                            <th className='whitespace-nowrap w-[300px]'>
                                <div className='flex items-center gap-2'>
                                    <div className='flex items-center gap-1'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='h-4 w-4'
                                            viewBox='0 0 20 20'
                                            fill='currentColor'
                                        >
                                            <path
                                                fillRule='evenodd'
                                                d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
                                                clipRule='evenodd'
                                            />
                                        </svg>
                                        <span>Permissions</span>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailedPermissions(!showDetailedPermissions)}
                                        className='btn btn-xs btn-outline'
                                    >
                                        {showDetailedPermissions ? 'Show Count' : 'Show Details'}
                                    </button>
                                </div>
                            </th>
                            <th className='whitespace-nowrap'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className='whitespace-nowrap'>{user.email}</td>
                                <td>
                                    <div
                                        className={`badge ${
                                            user.role.toLowerCase() === 'super admin'
                                                ? 'badge-error'
                                                : user.role.toLowerCase() === 'admin'
                                                ? 'badge-primary'
                                                : 'badge-ghost'
                                        }`}
                                    >
                                        {user.role}
                                    </div>
                                </td>
                                <td>
                                    <div className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                        {user.status}
                                    </div>
                                </td>

                                <td>
                                    {showDetailedPermissions ? (
                                        <div className='space-y-1'>
                                            {APP_CONFIG.PERMISSIONS.map((permission) => {
                                                const hasPermission = user.permissions?.includes(permission);
                                                return (
                                                    <div
                                                        key={permission}
                                                        className={`${
                                                            hasPermission ? 'text-green-500' : 'line-through'
                                                        } whitespace-nowrap w-full`}
                                                    >
                                                        {permission}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className='badge badge-neutral'>
                                            {user.permissions?.length || 0} / {APP_CONFIG.PERMISSIONS.length} permissions
                                        </div>
                                    )}
                                </td>

                                <td>
                                    <div className='flex gap-2'>
                                        {user.role !== 'super admin' && (
                                            <>
                                                <button onClick={() => handleEdit(user.id)} className='btn btn-sm btn-primary'>
                                                    Edit Permission
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setUserToChangeStatus(user);
                                                        document.getElementById('status_modal').showModal();
                                                    }}
                                                    className={`btn btn-sm ${
                                                        user.status === 'active' ? 'btn-warning' : 'btn-success'
                                                    }`}
                                                >
                                                    {user.status === 'active' ? 'Set to Inactive' : 'Set to Active'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Change Status Modal */}
            <dialog id='status_modal' className='modal modal-bottom sm:modal-middle'>
                <div className='modal-box'>
                    <h3 className='font-bold text-lg'>Change User Status</h3>
                    <div className=' flex flex-col justify-start'>
                        <p className='py-4'>Are you sure you want to change the status of this user?</p>
                        <p>
                            {userToChangeStatus?.status === 'active'
                                ? " Setting this to inactive will disable the user's ability to log in."
                                : " Setting this to active will re-enable the user's ability to log in."}
                        </p>
                    </div>
                    <div className='modal-action'>
                        <button
                            className={`btn ${userToChangeStatus?.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => {
                                if (userToChangeStatus) {
                                    handleChangeStatus(userToChangeStatus);
                                    document.getElementById('status_modal').close();
                                }
                            }}
                            disabled={editUserLoading}
                        >
                            {editUserLoading ? (
                                <span className='loading loading-spinner loading-sm'></span>
                            ) : userToChangeStatus?.status === 'active' ? (
                                'Set to Inactive'
                            ) : (
                                'Set to Active'
                            )}
                        </button>
                        <button
                            className='btn btn-ghost'
                            onClick={() => {
                                document.getElementById('status_modal').close();
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default UserList;
