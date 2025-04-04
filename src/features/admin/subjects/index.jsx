import SubjectListContainer from '../../../components/SubjectComponents/SubjectListContainer';
import ProgramListContainer from '../../../components/Admin/ProgramComponents/ProgramListContainer';
import Configuration from '@components/Admin/Configuration';
import Breadcrumbs from '@components/Admin/Breadcrumbs';

import { subscribeToSubjects } from '@features/slice/subject_slice';
import { subscribeToPrograms } from '@features/slice/program_slice';
import { subscribeToSections } from '@features/slice/section_slice';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

function Subject() {
	// Scope and Limitations
	// Room-Section Relationship: Each room is uniquely assigned to a specific subject, establishing a 1:1 relationship.
	// Due to this strict pairing, room allocation is not a factor in timetable generation.

	// Curriculum-Driven Course Selection: Students are required to follow a predefined curriculum.
	// They do not have the option to select subjects independently.

	// Standardized Class Start and Break Times: The start time for the first class and the timing of breaks are
	// standardized across all sections and teachers, ensuring uniformity in the daily schedule.

	// const dispatch = useDispatch();

	const { documents: subjects, loading1, error1 } = fetchDocuments('subjects');
	const { documents: programs, loading2, error2 } = fetchDocuments('programs');
	const { documents: sections, loading3, error3 } = fetchDocuments('sections');

	// useEffect(() => {
	// 	if (subjects.length === 0) dispatch(subscribeToSubjects());
	// 	if (programs.length === 0) dispatch(subscribeToPrograms());
	// 	if (sections.length === 0) dispatch(subscribeToSections());
	// }, [dispatch]);

	const links = [
		{ name: 'Home', href: '/' },
		// { name: 'Modify Subjects', href: '/modify-subjects' },
	];

	return (
	<div className="App container mx-auto px-4 mb-10">
		{/* Optional Configuration Component */}
			{/* <Configuration /> */}

			<Breadcrumbs title="Modify Subjects and Programs" links={links} />

			{/* Main Content */}
			<div className="flex flex-col gap-4">
				<div className="card w-full bg-base-100 shadow-md">
					<div className="card-body">
						<SubjectListContainer 
							subjects={subjects}
							programs={programs}
							sections={sections}
							editable={true} 
						/>
					</div>
				</div>

				<div className="card w-full bg-base-100 shadow-md">
					<div className="card-body">
						<ProgramListContainer 
							subjects={subjects}
							programs={programs}
							sections={sections}
							editable={true} 
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Subject;
