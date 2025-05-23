import Breadcrumbs from '@components/Admin/Breadcrumbs';
import SectionListContainer from '../../../components/Admin/SectionComponents/SectionListContainer';

function Sections() {
    const links = [{ name: 'Home', href: '/' }];

    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Modify Sections' links={links} />

            {/* Main Content */}
            <div className='flex flex-col gap-4'>
                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body'>
                        <SectionListContainer editable={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sections;
