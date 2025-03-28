import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { toast } from 'sonner';
import { APP_CONFIG } from '../../../constants';


const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailedPermissions, setShowDetailedPermissions] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(firestore, 'users');
                const querySnapshot = await getDocs(usersRef);
                const usersData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setUsers(usersData);
            } catch (error) {
                toast.error('Error fetching users: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleEdit = (userId) => {
        // TODO: Implement edit functionality
        console.log('Edit user:', userId);
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <span className='loading loading-spinner loading-lg'></span>
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
                                            user.role === 'Super Admin'
                                                ? 'badge-error'
                                                : user.role === 'Admin'
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
                                    <button onClick={() => handleEdit(user.id)} className='btn btn-sm btn-primary'>
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserList;
