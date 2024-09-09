import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';
import ModifySubjects from '@features/admin/subjects';

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Modify Subjects' }));
  }, []);

  return <ModifySubjects />;
}

export default InternalPage;
