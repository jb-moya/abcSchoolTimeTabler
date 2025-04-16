import { useEffect, useState } from 'react';

import Breadcrumbs from '@components/Admin/Breadcrumbs';
import SectionListContainer from '../../../components/Admin/SectionComponents/SectionListContainer';
import { useSelector } from 'react-redux';

function Sections() {
    const links = [
        { name: 'Home', href: '/' },
        // { name: 'Modify Subjects', href: '/modify-subjects' },
    ];

    const { subjects, loading: subjectsLoading, error: subjectsError } = useSelector((state) => state.subjects);
    const { programs, loading: programsLoading, error: programsError } = useSelector((state) => state.programs);
    const { sections, loading: sectionsLoading, error: sectionsError } = useSelector((state) => state.sections);
    const { teachers, loading: teachersLoading, error: teachersError } = useSelector((state) => state.teachers);
    const { buildings, loading: buildingsLoading, error: buildingsError } = useSelector((state) => state.buildings);

    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Modify Sections' links={links} />

            {/* Main Content */}
            <div className='flex flex-col gap-4'>
                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body'>
                        <SectionListContainer
                            subjects={subjects}
                            programs={programs}
                            sections={sections}
                            teachers={teachers}
                            buildings={buildings}
                            editable={true}
                            loading={subjectsLoading || programsLoading || sectionsLoading || teachersLoading || buildingsLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sections;
