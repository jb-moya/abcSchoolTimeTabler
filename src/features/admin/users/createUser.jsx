import React from 'react';
import { useState } from 'react';
// import { useForm } from 'react-hook-form';
import InputText from '../../../components/Input/InputText';

const submenu = [
    'Generate Timetable',
    'Modify Subjects and Programs',
    'Modify Teachers',
    'Modify Sections',
    'Modify Departments',
    'Room Utilization',
    'Modify TimeTable',
];

const roles = [
    "superman",
    "minions"
]

const CreateUser = () => {
    const INITIAL_REGISTER_OBJ = {
        email: '',
        password: '',
        permissions: [],
        role: '',
    };

    const [registerObj, setRegisterObj] = useState(INITIAL_REGISTER_OBJ);

    const updateFormValue = ({ updateType, value }) => {
        setRegisterObj({ ...registerObj, [updateType]: value });
    };

    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);

    const handleSubmit = () => {};

    const onSubmit = (data) => {
        console.log({ ...data, permissions: selectedPermissions, roles: selectedRoles });
    };

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
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

                <div className=''>
                    {submenu.map((routeName, index) => (
                        <div key={index} className='flex gap-2'>
                            <input type='checkbox' className='checkbox' />
                            <div>{routeName}</div>
                        </div>
                    ))}
                </div>

                <div className='form-control'>
                    <label className='label cursor-pointer'>
                        <span className='label-text'>Superman</span>
                        <input type='radio' name='radio-10' className='radio checked:bg-red-500' defaultChecked />
                    </label>
                </div>
                <div className='form-control'>
                    <label className='label cursor-pointer'>
                        <span className='label-text'>Minions</span>
                        <input type='radio' name='radio-10' className='radio checked:bg-blue-500' defaultChecked />
                    </label>
                </div>

                {/* <button
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
                </button> */}
            </form>
        </div>
    );
};

export default CreateUser;
