import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';
import User from '@features/admin/users';
import { fetchSections } from '../../../features/sectionSlice';
import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';
function InternalPage() {
    const dispatch = useDispatch();


    useEffect(() => {
        dispatch(setPageTitle({ title: 'Users' }));
        console.log('test              fff f ff');
    }, []);

    return <User />;
}

export default InternalPage;
