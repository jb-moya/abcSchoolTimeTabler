import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';
import ModifyDeparments from '@features/admin/departments';

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Modify Departments' }));
  }, []);

  return <ModifyDeparments />;
}

export default InternalPage;
