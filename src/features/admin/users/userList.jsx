import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { APP_CONFIG } from '../../../constants';
import { RiDeleteBin7Line } from 'react-icons/ri';
import { useUsers } from './hooks/useUsers';

const UserList = ({ onEditUser }) => {
    const [showDetailedPermissions, setShowDetailedPermissions] = useState(true);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const { users, loading, error } = useUsers();

    const handleEdit = (userId) => {
        onEditUser(userId);
    };

    const handleDelete = async (userId) => {
        try {
            // await deleteDoc(doc(firestore, 'users', userId));
            // setUsers(users.filter((user) => user.id !== userId));
            // toast.success('User deleted successfully');
            // document.getElementById('delete_modal').close();
        } catch (error) {
            // toast.error('Error deleting user: ' + error.message);
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
                                        <button onClick={() => handleEdit(user.id)} className='btn btn-sm btn-primary'>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setUserToDelete(user);
                                                setDeleteConfirmation(''); // Reset confirmation when opening modal
                                                document.getElementById('delete_modal').showModal();
                                            }}
                                            className='btn btn-sm btn-ghost text-red-500'
                                        >
                                            <RiDeleteBin7Line size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            <dialog id='delete_modal' className='modal modal-bottom sm:modal-middle'>
                <div className='modal-box'>
                    <h3 className='font-bold text-lg'>Delete User</h3>
                    <p className='py-4'>Are you sure you want to delete this user? This action cannot be undone.</p>
                    <div className='form-control w-full'>
                        <label className='label'>
                            <span className='label-text'>Type &quot;DELETE THIS USER&quot; to confirm</span>
                        </label>
                        <input
                            type='text'
                            placeholder='Type DELETE THIS USER'
                            className='input input-bordered w-full'
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                        />
                    </div>
                    <div className='modal-action'>
                        <button
                            className='btn btn-error'
                            onClick={() => userToDelete && handleDelete(userToDelete.id)}
                            disabled={deleteConfirmation !== 'DELETE THIS USER'}
                        >
                            Delete
                        </button>
                        <button
                            className='btn btn-ghost'
                            onClick={() => {
                                document.getElementById('delete_modal').close();
                                setDeleteConfirmation(''); // Reset confirmation when closing
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
