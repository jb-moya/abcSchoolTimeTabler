import Breadcrumbs from '@components/Admin/Breadcrumbs';
import TimetableListContainer from '@components/Admin/TimetableComponents/TimetableListContainer';

function ModifyTimetable({}) {
    const links = [{ name: 'Home', href: '/' }];

    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Modify TimeTable' links={links} />
            <TimetableListContainer />
        </div>
    );
}

export default ModifyTimetable;
