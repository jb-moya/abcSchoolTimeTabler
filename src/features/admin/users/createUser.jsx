import { useEffect } from 'react';
import { useState } from 'react';
import InputText from '../../../components/Input/InputText';
import { useDispatch, useSelector } from 'react-redux';
import { createUser } from './usersSlice';
import { toast } from 'sonner';
import { APP_CONFIG } from '../../../constants';

let filteredPermissions = APP_CONFIG.PERMISSIONS.filter((perm) => perm !== 'Generate Timetable' && perm !== 'Modify TimeTable');

const CreateUser = () => {
    const INITIAL_REGISTER_OBJ = {
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        permissions: [],
        role: 'admin',
        status: 'inactive',
        newUserNotAutoLogin: true,
    };

    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.users);
    const [registerObj, setRegisterObj] = useState(INITIAL_REGISTER_OBJ);
    const [permissionsList, setPermissionsList] = useState(filteredPermissions);
    const [role, setRole] = useState(registerObj.role);

    useEffect(() => {
        if (role === 'Super Admin') {
            setPermissionsList(APP_CONFIG.PERMISSIONS);
        } else {
            setPermissionsList(filteredPermissions);
        }
    }, [role]);

    const handleCheckboxChange = (event, routeName) => {
        const { value, checked } = event.target;
        console.log('🚀 ~ handleCheckboxChange ~ checked:', checked, value);
        const updatedPermissions = checked
            ? [...registerObj.permissions, routeName] // Add if checked
            : registerObj.permissions.filter((perm) => perm !== routeName); // Remove if unchecked

        updateFormValue({ updateType: 'permissions', value: updatedPermissions });
    };

    const resetForm = () => setRegisterObj(INITIAL_REGISTER_OBJ);

    const updateFormValue = ({ updateType, value }) => {
        setRegisterObj({ ...registerObj, [updateType]: value });
    };

    const submitForm = async (e) => {
        e.preventDefault();

        try {
            await dispatch(createUser(registerObj)).unwrap(); // Ensures promise rejection is thrown
            resetForm();
            console.log('Successfully registered');
        } catch (error) {
            toast.error(error);
        }
    };

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

                    <div>
                        <InputText
                            defaultValue={registerObj.username}
                            updateType='username'
                            containerStyle=''
                            labelTitle='Username'
                            updateFormValue={updateFormValue}
                        />
                    </div>

                    <div>
                        <InputText
                            defaultValue={registerObj.password}
                            type='password'
                            updateType='password'
                            containerStyle=''
                            labelTitle='Password'
                            updateFormValue={updateFormValue}
                        />
                    </div>

                    <div>
                        <InputText
                            defaultValue={registerObj.confirmPassword}
                            type='password'
                            updateType='confirmPassword'
                            containerStyle=''
                            labelTitle='Confirm Password'
                            updateFormValue={updateFormValue}
                        />
                    </div>
                </div>

                <div className='pt-6'></div>
                <div className='divider divider-start'>
                    Role <span className='text-sm'></span>
                </div>

                <div className='form-control w-52'>
                    {/* <label className='label cursor-pointer'>
                        <span className='label-text'>Super Admin</span>
                        <input
                            type='radio'
                            name='role'
                            className='radio checked:bg-red-500'
                            value='Super Admin'
                            checked={registerObj.role === 'Super Admin'}
                            onChange={(e) => {
                                updateFormValue({ updateType: 'role', value: e.target.value });
                                setRole(e.target.value);
                            }}
                        />
                    </label> */}
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
                            onChange={(e) => {
                                updateFormValue({ updateType: 'role', value: e.target.value });
                                setRole(e.target.value);
                            }}
                        />
                    </label>
                </div>

                <div className='pt-6'></div>
                <div className='divider divider-start'>
                    Permissions <span className='text-sm'>grant user access to the following</span>
                </div>

                <div className='space-y-1'>
                    {permissionsList.map((routeName, index) => (
                        <div key={index} className='flex gap-2'>
                            <input
                                type='checkbox'
                                className='checkbox checkbox-success'
                                onChange={(e) => handleCheckboxChange(e, routeName)}
                            />
                            <div>{routeName}</div>
                        </div>
                    ))}
                </div>

                <div className='flex justify-end gap-4 pt-6 w-full'>
                    <button
                        type='submit'
                        className={`btn mt-4 btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
                            loading ? 'cursor-not-allowed ' : ''
                        }`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className='loading loading-spinner'></span>
                                Creating...
                            </>
                        ) : (
                            'Create this User'
                        )}
                    </button>
                    <button
                        type='button'
                        onClick={resetForm}
                        className={`btn mt-4 btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
                            loading ? 'cursor-not-allowed ' : ''
                        }`}
                    >
                        Reset
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;
