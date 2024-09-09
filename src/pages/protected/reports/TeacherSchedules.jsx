import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@features/common/headerSlice';

function InternalPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Teacher Schedules' }));
  }, []);

  return (
    <div className="hero h-4/5 bg-base-200">
      <div className="hero-content text-accent text-center">
        <div className="max-w-md">
          <h1 className="text-5xl mt-2 font-bold">Blank Page</h1>
        </div>
      </div>
    </div>
  );
}

export default InternalPage;
