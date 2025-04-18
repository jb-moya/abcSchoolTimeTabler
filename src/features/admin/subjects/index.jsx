import SubjectListContainer from '../../../components/SubjectComponents/SubjectListContainer';
import ProgramListContainer from '../../../components/Admin/ProgramComponents/ProgramListContainer';
import Breadcrumbs from '@components/Admin/Breadcrumbs';

function Subject() {
    const links = [{ name: 'Home', href: '/' }];

    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Modify Subjects and Programs' links={links} />

            <div className='flex flex-col gap-4'>
                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body'>
                        <SubjectListContainer editable={true} />
                    </div>
                </div>

                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body'>
                        <ProgramListContainer editable={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Subject;
