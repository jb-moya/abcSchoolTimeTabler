import Breadcrumbs from '@components/Admin/Breadcrumbs';
import DepartmentListContainer from '../../../components/Admin/DepartmentComponents/DepartmentListContainer';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';

function Departments() {

	const { documents: departments, loading1, error1 } = fetchDocuments('departments');

	const { documents: teachers, loading2, error2 } = fetchDocuments('teachers');

	const links = [
		{ name: 'Home', href: '/' },
		// { name: 'Modify Subjects', href: '/modify-subjects' },
	];

	return (
		<div className="App container mx-auto px-4 mb-10">

			<Breadcrumbs title="Modify Departments" links={links} />
		
			{/* Main Content */}
			<div className="flex flex-col gap-4">
				<div className="card w-full bg-base-100 shadow-md">
					<div className="card-body">
						<DepartmentListContainer 
							departments={departments}
							teachers={teachers}
							editable={true} 
						/> 
					</div>
				</div>
			</div>
		</div>
	);

 
}

export default Departments;
