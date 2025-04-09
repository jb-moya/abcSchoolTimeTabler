import { useEffect, useState } from 'react';
import ErrorText from '@components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';
import { loginUser } from '../userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { setLoading } from '../userSlice';

function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const INITIAL_LOGIN_OBJ = {
        email: '',
        password: '',
    };

    const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ);

    const { error: userError, loading } = useSelector((state) => state.user);

    const submitForm = async (e) => {
        e.preventDefault();

        if (loginObj.email.trim() === '') {
            return;
        }
        if (loginObj.password.trim() === '') {
            return;
        }

        try {
            dispatch(setLoading(true));
            console.log('🚀 ~ submitForm ~ loading:', loading);

            await dispatch(loginUser(loginObj)).unwrap();

            navigate('/app/dashboard');
        } catch (error) {
            toast.error(error);
        }
    };

    const updateFormValue = ({ updateType, value }) => {
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
                        type='email'
                        defaultValue={loginObj.email}
                        updateType='email'
                        containerStyle='mt-4'
                        labelTitle='Username'
                        updateFormValue={updateFormValue}
                        disabled={loading}
                    />

                    {/* Password input */}
                    <InputText
                        defaultValue={loginObj.password}
                        type='password'
                        updateType='password'
                        containerStyle='mt-4'
                        labelTitle='Password'
                        updateFormValue={updateFormValue}
                        disabled={loading}
                    />
                </div>

                {/* Forgot password link */}
                {/* <div className='text-right mb-4'>
                    <Link to='/forgot-password' className='text-sm text-primary hover:underline'>
                        Forgot Password?
                    </Link>
                </div> */}

                {/* Error message */}
                {userError && <ErrorText styleClass='mt-2 text-center'>{userError}</ErrorText>}

                {/* Submit button */}
                <button
                    type='submit'
                    className={`btn mt-4 w-full btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
                        loading ? 'cursor-not-allowed ' : ''
                    }`}
                    disabled={loading}
                >
                    {loading ? (
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
