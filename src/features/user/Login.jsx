import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorText from '@components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

function Login() {
    const INITIAL_LOGIN_OBJ = {
        password: '123',
        emailId: '123',
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ);

    const submitForm = (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (loginObj.emailId.trim() === '') return setErrorMessage('Email Id is required!');
        if (loginObj.password.trim() === '') return setErrorMessage('Password is required!');
        else {
            setLoading(true);
            setTimeout(() => {
                localStorage.setItem('token', 'DummyTokenHere');
                setLoading(false);
                window.location.href = '/app/dashboard';
            }, 1500);
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage('');
        setLoginObj({ ...loginObj, [updateType]: value });
    };

    function imgUrl() {
        const id = Math.floor(Math.random() * (200 - 1 + 1) + 1);
        return `https://picsum.photos/id/${id}/1920/1080`;
    }
    function goToGuestPage() {
        window.location.href = '/search';
    }

    return (
        <div className='relative h-screen w-screen'>
            {/* Background section with Swiper */}
            <div className='absolute inset-0 z-0'>
                <Swiper modules={[Autoplay]} slidesPerView={1} autoplay={{ delay: 3000 }} className='h-full'>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <SwiperSlide key={index}>
                            <img src={imgUrl()} alt={`Slide ${index + 1}`} className='w-full h-full object-cover' />
                        </SwiperSlide>
                    ))}
                </Swiper>
                {/* Blur effect and dark overlay */}
                <div className='absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm'></div>
            </div>

            {/* Login form section */}
            <div className='absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm '>
                <div className='w-full max-w-sm bg-white bg-opacity-90 backdrop-blur-md rounded-lg  shadow-2xl p-8'>
                    {/* Logo section */}
                    <div className='mb-4 flex flex-col justify-center items-center select-none'>
                        <img src='/Batasan Logo.png' alt='Logo' className='h-16 w-16 mb-2' />
                        <div className='text-2xl font-bold text-center'>Batasan High School</div>
                        <div className='text-sm text-center text-gray-500'>Timetabling System</div>
                    </div>

                    <h2 className='text-base font-medium mb-4 text-center text-gray-500'>
                        Please enter your credentials to continue
                    </h2>

                    {/* Form */}
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
                        <div className='text-right mb-4'>
                            <Link to='/forgot-password' className='text-sm text-primary hover:underline'>
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Error message */}
                        {errorMessage && <ErrorText styleClass='mt-2 text-center'>{errorMessage}</ErrorText>}

                        {/* Submit button */}
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
                                    Logging In
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>

                        {/* Register link */}
                        <div className='text-center mt-6 text-gray-600'>
                            Sign as Guest?{' '}
                            <button className='text-primary hover:underline' onClick={goToGuestPage}>
                                here
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
