import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';
import RoomMapping from '@features/admin/rooms';

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Room Mapping' }));
  }, []);

  return <RoomMapping />;
}

export default InternalPage;
