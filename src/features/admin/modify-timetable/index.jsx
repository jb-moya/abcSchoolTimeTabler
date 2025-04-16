import { useEffect, useState } from 'react';

import Breadcrumbs from '@components/Admin/Breadcrumbs';
import TimetableListContainer from '@components/Admin/TimetableComponents/TimetableListContainer';
import { useSelector } from 'react-redux';

function ModifyTimetable({}) {
    const links = [{ name: 'Home', href: '/' }];

    const { subjects, loading: subjectsLoading, error: subjectsError } = useSelector((state) => state.subjects);
    const { programs, loading: programsLoading, error: programsError } = useSelector((state) => state.programs);
    const { sections, loading: sectionsLoading, error: sectionsError } = useSelector((state) => state.sections);
    const { ranks, loading: ranksLoading, error: ranksError } = useSelector((state) => state.ranks);
    const { teachers, loading: teachersLoading, error: teachersError } = useSelector((state) => state.teachers);
    const { departments, loading: departmentsLoading, error: departmentsError } = useSelector((state) => state.departments);
    const { schedules, loading: schedulesLoading, error: schedulesError } = useSelector((state) => state.schedules);
    const { buildings, loading: buildingsLoading, error: buildingsError } = useSelector((state) => state.buildings);

    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Modify TimeTable' links={links} />
            <TimetableListContainer
                subjects={subjects}
                programs={programs}
                sections={sections}
                teachers={teachers}
                ranks={ranks}
                departments={departments}
                schedules={schedules}
                buildings={buildings}
                loading={
                    subjectsLoading ||
                    programsLoading ||
                    sectionsLoading ||
                    teachersLoading ||
                    ranksLoading ||
                    departmentsLoading ||
                    schedulesLoading ||
                    buildingsLoading
                }
            />
        </div>
    );
}

export default ModifyTimetable;
