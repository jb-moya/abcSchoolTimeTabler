import React, { useEffect } from 'react';
import { useState } from 'react';
import InputText from '../../../components/Input/InputText';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { APP_CONFIG } from '../../../constants';
import { useUserById } from './hooks/useUsers';
import { useEditUser } from './hooks/useUpdateUser';
import { editUser as editUserAction } from './usersSlice';

let filteredPermissions = APP_CONFIG.PERMISSIONS.filter((perm) => perm !== 'Generate Timetable' && perm !== 'Modify TimeTable');


const EditUser = ({ userId }) => {
    const editUserInfo = useUserById(userId);
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.user);
    const [registerObj, setRegisterObj] = useState({
        // email: '',
        permissions: [],
        // role: '',
        // oldPassword: '',
        // newPassword: '',
        // confirmPassword: '',
    });

    const { editUser, loading: editUserLoading, error: editUserError } = useEditUser();

    const resetForm = () => setRegisterObj({ email: '', permissions: [], role: '' });

    useEffect(() => {
        console.log('editUserInfo', editUserInfo);

        return () => {
            resetForm();
        };
    }, []);

    useEffect(() => {
        if (editUserInfo) {
            console.log('🚀 ~ useEffect ~ editUserInfo.email:', editUserInfo.email);
            setRegisterObj({
                email: editUserInfo.email || '',
                permissions: editUserInfo.permissions || [],
                role: editUserInfo.role || 'Admin',
            });
        }
    }, [editUserInfo]);

    const handleCheckboxChange = (event, routeName) => {
        const { checked } = event.target;
        const updatedPermissions = checked
            ? [...registerObj.permissions, routeName]
            : registerObj.permissions.filter((perm) => perm !== routeName);

        updateFormValue({ updateType: 'permissions', value: updatedPermissions });
    };

    const updateFormValue = ({ updateType, value }) => {
        setRegisterObj((prev) => ({ ...prev, [updateType]: value }));
    };

    const submitForm = async (e) => {
        e.preventDefault();

        try {
            await editUser(userId, registerObj);
            dispatch(editUserAction({ id: userId, ...registerObj }));
            toast.success('User updated successfully');
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (!editUserInfo) {
        return (
            <div className='flex justify-center items-center h-64'>
                <span className='loading loading-spinner loading-lg'></span>
            </div>
        );
    }

    return (
        <div>
            <form onSubmit={async (e) => await submitForm(e)} className='space-y-2'>
                {/* <div className='divider divider-start'>
                    Account Details <span className='text-sm'></span>
                </div>

                <div className='w-96'>
                    <div>
                        <InputText
                            defaultValue={editUserInfo.email}
                            updateType='email'
                            containerStyle=''
                            labelTitle='Email'
                            updateFormValue={updateFormValue}
                        />
                    </div>
                </div>

                <div className='pt-6'></div>
                <div className='divider divider-start'>
                    Change Password <span className='text-sm'></span>
                </div>

                <div className='w-96'>
                    <div>
                        <InputText
                            defaultValue={registerObj.newPassword}
                            type='password'
                            updateType='newPassword'
                            containerStyle=''
                            labelTitle='New Password'
                            updateFormValue={updateFormValue}
                        />
                    </div>
                </div>

                <div className='w-96'>
                    <div>
                        <InputText
                            defaultValue={registerObj.confirmPassword}
                            type='password'
                            updateType='confirmPassword'
                            containerStyle=''
                            labelTitle='Confirm New Password'
                            updateFormValue={updateFormValue}
                        />
                    </div>
                </div> */}

                <div className='pt-6'></div>
                <div className='divider divider-start'>
                    Update {editUserInfo.email}'s Permissions <span className='text-sm'>edit user access to the following</span>
                </div>

                <div className='space-y-1'>
                    {filteredPermissions.map((routeName, index) => (
                        <div key={index} className='flex gap-2'>
                            <input
                                type='checkbox'
                                className='checkbox checkbox-success'
                                checked={registerObj.permissions.includes(routeName)}
                                onChange={(e) => handleCheckboxChange(e, routeName)}
                            />
                            <div>{routeName}</div>
                        </div>
                    ))}
                </div>

                {/* <div className='pt-6'></div>
                <div className='divider divider-start'>
                    Role <span className='text-sm'></span>
                </div>

                <div className='form-control w-52'>
                    <label className='label cursor-pointer'>
                        <span className='label-text'>Super Admin</span>
                        <input
                            type='radio'
                            name='role'
                            className='radio checked:bg-red-500'
                            value='superAdmin'
                            checked={editUserInfo.role === 'super admin'}
                            onChange={(e) => updateFormValue({ updateType: 'role', value: e.target.value })}
                        />
                    </label>
                </div>
                <div className='form-control w-52'>
                    <label className='label cursor-pointer'>
                        <span className='label-text'>Admin</span>
                        <input
                            type='radio'
                            name='role'
                            className='radio checked:bg-blue-500'
                            value='admin'
                            checked={editUserInfo.role === 'admin'}
                            onChange={(e) => updateFormValue({ updateType: 'role', value: e.target.value })}
                        />
                    </label>
                </div> */}

                <div className='pt-6'></div>
                <div>{editUserError && <div className='alert alert-error'>{editUserError}</div>}</div>
                <button
                    type='submit'
                    className={`btn mt-4 w-full btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
                        loading || editUserLoading ? 'cursor-not-allowed' : ''
                    }`}
                    disabled={loading || editUserLoading}
                >
                    {loading || editUserLoading ? (
                        <>
                            <span className='loading loading-spinner'></span>
                            Updating...
                        </>
                    ) : (
                        'Update User'
                    )}
                </button>
            </form>
        </div>
    );
};

export default EditUser;
