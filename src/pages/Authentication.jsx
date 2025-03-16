import Register from '../features/user/Register';
import Login from '../features/user/Login';
import AuthenticationBackgroundSwiper from '../containers/AuthenticationBackgroundSwiper';
import { useNavigate, useParams } from 'react-router-dom';

function ExternalPage() {
    const navigate = useNavigate();
    const { mode } = useParams(); // Extract mode from the URL (e.g., "login" or "register")

    // Determine the form component dynamically
    const isLogin = mode === 'login';
    const FormComponent = isLogin ? Login : Register;

    return (
        <div className='relative h-screen w-screen'>
            <AuthenticationBackgroundSwiper />
            <div className='absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm'>
                <div className='w-full max-w-sm bg-base-100 bg-opacity-90 backdrop-blur-md rounded-lg shadow-2xl p-8'>
                    <div className='mb-4 flex flex-col justify-center items-center select-none'>
                        <img src='/Batasan Logo.png' alt='Logo' className='h-16 w-16 mb-2' />
                        <div className='text-2xl font-bold text-center'>Batasan High School</div>
                        <div className='text-sm text-center text-gray-500'>Timetabling System</div>
                    </div>

                    <h2 className='text-base font-medium mb-4 text-center text-gray-500'>
                        {isLogin ? 'Welcome back! Please log in to continue' : 'Please enter your details to register'}
                    </h2>

                    {/* Dynamically render the form component */}
                    <FormComponent />

                    <div className='mt-6 text-center'>
                        <div className='text-sm text-gray-500'>
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        </div>
                        <button
                            className='mt-1 btn-sm btn btn-ghost btn-wide'
                            onClick={() => navigate(isLogin ? '/auth/register' : '/auth/login')}
                        >
                            {isLogin ? 'Register' : 'Log In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExternalPage;
