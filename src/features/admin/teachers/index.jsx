import TeacherListContainer from '@components/Admin/Teacher/TeacherListContainer';
import TeacherRankListContainer from '@components/Admin/Teacher/TeacherRankListContainer';
import Breadcrumbs from '@components/Admin/Breadcrumbs';
import { useSelector } from 'react-redux';

function Teachers() {
    const { subjects, loading: subjectsLoading, error: subjectsError } = useSelector((state) => state.subjects);
    const { ranks, loading: ranksLoading, error: ranksError } = useSelector((state) => state.ranks);
    const { teachers, loading: teachersLoading, error: teachersError } = useSelector((state) => state.teachers);
    const { departments, loading: departmentsLoading, error: departmentsError } = useSelector((state) => state.departments);

    const links = [
        { name: 'Home', href: '/' },
        // { name: 'Modify Subjects', href: '/modify-subjects' },
    ];

    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Modify Teachers' links={links} />

            {/* Main Content */}
            <div className='flex flex-col gap-4'>
                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body'>
                        <TeacherListContainer
                            teachers={teachers}
                            ranks={ranks}
                            departments={departments}
                            subjects={subjects}
                            editable={true}
                            loading={
                                subjectsLoading ||
                                ranksLoading ||
                                teachersLoading ||
                                departmentsLoading
                            }
                        />
                    </div>
                </div>
                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body'>
                        <TeacherRankListContainer 
                            ranks={ranks} 
                            teachers={teachers} 
                            editable={true} 
                            loading={ranksLoading || teachersLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Teachers;
