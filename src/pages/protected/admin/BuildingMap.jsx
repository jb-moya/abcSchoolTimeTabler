import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';
import BuildingMap from '@features/admin/map';

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Room Utilization' }));
  }, []);

  return <BuildingMap />;
}

export default InternalPage;
