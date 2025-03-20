import React from 'react';
import { useState } from 'react';
import InputText from '../../../components/Input/InputText';
import { useDispatch, useSelector } from 'react-redux';
import { signUpWithEmailAndPassword } from '../../userSlice';

const submenu = [
    'Generate Timetable',
    'Modify Subjects and Programs',
    'Modify Teachers',
    'Modify Sections',
    'Modify Departments',
    'Room Utilization',
    'Modify TimeTable',
];

const CreateUser = () => {
    const INITIAL_REGISTER_OBJ = {
        email: '',
        password: '',
        confirmPassword: '',
        permissions: [],
        role: '',
    };

    const dispatch = useDispatch();

    const { user, error: userError, status: userStatus } = useSelector((state) => state.user);
    const [registerObj, setRegisterObj] = useState(INITIAL_REGISTER_OBJ);

    const handleCheckboxChange = (event, routeName) => {
        const { value, checked } = event.target;
        console.log("🚀 ~ handleCheckboxChange ~ checked:", checked, value)
        const updatedPermissions = checked
            ? [...registerObj.permissions, routeName] // Add if checked
            : registerObj.permissions.filter((perm) => perm !== routeName); // Remove if unchecked

        updateFormValue({ updateType: 'permissions', value: updatedPermissions });
    };

    const updateFormValue = ({ updateType, value }) => {
        setRegisterObj({ ...registerObj, [updateType]: value });
    };

    const submitForm = (e) => {
        e.preventDefault();

        try {
            const result = dispatch(signUpWithEmailAndPassword(registerObj));

            if (result.meta.requestStatus === 'rejected') {
                return;
            }

            console.log('successfully registered');
        } catch (error) {}
    };

    return (
        <div>
            <form onSubmit={(e) => submitForm(e)} className='space-y-2'>
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
                    Permissions <span className='text-sm'>grant user access to the following</span>
                </div>

                <div className='space-y-1'>
                    {submenu.map((routeName, index) => (
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

                <div className='pt-6'></div>
                <div className='divider divider-start'>
                    Role <span className='text-sm'></span>
                </div>

                <div className='form-control w-52'>
                    <label className='label cursor-pointer'>
                        <span className='label-text'>Superman</span>
                        <input type='radio' name='radio-10' className='radio checked:bg-red-500' defaultChecked />
                    </label>
                </div>
                <div className='form-control w-52'>
                    <label className='label cursor-pointer'>
                        <span className='label-text'>Minions</span>
                        <input type='radio' name='radio-10' className='radio checked:bg-blue-500' defaultChecked />
                    </label>
                </div>

                <div className='pt-6'></div>
                <button
                    type='submit'
                    className={`btn mt-4 w-full btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
                        userStatus == 'loading' ? 'cursor-not-allowed ' : ''
                    }`}
                    disabled={userStatus == 'loading'}
                >
                    {userStatus == 'loading' ? (
                        <>
                            <span className='loading loading-spinner'></span>
                            Signing Up
                        </>
                    ) : (
                        'Sign Up'
                    )}
                </button>
            </form>
        </div>
    );
};

export default CreateUser;
