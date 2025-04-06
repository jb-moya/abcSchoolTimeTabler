import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';
import ModifyTimetable from '@features/admin/modify-timetable';
import { enableMapSet } from 'immer';

enableMapSet();
function InternalPage() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle({ title: 'Modify Timetable' }));
    }, []);

    // const location = useLocation();

    // // fetch string

    // // use convertStringDataToMap to convert it to Map

    // // pass the converted map here (just remove the location state etc)
    // const generatedMap = location.state?.generatedMap ?? new Map();

    // console.log('generatedTableMap: ', generatedMap);

    // return <ModifyTimetable table={generatedMap} />;
    return <ModifyTimetable />;
}

export default InternalPage;
