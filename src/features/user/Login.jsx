import { useState } from 'react';
import ErrorText from '@components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';
import { loginUser } from '../userSlice';
import { useDispatch, useSelector } from 'react-redux';

function Login() {
    const INITIAL_LOGIN_OBJ = {
        password: '123',
        emailId: '123',
    };

    // const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ);
    const dispatch = useDispatch();

    const { user, userStatus } = useSelector((state) => state.subject);

    const submitForm = (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (loginObj.emailId.trim() === '') return setErrorMessage('Email Id is required!');
        if (loginObj.password.trim() === '') return setErrorMessage('Password is required!');
        else {
            // setLoading(true);
            dispatch(loginUser(loginObj));
            setTimeout(() => {
                localStorage.setItem('token', 'DummyTokenHere');
                // setLoading(false);
                window.location.href = '/app/dashboard';
            }, 1500);
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage('');
        setLoginObj({ ...loginObj, [updateType]: value });
    };

    // function goToGuestPage() {
    //     window.location.href = '/search';
    // }

    return (
        <div>
            <form onSubmit={(e) => submitForm(e)}>
                <div className='mb-6'>
                    {/* Email input */}
                    <InputText
                        type='emailId'
                        defaultValue={loginObj.emailId}
                        updateType='emailId'
                        containerStyle='mt-4'
                        labelTitle='Username'
                        updateFormValue={updateFormValue}
                    />

                    {/* Password input */}
                    <InputText
                        defaultValue={loginObj.password}
                        type='password'
                        updateType='password'
                        containerStyle='mt-4'
                        labelTitle='Password'
                        updateFormValue={updateFormValue}
                    />
                </div>

                {/* Forgot password link */}
                {/* <div className='text-right mb-4'>
                    <Link to='/forgot-password' className='text-sm text-primary hover:underline'>
                        Forgot Password?
                    </Link>
                </div> */}

                {/* Error message */}
                {errorMessage && <ErrorText styleClass='mt-2 text-center'>{errorMessage}</ErrorText>}

                {/* Submit button */}
                <button
                    type='submit'
                    className={`btn mt-4 w-full btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
                        userStatus == 'loading' ? 'cursor-not-allowed' : ''
                    }`}
                    disabled={userStatus == 'loading'}
                >
                    {userStatus == 'loading' ? (
                        <>
                            <span className='loading loading-spinner'></span>
                            Logging In
                        </>
                    ) : (
                        'Login'
                    )}
                </button>

                {/* Register link */}
                {/* <div className='text-center mt-6 text-gray-600'>
                    Sign as Guest?{' '}
                    <button className='text-primary hover:underline' onClick={goToGuestPage}>
                        here
                    </button>
                </div> */}
            </form>
        </div>
    );
}

export default Login;
