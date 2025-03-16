import Login from '../features/user/Login';
import AuthenticationBackgroundSwiper from '../containers/AuthenticationBackgroundSwiper';
import { useNavigate } from 'react-router-dom';

function ExternalPage() {
    const navigate = useNavigate();

    return (
        <div className='relative h-screen w-screen'>
            <AuthenticationBackgroundSwiper />
            <div className='absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm '>
                <div className='w-full max-w-sm bg-base-100 bg-opacity-90 backdrop-blur-md rounded-lg  shadow-2xl p-8'>
                    <div className='mb-4 flex flex-col justify-center items-center select-none'>
                        <img src='/Batasan Logo.png' alt='Logo' className='h-16 w-16 mb-2' />
                        <div className='text-2xl font-bold text-center'>Batasan High School</div>
                        <div className='text-sm text-center text-gray-500'>Timetabling System</div>
                    </div>

                    <h2 className='text-base font-medium mb-4 text-center text-gray-500'>
                        Please enter your credentials to continue
                    </h2>

                    <Login />

                    <div className='mt-6 text-center'>
                        <div className='text-sm text-gray-500'>Don&apos;t have an account?</div>
                        <button className='mt-1 btn-sm btn btn-ghost btn-wide' onClick={() => navigate('/auth/register')}>
                            Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExternalPage;
