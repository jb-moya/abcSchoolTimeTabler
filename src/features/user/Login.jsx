import { useState } from 'react';
import ErrorText from '@components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';
import { loginUser } from '../userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setLoading } from '../userSlice';
import LoadingButton from '../../components/LoadingButton';

function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const INITIAL_LOGIN_OBJ = {
        email: '',
        password: '',
    };

    const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

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
            setIsLoggingIn(true);
            dispatch(setLoading(true));
            console.log('🚀 ~ submitForm ~ loading:', loading);

            await dispatch(loginUser(loginObj)).unwrap();

            navigate('/app/dashboard');
        } catch (error) {
            console.log('🚀 ~ submitForm ~ error:', error);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setLoginObj({ ...loginObj, [updateType]: value });
    };

    return (
        <div>
            <form onSubmit={(e) => submitForm(e)}>
                <div className='mb-6'>
                    <InputText
                        type='email'
                        defaultValue={loginObj.email}
                        updateType='email'
                        containerStyle='mt-4'
                        labelTitle='Username'
                        updateFormValue={updateFormValue}
                        disabled={loading}
                    />

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

                {userError && <ErrorText styleClass='mt-2 text-center'>{userError}</ErrorText>}

                <LoadingButton
                    type='submit'
                    isLoading={isLoggingIn}
                    loadingText='Logging In'
                    className='btn mt-4 w-full btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center'
                >
                    Login
                </LoadingButton>
            </form>
        </div>
    );
}

export default Login;
