import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
	fetchRanks,
	addRank,
	editRank,
	removeRank,
} from '@features/rankSlice';
import { fetchSubjects } from '@features/subjectSlice';
import { fetchTeachers, editTeacher } from '@features/teacherSlice';

import debounce from 'debounce';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';


import { toast } from "sonner";
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import AdditionalScheduleForTeacherRank from './AdditionalScheduleForTeacherRank';
import AddTeacherRankContainer from './TeacherRankAdd';
import DeleteData from '../DeleteData';
import TeacherRankEdit from './TeacherRankEdit';


const TeacherRankListContainer = ({ 
	editable = false 
}) => {

	const dispatch = useDispatch();

// ===================================================================================================

	const { ranks, status: rankStatus } = useSelector(
		(state) => state.rank
	);

	const { teachers, status: teacherStatus } = useSelector(
		(state) => state.teacher
	);

// ===================================================================================================

	const numOfSchoolDays = (Number(localStorage.getItem('numOfSchoolDays')) || 0);

	const [errorMessage, setErrorMessage] = useState('');
	const [errorField, setErrorField] = useState('');

// ===================================================================================================

	const [editRankId, setEditRankId] = useState(null);
	const [editRankValue, setEditRankValue] = useState('');
	const [editAdditionalRankScheds, setEditAdditionalRankScheds] = useState([]);

// ===================================================================================================

	const [searchRankResult, setSearchRankResult] = useState(ranks);
	const [searchRankValue, setSearchRankValue] = useState('');

// ===================================================================================================

	// HANDLING CLICK OF RANK EDIT
	// const handleEditRankClick = (rank) => {
	// 	setEditRankId(rank.id);
	// 	setEditRankValue(rank.rank);
	// 	setEditAdditionalRankScheds(rank.additionalRankScheds);
	// };

	const handleCancelRankEditClick = () => {
		setEditRankId(null);
		setEditRankValue('');
		setEditAdditionalRankScheds([]);
	};

// ===================================================================================================

	//  HANDLING ADDITION AND DELETION OF ADDITIONAL RANK SCHEDULES
	// const handleAddAdditionalSchedule = () => {
	// 	setEditAdditionalRankScheds((prevScheds) => [
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

	// const handleDeleteAdditionalSchedule = (index) => {
	// 	setEditAdditionalRankScheds((prevScheds) =>
	// 		prevScheds.filter((_, i) => i !== index)
	// 	);
	// };

// ===================================================================================================

	// HANDLING UPDATE OF RANKS (and TEACHERS optional)
	const updateAllTeacherAdditionalSchedules = () => {

		Object.entries(teachers).forEach(([teacherID, teacher]) => {
			const newTeacher = JSON.parse(JSON.stringify(teacher));

			if (newTeacher.rank !== editRankId) return;

			const updatedSchedNames = new Set(editAdditionalRankScheds.map((sched) => sched.name));

			const advisoryLoadSched = newTeacher.additionalTeacherScheds.find(
				(sched) => sched.name === 'Advisory Load'
			);

			let updatedAdditionalScheds = structuredClone(editAdditionalRankScheds);

			if (advisoryLoadSched && !updatedSchedNames.has('Advisory Load')) {
				updatedAdditionalScheds.push(advisoryLoadSched);
				updatedSchedNames.add('Advisory Load'); 
			}

			const existingSchedsMap = new Map(
				newTeacher.additionalTeacherScheds.map((sched) => [sched.name, sched])
			);

			newTeacher.additionalTeacherScheds = updatedAdditionalScheds.map((updatedSched) => {
				const existingSched = existingSchedsMap.get(updatedSched.name);

				if (existingSched) {
					return {
						...existingSched,
						duration: updatedSched.duration || existingSched.duration,
						frequency: updatedSched.frequency || existingSched.frequency,
						shown: updatedSched.shown ?? existingSched.shown,
					};
				}

				// If the schedule doesn't exist, add it as is
				return updatedSched;
			});


			dispatch(
				editTeacher({
					teacherId: newTeacher.id,
					updatedTeacher: {
						teacher: newTeacher.teacher,
						department: newTeacher.department,
						rank: newTeacher.rank,
						subjects: newTeacher.subjects,
						yearLevels: newTeacher.yearLevels,
						additionalTeacherScheds: newTeacher.additionalTeacherScheds,
					},
				})
			);
			
		})
	};

	const handleSaveRankEditClick = (value) => {
		if (!editRankValue.trim()) {
			toast.error('All fields are required.', {
				style: { backgroundColor: 'red', color: 'white' },
			});
			return;
		}

		const currentRank = ranks[editRankId]?.rank || '';

		if (editRankValue.trim().toLowerCase() === currentRank.trim().toLowerCase()) {
			dispatch(
				editRank({
					rankId: editRankId,
					updatedRank: {
						rank: editRankValue,
						additionalRankScheds: editAdditionalRankScheds,
					},
				})
			);

			if (value) {
				updateAllTeacherAdditionalSchedules();
			}

			toast.success('Data and dependencies updated successfully', {
				style: { backgroundColor: 'green', color: 'white', bordercolor: 'green', },
			});

			setEditRankId(null);
			setEditRankValue('');
			setEditAdditionalRankScheds([]);
		} else {
			const duplicateRank = Object.values(ranks).find((rank) => rank.rank.trim().toLowerCase() === editRankValue.trim().toLowerCase());

			if (duplicateRank) {
				toast.error('Rank already exists.', {
					style: { backgroundColor: 'red', color: 'white' },
				});
				return;
			} else {
				dispatch(
					editRank({
						rankId: editRankId,
						updatedRank: {
							rank: editRankValue,
							additionalRankScheds: editAdditionalRankScheds,
						},
					})
				);

				if (value) {
					updateAllTeacherAdditionalSchedules();
				}

				toast.success('Data and dependencies updated successfully', {
					style: { backgroundColor: 'green', color: 'white', bordercolor: 'green', },
				});

				setEditRankId(null);
				setEditRankValue('');
				setEditAdditionalRankScheds([]);
			}
		}

		handleConfirmationModalClose();
	};

	const handleConfirmationModalClose = () => {
        document.getElementById(`confirm_rank_edit_modal`).close();
    };

// ===================================================================================================

	const handleClose = () => {
		const modal = document.getElementById('add_rank_modal');
		if (modal) {
			modal.close();
			setErrorMessage('');
			setErrorField('');
		} else {
			console.error("Modal with ID 'add_teacher_modal' not found.");
		}
	};

// ===================================================================================================

	//  FOR FETCHING ALL RANKS AND TEACHERS
	useEffect(() => {
		if (rankStatus === 'idle') {
			dispatch(fetchRanks());
		}
	}, [rankStatus, dispatch]);

	useEffect(() => {
		if (teacherStatus === 'idle') {
			dispatch(fetchTeachers());
		}
	}, [teacherStatus, dispatch]);

// ===================================================================================================

	// SEARCH FUNCTIONALITY
	const debouncedSearch = useCallback(
		debounce((searchValue, ranks) => {
			setSearchRankResult(
				filterObject(ranks, ([, rank]) => {
					if (!searchValue) return true;

					const escapedSearchValue = escapeRegExp(searchValue)
					.split('\\*')
					.join('.*');

					const pattern = new RegExp(escapedSearchValue, 'i');

					return (
					pattern.test(rank.rank) || pattern.test(rank.load)
					);
				})
			);
		}, 200),
		[]
	);

	useEffect(() => {
		debouncedSearch(searchRankValue, ranks);
	}, [searchRankValue, ranks, debouncedSearch]);

	// PAGINATION
	const itemsPerPage = 10; // Change this to adjust the number of items per page
	const [currentPage, setCurrentPage] = useState(1);

	// Calculate total pages
	const totalPages = Math.ceil(Object.values(searchRankResult).length / itemsPerPage);

	// Get current items
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = Object.entries(searchRankResult).slice(indexOfFirstItem, indexOfLastItem);

// ===================================================================================================

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
									handleCancelRankEditClick();
								}}
								disabled={currentPage === 1}
							>
								«
							</button>
							<button className="join-item btn">
								Page {currentPage} of {totalPages}
							</button>
							<button
								className={`join-item btn ${currentPage === totalPages ? 'btn-disabled' : ''}`}
								onClick={() => {
									if (currentPage < totalPages) {
										setCurrentPage(currentPage + 1);
									}
									handleCancelRankEditClick();
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

					{/* Search Rank */}
					<div className="flex-grow w-full md:w-1/3 lg:w-1/4">
						<label className="input input-bordered flex items-center gap-2 w-full">
							<input
								type="text"
								className="grow p-3 text-sm w-full"
								placeholder="Search Rank"
								value={searchRankValue}
								onChange={(e) => setSearchRankValue(e.target.value)}
							/>
							<IoSearch className="text-xl" />
						</label>
					</div>

					{/* Add Rank Button (only when editable) */}
					{editable && (
						<div className="w-full mt-4 md:mt-0 md:w-auto">
							<button
								className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
								onClick={() => document.getElementById('add_rank_modal').showModal()}
							>
								Add Rank <IoAdd size={20} className="ml-2" />
							</button>

							{/* Modal for adding rank */}
							<dialog id="add_rank_modal" className="modal modal-bottom sm:modal-middle">
								<div className="modal-box">
									<AddTeacherRankContainer
										close={() => document.getElementById('add_rank_modal').close()}
										reduxFunction={addRank}
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
							<th className="whitespace-nowrap">Rank ID</th>
							<th className="whitespace-nowrap">Rank</th>
							<th className="whitespace-nowrap">Additional Schedules</th>
							{editable && <th className="w-28 text-right">Actions</th>}
						</tr>
						</thead>
						<tbody>
						{currentItems.length === 0 ? (
							<tr>
								<td colSpan="5" className="text-center">
									No ranks found
								</td>
							</tr>
						) : (
							currentItems.map(([, rank], index) => (
							<tr key={rank.id} className="group hover">
								<td>{index + indexOfFirstItem + 1}</td>
								<th>{rank.id}</th>
								<td>
									{rank.rank}
								</td>
								<td>
									<div
										key={`edit-add-sched-view-tr(${rank.id})`}
										className="w-2/3 overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg"
										style={{
											scrollbarWidth: 'thin',
											scrollbarColor: '#a0aec0 #edf2f7',
										}} // Optional for styled scrollbars
									>
										<div
											className="font-bold p-2 border-b border-gray-300 bg-gray-300"
											style={{
												position: 'sticky',
												top: 0,
												zIndex: 1,
											}}
										></div>
										{rank.additionalRankScheds.map((sched, index) =>
											(
												<div
													key={index}
													className="flex flex-wrap"
												>
													<div className="w-1/12 text-xs font-bold bg-blue-100 flex text-center justify-center items-center p-2">
														{index + 1}
													</div>
													<div className="w-11/12">
														<button
															className="w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-white"
															onClick={() =>
																document.getElementById(`add_additional_sched_modal_1_tr-${rank.id}_idx-${index}`).showModal()
															}
														>
															{sched.name || sched.subject ? (
																// Content to show when both are not empty
																<>
																	<p>
																		Name:{' '}{sched.name}
																	</p>
																	<p>
																		Subject:{' '}
																		{sched.subject === 0 ? 'N/A' : subjects[sched.subject].subject}
																	</p>
																</>
															) : (
																// Content to show when either is empty
																<p>
																	Untitled Schedule{' '}{index + 1}
																</p>
															)}
														</button>
														<AdditionalScheduleForTeacherRank
															viewingMode={1}
															rankID={rank.id}
															arrayIndex={index}
															additionalSchedsOfRank={sched}
														/>
													</div>
												</div>
											)
										)}
									</div>
								</td>

								{editable && 
									(
										<td className="w-28">
											<>
												{/* <button
													className="btn btn-xs btn-ghost text-blue-500"
													onClick={() => handleEditRankClick(rank)}
												>
													<RiEdit2Fill size={20} />
												</button> */}

												<TeacherRankEdit
													rank = {rank}
													reduxFunction={editRank}
													errorMessage={errorMessage}
													setErrorMessage={setErrorMessage}
													errorField={errorField}
													setErrorField={setErrorField}
													numOfSchoolDays={numOfSchoolDays}
												/>
												<DeleteData 
													id={rank.id}
													reduxFunction={removeRank}
												/>

												
											</>
										</td>
									)
								}
							</tr>
							))
						)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Modal for confirming program modifications */}
			<dialog
				id="confirm_rank_edit_modal"
				className="modal modal-bottom sm:modal-middle"
			>
				<div
					className="modal-box"
					style={{ width: '30%', maxWidth: 'none' }}
				>
					<div>
						<div className="mb-3 text-center text-lg font-bold">
							Confirmation for Modifications on Rank
						</div>
					</div>

					<div>
						<div className="m-2 p-2">
							Your modifications in this rank will be now saved. Would
							you also like to for the ADDITIONAL SCHEDULE changes to 
							reflect on all associated teachers?
						</div>
						<div className="mt-4 flex justify-center items-center gap-3">
							<button
								className="btn btn-sm bg-green-400 hover:bg-green-200"
								onClick={() => {
									handleSaveRankEditClick(true); 
								}}
							>
								Yes
							</button>
							<button
								className="btn btn-sm"
								onClick={() => {
									handleSaveRankEditClick(false); 
								}} 
							>
								No
							</button>
						</div>
					</div>

					<div className="modal-action w-full mt-0">
						<button
							className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
							onClick={handleConfirmationModalClose}
						>
							✕
						</button>
					</div>
				</div>
			</dialog>
		</React.Fragment>
	);
};

export default TeacherRankListContainer;
