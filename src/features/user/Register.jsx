import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import LandingIntro from './LandingIntro';
import ErrorText from '../../components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';

function Register() {
    const INITIAL_REGISTER_OBJ = {
        name: '',
        password: '',
        emailId: '',
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [registerObj, setRegisterObj] = useState(INITIAL_REGISTER_OBJ);

    const submitForm = (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (registerObj.name.trim() === '') return setErrorMessage('Name is required! (use any value)');
        if (registerObj.emailId.trim() === '') return setErrorMessage('Email Id is required! (use any value)');
        if (registerObj.password.trim() === '') return setErrorMessage('Password is required! (use any value)');
        else {
            setLoading(true);
            // Call API to check user credentials and save token in localstorage
            localStorage.setItem('token', 'DumyTokenHere');
            setLoading(false);
            window.location.href = '/app/dashboard';
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage('');
        setRegisterObj({ ...registerObj, [updateType]: value });
    };

    return (
        <form onSubmit={(e) => submitForm(e)}>
            <div className='mb-4'>
                <InputText
                    defaultValue={registerObj.name}
                    updateType='name'
                    containerStyle='mt-4'
                    labelTitle='Name'
                    updateFormValue={updateFormValue}
                />

                <InputText
                    defaultValue={registerObj.emailId}
                    updateType='emailId'
                    containerStyle='mt-4'
                    labelTitle='Email Id'
                    updateFormValue={updateFormValue}
                />

                <InputText
                    defaultValue={registerObj.password}
                    type='password'
                    updateType='password'
                    containerStyle='mt-4'
                    labelTitle='Password'
                    updateFormValue={updateFormValue}
                />
            </div>

            <ErrorText styleClass='mt-8'>{errorMessage}</ErrorText>
            <button type='submit' className={'btn mt-2 w-full btn-primary' + (loading ? ' loading' : '')}>
                Register
            </button>
        </form>
    );
}

export default Register;
