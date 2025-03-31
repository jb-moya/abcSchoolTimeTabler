import { useEffect, useState } from 'react';

import Breadcrumbs from '@components/Admin/Breadcrumbs';
import SectionListContainer from '../../../components/Admin/SectionComponents/SectionListContainer';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';

function Sections() {

	const links = [
		{ name: 'Home', href: '/' },
		// { name: 'Modify Subjects', href: '/modify-subjects' },
	];

	const [buildings, setBuildings] = useState({});

	const { documents: subjects, loading1, error1 } = fetchDocuments('subjects');

	const { documents: programs, loading2, error2 } = fetchDocuments('programs');

	const { documents: sections, loading3, error3 } = fetchDocuments('sections');

	const { documents: teachers, loading4, error4 } = fetchDocuments('teachers');

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
			
			<Breadcrumbs title="Modify Sections" links={links} />

			{/* Main Content */}
			<div className="flex flex-col gap-4">
				<div className="card w-full bg-base-100 shadow-md">
					<div className="card-body">
						<SectionListContainer 	
							subjects={subjects}
							programs={programs}
							sections={sections}
							teachers={teachers}
							buildings={buildings}
							editable={true} 
						/>
					</div>
				</div>
			</div>

		</div>
	);

 
}

export default Sections;
