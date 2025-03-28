import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../features/common/headerSlice';
import { CiLock } from 'react-icons/ci';

function InternalPage() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle({ title: '' }));
    }, []);

    return (
        <div className='hero h-screen bg-base-200'>
            <div className='hero-content text-accent text-center'>
                <div className='max-w-md'>
                    <CiLock className='h-48 w-48 inline-block' />
                    <h1 className='text-5xl  font-bold'>401 - Unauthorized. You are not authorized to access this page</h1>
                </div>
            </div>
        </div>
    );
}

export default InternalPage;
