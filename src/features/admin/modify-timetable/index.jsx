import { useEffect, useState } from 'react';

import Breadcrumbs from '@components/Admin/Breadcrumbs';
import TimetableListContainer from '@components/Admin/TimetableComponents/TimetableListContainer';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';

function ModifyTimetable({}) {

    const links = [
        { name: 'Home', href: '/' }
    ];

    const [buildings, setBuildings] = useState({});
    
    const { documents: subjects, loading1, error1 } = fetchDocuments('subjects');

    const { documents: programs, loading2, error2 } = fetchDocuments('programs');

    const { documents: sections, loading3, error3 } = fetchDocuments('sections');

    const { documents: teachers, loading4, error4 } = fetchDocuments('teachers');

    const { documents: ranks, loading5, error5 } = fetchDocuments('ranks');

    const { documents: departments, loading6, error6 } = fetchDocuments('departments');

    const { documents: schedules, loading7, error7 } = fetchDocuments('schedules');

    const { documents: stringfy_buildings, loading8, error8 } = fetchDocuments('buildings');

    useEffect(() => {
        try {
            const converted_buildings = Object.values(stringfy_buildings).reduce((acc, { data, id }) => {
                const parsedData = JSON.parse(data);
                acc[id] = { ...parsedData, id }; // Include id and custom_id inside data
                return acc;
            }, {});
            console.log('converted_buildings: ', converted_buildings);

            setBuildings(converted_buildings);
        } catch (error) {
            console.error('Failed to parse buildings JSON:', error);
        }
    }, [stringfy_buildings]);

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
            />
        </div>
    );
}

export default ModifyTimetable;
