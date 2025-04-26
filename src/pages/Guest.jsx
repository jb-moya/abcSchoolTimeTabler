import { useParams, Navigate } from 'react-router-dom';
import NavBar from '../features/guest/NavBar';
import Search from '../features/guest/Search';

function ExternalPage() {
    const { uid } = useParams();

    if (!uid) {
        console.log('no uid');
        return <Navigate to='/404' replace />;
    }

    return (
        <div data-theme='dark' className='h-screen'>
            <div className='bg-[#fdf0d5] h-full'>
                <div className='bg-[#003049] h-full flex flex-col overflow-auto'>
                    <NavBar />

                    {/* Main Content */}
                    <div className='flex flex-col items-center mt-10 flex-grow mx-auto px-4 w-full max-w-screen-xl text-center'>
                        <Search />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExternalPage;
