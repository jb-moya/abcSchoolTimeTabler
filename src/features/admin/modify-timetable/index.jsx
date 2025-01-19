import Breadcrumbs from '@components/Admin/Breadcrumbs';
import ModifyTimetableContainer from '@components/Admin/ModifyTimetable/ModifyTimetableContainer';

function ModifyTimetable({ table }) {
    const links = [{ name: 'Home', href: '/' }];
    console.log('table: ', table);
    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Modify TimeTable' links={links} />
            {/* Main Content */}
            <div className='flex flex-col gap-4'>
                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body'>
                        <ModifyTimetableContainer hashMap={table} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModifyTimetable;
