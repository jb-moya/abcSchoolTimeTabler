import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';
// import Timetable from "../../features/admin/timetable";
import Timetable from '@features/admin/timetable';

function InternalPage() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle({ title: 'Timetable' }));
    }, []);

    return <Timetable />;
}

export default InternalPage;
