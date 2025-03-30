import { useEffect, useState } from 'react';

import Breadcrumbs from '@components/Admin/Breadcrumbs';
import RoomMapping from '@components/Admin/RoomsAndBuildings/RoomMapping';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';

function Rooms() {

    const links = [
        { name: 'Home', href: '/' },
        // { name: 'Modify Subjects', href: '/modify-subjects' },
    ];

    const [buildings, setBuildings] = useState({});

    const { documents: sections, loading1, error1 } = fetchDocuments('sections');

    const { documents: stringfy_buildings, loading5, error5 } = fetchDocuments('buildings');

    useEffect(() => {
		try {
			const converted_buildings = Object.values(stringfy_buildings).reduce((acc, { custom_id, data, id }) => {
				const parsedData = JSON.parse(data);
				acc[custom_id] = { ...parsedData, id, custom_id }; // Include id and custom_id inside data
				return acc;
			}, {});
			console.log('converted_buildings: ', converted_buildings);

			setBuildings(converted_buildings);
		} catch (error) {
			console.error('Failed to parse buildings JSON:', error);
		}
	}, [stringfy_buildings]);

    return (
        <div className="App container mx-auto px-4 mb-10">
            <Breadcrumbs title="Room Mapping" links={links} />

            {/* Main Content */}
            <div className="flex flex-col gap-4">
                <div className="card w-full bg-base-100 shadow-md">
                    <div className="card-body">
                        {/* <DepartmentListContainer editable={true} />  */}
                        <RoomMapping 
                            buildings={buildings}
                            sections={sections}
                            editable={true} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Rooms;
