import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTeachers,
  addTeacher,
  editTeacher,
  removeTeacher,
} from '@features/teacherSlice';

import { fetchSubjects } from '@features/subjectSlice';
import { fetchRanks } from '@features/rankSlice';
import { fetchDepartments } from '@features/departmentSlice';
import debounce from 'debounce';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import SearchableDropdownToggler from '../searchableDropdown';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';

import { toast } from "sonner";

import AdditionalScheduleForTeacher from './AdditionalScheduleForTeacher';
import AddTeacherContainer from './TeacherAdd';
import DeleteData from '../DeleteData';
import TeacherEdit from './TeacherEdit';


const TeacherListContainer = ({ editable = false }) => {
	const dispatch = useDispatch();

	const { teachers, status: teacherStatus } = useSelector(
		(state) => state.teacher
	);

	const { subjects, status: subjectStatus } = useSelector(
		(state) => state.subject
	);

	const { ranks, status: rankStatus } = useSelector(
		(state) => state.rank
	);

	const { departments, status: departmentStatus } = useSelector(
		(state) => state.department
	);

	const numOfSchoolDays = (Number(localStorage.getItem('numOfSchoolDays')) || 0);

	const [errorMessage, setErrorMessage] = useState('');
	const [errorField, setErrorField] = useState('');

	const [editTeacherId, setEditTeacherId] = useState(null);
	const [editTeacherRank, setEditTeacherRank] = useState(0);

	const [editTeacherDepartment, setEditTeacherDepartment] = useState(0);

	const [editTeacherValue, setEditTeacherValue] = useState('');
	const [editTeacherCurr, setEditTeacherCurr] = useState([]);
	const [editTeacherYearLevels, setEditTeacherYearLevels] = useState([]);
	const [editTeacherAdditionalScheds, setEditTeacherAdditionalScheds] = useState([]);

	const [searchTeacherResult, setSearchTeacherResult] = useState(teachers);
	const [searchTeacherValue, setSearcTeacherValue] = useState('');

	// For rank change
	const [tempRank, setTempRank] = useState(0);

	// const handleEditTeacherClick = (teacher) => {
	// 	setEditTeacherId(teacher.id);
	// 	setEditTeacherRank(teacher.rank);
	// 	setEditTeacherValue(teacher.teacher);
	// 	setEditTeacherCurr(teacher.subjects);
	// 	setEditTeacherYearLevels(teacher.yearLevels);
	// 	setEditTeacherAdditionalScheds(teacher.additionalTeacherScheds);

	// 	setTempRank(teacher.rank);
	// };

	// const handleSaveTeacherEditClick = (teacherId) => {

	// 	if (!editTeacherValue.trim() || editTeacherRank === 0 || editTeacherCurr.length === 0 || editTeacherYearLevels.length === 0) {
	// 		toast.error('All fields are required.', {
	// 		style: { backgroundColor: 'red', color: 'white' },
	// 		});
	// 		return;
	// 	}

	// 	const currentTeacher = teachers[teacherId]?.teacher || '';

	// 	if (editTeacherValue.trim().toLowerCase() === currentTeacher.trim().toLowerCase()) {
	// 		dispatch(
	// 			editTeacher({
	// 				teacherId,
	// 				updatedTeacher: {
	// 				teacher: editTeacherValue,
	// 				rank: editTeacherRank,
	// 				subjects: editTeacherCurr,
	// 				yearLevels: editTeacherYearLevels,
	// 				additionalTeacherScheds: editTeacherAdditionalScheds,
	// 				},
	// 			})
	// 		);

	// 		toast.success('Data updated successfully', {
	// 			style: { backgroundColor: 'green', color: 'white', bordercolor: 'green', },
	// 		});

	// 		setEditTeacherId(null);
	// 		setEditTeacherRank(0);
	// 		setEditTeacherValue('');
	// 		setEditTeacherCurr([]);
	// 		setEditTeacherYearLevels([]);
	// 		setEditTeacherAdditionalScheds([]);
	// 	} else {
	// 		const duplicateTeacher = Object.values(teachers).find(
	// 			(teacher) => teacher.teacher.trim().toLowerCase() === editTeacherValue.trim().toLowerCase()
	// 		);

	// 		if (duplicateTeacher) {
	// 			toast.error('Teacher already exists.', {
	// 				style: { backgroundColor: 'red', color: 'white' },
	// 			});
	// 			return;
	// 		} else {
	// 			dispatch(
	// 				editTeacher({
	// 					teacherId,
	// 					updatedTeacher: {
	// 						teacher: editTeacherValue,
	// 						department: editTeacherDepartment,
	// 						rank: editTeacherRank,
	// 						subjects: editTeacherCurr,
	// 						yearLevels: editTeacherYearLevels,
	// 						additionalTeacherScheds: editTeacherAdditionalScheds,
	// 					},
	// 				})
	// 			);
	// 			setEditTeacherId(null);
	// 			setEditTeacherRank(0);
	// 			setEditTeacherValue('');
	// 			setEditTeacherCurr([]);
	// 			setEditTeacherYearLevels([]);
	// 			setEditTeacherAdditionalScheds([]);
	// 		}
	// }
	// };

	// const handleCancelTeacherEditClick = () => {
	// 	setEditTeacherId(null);
	// 	setEditTeacherRank(0);
	// 	setEditTeacherValue('');
	// 	setEditTeacherCurr([]);
	// 	setEditTeacherYearLevels([]);
	// 	setEditTeacherAdditionalScheds([]);

	// 	setTempRank(0);
	// };

	// const handleRankChange = (event) => {
	// 	setEditTeacherRank(parseInt(event.target.value));
	// };

	// const handleDepartmentChange = (event) => {
	// 	setEditTeacherDepartment(parseInt(event.target.value));
	// };

	// const handleYearLevelChange = (level) => {
	// 	if (editTeacherYearLevels.includes(level)) {
	// 		setEditTeacherYearLevels(editTeacherYearLevels.filter((l) => l !== level));
	// 	} else {
	// 		setEditTeacherYearLevels([...editTeacherYearLevels, level]);
	// 	}
	// };

	// const handleAddTeacherAdditionalSchedules = () => {
	// 	setEditTeacherAdditionalScheds((prevScheds) => [
	// 		...prevScheds,
	// 		{
	// 			name: '',
	// 			subject: 0,
	// 			duration: 60,
	// 			frequency: 1,
	// 			shown: true,
	// 			time: 72,
	// 		},
	// 	]);
	// };
	
	// const handleDeleteTeacherAdditionalSchedule = (index) => {
	// 	setEditTeacherAdditionalScheds((prevScheds) =>
	// 		prevScheds.filter((_, i) => i !== index)
	// 	);
	// };

	const debouncedSearch = useCallback(
		debounce((searchValue, teachers, subjects) => {
			setSearchTeacherResult(
			filterObject(teachers, ([, teacher]) => {
				if (!searchValue) return true;

				const teachersSubjectsName = teacher.subjects
				.map((subjectID) => subjects[subjectID].subject)
				.join(' ');

				const escapedSearchValue = escapeRegExp(searchValue)
				.split('\\*')
				.join('.*');

				const pattern = new RegExp(escapedSearchValue, 'i');

				return (
				pattern.test(teacher.teacher) || pattern.test(teachersSubjectsName)
				);
			})
			);
		}, 200),
		[]
	);

	// Update additional teacher schedules when rank changes
	useEffect(() => {
		if (editTeacherRank !== tempRank) {
			const rank = Object.values(ranks).find((rank) => rank.id === editTeacherRank);

			if (rank) {
				setEditTeacherAdditionalScheds(rank.additionalRankScheds);
			}

			setTempRank(editTeacherRank);
		}
	}, [editTeacherRank]);

	useEffect(() => {
		debouncedSearch(searchTeacherValue, teachers, subjects);
	}, [searchTeacherValue, teachers, debouncedSearch, subjects]);

	useEffect(() => {
		if (teacherStatus === 'idle') {
			dispatch(fetchTeachers());
		}
	}, [teacherStatus, dispatch]);

	useEffect(() => {
		if (subjectStatus === 'idle') {
			dispatch(fetchSubjects());
		}
	}, [subjectStatus, dispatch]);

	useEffect(() => {
		if (rankStatus === 'idle') {
			dispatch(fetchRanks());
		}
	}, [rankStatus, dispatch]);

	useEffect(() => {
		if (departmentStatus === 'idle') {
			dispatch(fetchDepartments());
		}
	}, [departmentStatus, dispatch]);

	const itemsPerPage = 10; // Change this to adjust the number of items per page
	const [currentPage, setCurrentPage] = useState(1);

	// Calculate total pages
	const totalPages = Math.ceil(Object.values(searchTeacherResult).length / itemsPerPage);

	// Get current items
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = Object.entries(searchTeacherResult).slice(indexOfFirstItem, indexOfLastItem);

	const handleClose = () => {
		const modal = document.getElementById('add_teacher_modal');
		if (modal) {
			modal.close();
			setErrorMessage('');
			setErrorField('');
		} else {
			console.error("Modal with ID 'add_teacher_modal' not found.");
		}
	};

	return (
		<React.Fragment>
			<div className="w-full">

				<div className="flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5">
					
					{/* Pagination */}
					{currentItems.length > 0 && (
						<div className="join flex justify-center mb-4 md:mb-0">
							<button
								className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
								onClick={() => {
									if (currentPage > 1) {
									setCurrentPage(currentPage - 1);
									}
									handleCancelTeacherEditClick();
								}}
								disabled={currentPage === 1}
							>
								«
							</button>
							<button 
								className="join-item btn"
							>
								Page {currentPage} of {totalPages}
							</button>
							<button
								className={`join-item btn ${currentPage === totalPages ? 'btn-disabled' : ''}`}
								onClick={() => {
									if (currentPage < totalPages) {
									setCurrentPage(currentPage + 1);
									}
									handleCancelTeacherEditClick();
								}}
								disabled={currentPage === totalPages}
							>
								»
							</button>
						</div>
					)}

					{currentItems.length === 0 && currentPage > 1 && (
						<div className="hidden">
							{setCurrentPage(currentPage - 1)}
						</div>
					)}

					{/* Search Teacher */}
					<div className="flex-grow w-full md:w-1/3 lg:w-1/4">
						<label className="input input-bordered flex items-center gap-2 w-full">
							<input
								type="text"
								className="grow p-3 text-sm w-full"
								placeholder="Search Teacher"
								value={searchTeacherValue}
								onChange={(e) => setSearcTeacherValue(e.target.value)}
							/>
							<IoSearch className="text-xl" />
						</label>
					</div>

					{/* Add Teacher Button (only when editable) */}
					{editable && (
						<div className="w-full mt-4 md:mt-0 md:w-auto">
							<button
								className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
								onClick={() => document.getElementById('add_teacher_modal').showModal()}
							>
								Add Teacher <IoAdd size={20} className="ml-2" />
							</button>

							{/* Modal for adding teacher */}
							<dialog id="add_teacher_modal" className="modal modal-bottom sm:modal-middle">
								<div 
									className="modal-box"
									style={{ width: '40%', maxWidth: 'none' }}
								>
									<AddTeacherContainer
										close={() => document.getElementById('add_teacher_modal').close()}
										reduxFunction={addTeacher}
										errorMessage={errorMessage}
										setErrorMessage={setErrorMessage}
										errorField={errorField}
										setErrorField={setErrorField}
										numOfSchoolDays={numOfSchoolDays}
									/>
									<div className="modal-action">
										<button
											className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
											onClick={handleClose}
										>
											✕
										</button>
									</div>
								</div>
							</dialog>
						</div>
					)}

				</div>

				<div className='overflow-x-auto'>
					<table className="table table-sm table-zebra w-full">
						<thead>
							<tr>
								<th className="w-8">#</th>
								<th className="whitespace-nowrap">Teacher ID</th>
								<th className="whitespace-nowrap">Teacher</th>
								<th className="whitespace-nowrap">Rank</th>
								<th className="whitespace-nowrap">Department</th>
								<th className="whitespace-nowrap max-w-xs">Subject Specialization</th>
								<th className="whitespace-nowrap max-w-xs">Assigned Year Level(s)</th>
								<th className="whitespace-nowrap">Additional Schedules</th>
								{editable && <th className="w-28 text-right">Actions</th>}
							</tr>
						</thead>
						<tbody>
							{currentItems.length === 0 ? (
								<tr>
									<td colSpan="8" className="text-center">
										No teachers found
									</td>
								</tr>
							) : (
								currentItems.map(([, teacher], index) => (
									<tr key={teacher.id} className="group hover">

										{/* Index */}
										<td>{index + indexOfFirstItem + 1}</td>

										{/* Teacher ID */}
										<th>{teacher.id}</th>
										
										{/* Teacher Name */}
										<td>
											{editTeacherId === teacher.id ? (
												<input
													type="text"
													className="input input-bordered input-sm w-full"
													value={editTeacherValue}
													onChange={(e) => setEditTeacherValue(e.target.value)}
												/>
												) : (
													teacher.teacher
											)}
										</td>
										
										{/* Teacher Rank */}
										<td>
											{editTeacherId === teacher.id ? (
												<div>
													<select
														id="teacherRank"
														className="input input-bordered input-sm w-full"
														value={editTeacherRank || ''}
														onChange={handleRankChange}
													>
													<option value="" disabled>
														Select rank
													</option>
													{ranks && Object.keys(ranks).length > 0 ? (
														Object.values(ranks).map((rank) => (
														<option key={rank.id} value={rank.id}>
															{rank.rank}
														</option>
														))
													) : (
														<option disabled>No ranks available</option>
													)}
													</select>
												</div>
											) : (
												ranks[teacher.rank]?.rank || "Unknown Rank"
											)}
										</td>
										
										{/* Teacher Department */}
										<td>
											{editTeacherId === teacher.id ? (
												<div>
													<select
														id="teacherDepartment"
														className="input input-bordered input-sm w-full"
														value={editTeacherDepartment || ''}
														onChange={handleDepartmentChange}
													>
													<option value="" disabled>
														Select department
													</option>
													{departments && Object.keys(departments).length > 0 ? (
														Object.values(departments).map((department) => (
														<option key={department.id} value={department.id}>
															{`${department.name || ''}${department.head ? ` - ${department.head}` : ''}`}
														</option>
														))
													) : (
														<option disabled>No departments available</option>
													)}
													</select>
												</div>
											) : (
												departments?.[String(teacher.department)]?.name || "Unknown Department"
											)}
										</td>

										{/* Teacher Subjects */}
										<td className="flex gap-1 flex-wrap">
											{editTeacherId === teacher.id ? (
												<>
													<div className="m-1">Selected Subjects:</div>
													{editTeacherCurr && Array.isArray(editTeacherCurr) && subjects ? (
														editTeacherCurr.map((subjectID) => (
															<div key={subjectID} className="badge badge-secondary m-1">
															{subjects[subjectID]?.subject || subjectID}
															</div>
														))
													) : (
													<div>No subjects selected</div>
													)}
													<SearchableDropdownToggler
														selectedList={editTeacherCurr}
														setSelectedList={setEditTeacherCurr}
														isEditable={true}
													/>
												</>
											) : (
												subjectStatus === 'succeeded' &&
													teacher.subjects.map((subject) => (
														<div key={subject} className="badge badge-secondary m-1">
														{subjects[subject]?.subject || 'Unknown Subject'}
														</div>
													))
											)}
										</td>
										
										{/* Teacher Year Levels */}
										<td>
											{editTeacherId === teacher.id ? (
												<div>
													<label>
													<input
														type="checkbox"
														checked={editTeacherYearLevels.includes(0)}
														onChange={() => handleYearLevelChange(0)}
													/>
													Grade 7
													</label>
													<br />
													<label>
													<input
														type="checkbox"
														checked={editTeacherYearLevels.includes(1)}
														onChange={() => handleYearLevelChange(1)}
													/>
													Grade 8
													</label>
													<br />
													<label>
													<input
														type="checkbox"
														checked={editTeacherYearLevels.includes(2)}
														onChange={() => handleYearLevelChange(2)}
													/>
													Grade 9
													</label>
													<br />
													<label>
													<input
														type="checkbox"
														checked={editTeacherYearLevels.includes(3)}
														onChange={() => handleYearLevelChange(3)}
													/>
													Grade 10
													</label>
												</div>
											) : (
												<div>
													<label>
													<input
														type="checkbox"
														checked={teacher.yearLevels.includes(0)}
														readOnly
													/>
													Grade 7
													</label>
													<br />
													<label>
													<input
														type="checkbox"
														checked={teacher.yearLevels.includes(1)}
														readOnly
													/>
													Grade 8
													</label>
													<br />
													<label>
													<input
														type="checkbox"
														checked={teacher.yearLevels.includes(2)}
														readOnly
													/>
													Grade 9
													</label>
													<br />
													<label>
													<input
														type="checkbox"
														checked={teacher.yearLevels.includes(3)}
														readOnly
													/>
													Grade 10
													</label>
												</div>
											)}
										</td>

										{/* Teacher Additional Schedules */}
										<td>
											{editTeacherId === teacher.id ? (
												<>
													<div
														key={`edit-add-sched-edit-teacher(${editTeacherId})`}
														className="mt-2 overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg"
														style={{
															scrollbarWidth: 'thin',
															scrollbarColor: '#a0aec0 #edf2f7',
														}} // Optional for styled scrollbars
													>
														<div
															className="flex flex-wrap"
															style={{
																position: 'sticky',
																top: 0,
																zIndex: 1,
																backgroundColor: 'white',
															}}
														>
															<div className="w-3/12 flex justify-center items-center border-b border-gray-300">
																<button
																	className="w-3/4 bg-green-700 m-2 font-bold text-white rounded-lg hover:bg-green-500"
																	onClick={handleAddTeacherAdditionalSchedules}
																>
																	+
																</button>
															</div>
														</div>
														{editTeacherAdditionalScheds.map((sched, index) => (
															<div
																key={index}
																className="flex flex-wrap"
															>
																<button
																	className="w-1/12 border rounded-l-lg hover:bg-gray-200 flex items-center justify-center"
																	onClick={() => handleDeleteTeacherAdditionalSchedule(index)}
																>
																	<RiDeleteBin7Line
																		size={15}
																	/>
																</button>
																<div className="w-10/12">
																	<button
																		className="w-full bg-gray-100 p-2 border shadow-sm hover:bg-gray-200"
																		onClick={() => document.getElementById(`add_additional_sched_modal_1_teacher-${editTeacherId}_idx-${index}`).showModal()}
																	>
																		{sched.name ||
																		sched.subject ? (
																			// Content to show when both are not empty
																			<>
																				<p>
																					Name:{' '}{sched.name}
																				</p>
																				<p>
																					Subject:{' '}
																					{sched.subject === 0
																						? 'N/A'
																						: 
																						subjects[sched.subject].subject
																					}
																				</p>
																			</>
																		) : (
																			// Content to show when either is empty
																			<p>
																				Untitled Schedule{' '}
																				{index + 1}
																			</p>
																		)}
																	</button>
																	<AdditionalScheduleForTeacher
																		viewingMode={1}
																		teacherID={editTeacherId}
																		arrayIndex={index}
																		additionalSchedsOfTeacher={sched}
																	/>
																</div>
																<div className="w-1/12  flex items-center justify-center border rounded-r-lg hover:bg-gray-200">
																	<button
																		onClick={() => document.getElementById(`add_additional_sched_modal_0_teacher-${editTeacherId}_idx-${index}`).showModal()}
																	>
																		<RiEdit2Fill
																			size={15}
																		/>
																	</button>
																	<AdditionalScheduleForTeacher
																		viewingMode={0}
																		teacherID={editTeacherId}
																		arrayIndex={index}
																		teacherSubjects={editTeacherCurr}
																		numOfSchoolDays={numOfSchoolDays}
																		additionalSchedsOfTeacher={sched}
																		setAdditionalScheds={setEditTeacherAdditionalScheds}
																	/>
																</div>
															</div>
														))}
													</div>
												</>
											) : (
												<>
													<div
														key={`edit-add-sched-view-teacher(${teacher.id})`}
														className="overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg"
														style={{
															scrollbarWidth:
																'thin',
															scrollbarColor:
																'#a0aec0 #edf2f7',
														}} // Optional for styled scrollbars
													>
														<div
															className="font-bold p-2 border-b border-gray-300 bg-gray-300"
															style={{
																position:
																	'sticky',
																top: 0,
																zIndex: 1,
															}}
														></div>
														{teacher.additionalTeacherScheds.map(
															(sched, index) => (
																<div
																	key={index}
																	className="flex flex-wrap"
																>
																	<div className="w-1/12 text-xs font-bold bg-blue-100 flex text-center justify-center items-center p-2">
																		{index +
																			1}
																	</div>
																	<div className="w-11/12">
																		<button
																			className="w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-white"
																			onClick={() => document.getElementById(`add_additional_sched_modal_1_teacher-${teacher.id}_idx-${index}`).showModal()}
																		>
																			{sched.name || sched.subject ? (
																				// Content to show when both are not empty
																				<>
																					<p>
																						Name:{' '}{sched.name}
																					</p>
																					<p>
																						Subject:{' '}
																						{
																							sched.subject === 0
																								? 'N/A'
																								: subjects[sched.subject].subject
																						}
																					</p>
																				</>
																			) : (
																				// Content to show when either is empty
																				<p>
																					Untitled Schedule{' '}{index + 1}
																				</p>
																			)}
																		</button>
																		<AdditionalScheduleForTeacher
																			viewingMode={1}
																			teacherID={teacher.id}
																			arrayIndex={index}
																			additionalSchedsOfTeacher={sched}
																		/>
																	</div>
																</div>
															)
														)}
													</div>
												</>
											)}
										</td>

										{editable && (
											<td className="w-28 text-right">
												<div className='flex'>

												<TeacherEdit 
														teacher = {teacher}
														reduxFunction={editTeacher}
														errorMessage={errorMessage}
														setErrorMessage={setErrorMessage}
														errorField={errorField}
														setErrorField={setErrorField}
														numOfSchoolDays={numOfSchoolDays}
														/>
														
														<DeleteData 
														id={teacher.id} reduxFunction={removeTeacher} 
														/>
													
												</div>
											</td>
										)}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

			</div>
		</React.Fragment>
	);
};

export default TeacherListContainer;
