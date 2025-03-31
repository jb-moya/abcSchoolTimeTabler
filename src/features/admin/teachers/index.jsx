import TeacherListContainer from '@components/Admin/Teacher/TeacherListContainer';
import TeacherRankListContainer from '@components/Admin/Teacher/TeacherRankListContainer';
import Breadcrumbs from '@components/Admin/Breadcrumbs';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';

function Teachers() {

	const { documents: teachers, loading1, error1 } = fetchDocuments('teachers');

	const { documents: ranks, loading2, error2 } = fetchDocuments('ranks');

	const { documents: departments, loading3, error3 } = fetchDocuments('departments');

	const { documents: subjects, loading4, error4 } = fetchDocuments('subjects');

	const links = [
		{ name: 'Home', href: '/' },
		// { name: 'Modify Subjects', href: '/modify-subjects' },
	];

	return (
		<div className="App container mx-auto px-4 mb-10">

			<Breadcrumbs title="Modify Teachers" links={links} />
		
			{/* Main Content */}
			<div className="flex flex-col gap-4">
				<div className="card w-full bg-base-100 shadow-md">
					<div className="card-body">
						<TeacherListContainer
							teachers={teachers}
							ranks={ranks}
							departments={departments}
							subjects={subjects} 
							editable={true} 
						/>
					</div>
				</div>
				<div className="card w-full bg-base-100 shadow-md">
					<div className="card-body">
						<TeacherRankListContainer 
							ranks={ranks}
							teachers={teachers}
							editable={true} 
						/>
					</div>
					
				</div>
			</div>
		</div>
	);

 
}

export default Teachers;
