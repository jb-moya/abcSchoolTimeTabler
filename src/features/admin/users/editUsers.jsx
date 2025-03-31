import React, { useEffect } from 'react';
import { useState } from 'react';
import InputText from '../../../components/Input/InputText';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { APP_CONFIG } from '../../../constants';
import { useUserById } from './hooks/useUsers';

const EditUser = ({ userId }) => {
    const editUserInfo = useUserById(userId);
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.user);
    const [registerObj, setRegisterObj] = useState({
        email: '',
        permissions: [],
        role: 'user',
    });

    // Update form when user data is loaded
    useEffect(() => {
        if (editUserInfo) {
            setRegisterObj({
                email: editUserInfo.email || '',
                permissions: editUserInfo.permissions || [],
                role: editUserInfo.role || 'user',
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
            // TODO: Implement update user functionality
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
                <div className='divider divider-start'>
                    Account Details <span className='text-sm'></span>
                </div>

                <div className='w-96'>
                    <div>
                        <InputText
                            defaultValue={registerObj.email}
                            updateType='email'
                            containerStyle=''
                            labelTitle='Email'
                            updateFormValue={updateFormValue}
                        />
                    </div>
                </div>

                <div className='pt-6'></div>
                <div className='divider divider-start'>
                    Permissions <span className='text-sm'>grant user access to the following</span>
                </div>

                <div className='space-y-1'>
                    {APP_CONFIG.PERMISSIONS.map((routeName, index) => (
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

                <div className='pt-6'></div>
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
                            checked={registerObj.role === 'superAdmin'}
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
                            checked={registerObj.role === 'admin'}
                            onChange={(e) => updateFormValue({ updateType: 'role', value: e.target.value })}
                        />
                    </label>
                </div>

                <div className='pt-6'></div>
                <button
                    type='submit'
                    className={`btn mt-4 w-full btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
                        loading ? 'cursor-not-allowed' : ''
                    }`}
                    disabled={loading}
                >
                    {loading ? (
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
