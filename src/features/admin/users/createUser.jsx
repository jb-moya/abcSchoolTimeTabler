import React, { useEffect } from 'react';
import { useState } from 'react';
import InputText from '../../../components/Input/InputText';
import { useDispatch, useSelector } from 'react-redux';
import { signUpWithEmailAndPassword } from '../../userSlice';
import { toast } from 'sonner';
import { APP_CONFIG } from '../../../config';

const CreateUser = () => {
    const INITIAL_REGISTER_OBJ = {
        email: 'admin-with-all-permissions@email.com',
        password: '1111111111111',
        confirmPassword: '1111111111111',
        permissions: [],
        role: '',
        newUserNotAutoLogin: true,
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
 
    useEffect(() => {
        console.log("userError", userError)
        console.log("userStatus", userStatus)
    }, [userError, userStatus])

    const submitForm = async (e) => {
        e.preventDefault();

        try {
            await dispatch(signUpWithEmailAndPassword(registerObj)).unwrap(); // Ensures promise rejection is thrown
            console.log('Successfully registered');
        } catch (error) {
            toast.error(error);
        }

        // try {
        //     const result = await dispatch(signUpWithEmailAndPassword(registerObj));
        //     console.log("🚀 ~ submitForm ~ result:", result)

        //     console.log("🚀 ~ submitForm ~ userStatus:", userStatus)

        //     if (userError != null) {
        //         throw Error('haha');
        //     }

        //     console.log('successfully registered');
        // } catch (error) {
        //     toast.error(userError);
        // }
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
                    {APP_CONFIG.PERMISSIONS.map((routeName, index) => (
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
                        <span className='label-text'>Super Admin</span>
                        <input type='radio' name='radio-10' className='radio checked:bg-red-500' defaultChecked />
                    </label>
                </div>
                <div className='form-control w-52'>
                    <label className='label cursor-pointer'>
                        <span className='label-text'>Admin</span>
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
