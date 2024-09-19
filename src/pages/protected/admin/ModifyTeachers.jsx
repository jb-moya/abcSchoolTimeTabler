import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';
import ModifyTeachers from '@features/admin/teachers';

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Modify Teachers' }));
  }, []);

  return <ModifyTeachers />;
}

export default InternalPage;
