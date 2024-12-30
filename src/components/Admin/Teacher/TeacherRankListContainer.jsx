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

import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';
import TimeSelector from '@utils/timeSelector';

import debounce from 'debounce';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { IoAdd, IoSearch } from 'react-icons/io5';

import { clsx } from 'clsx';
import { toast } from "sonner";
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

const AdditionalScheduleForTeacherRank = ({
	viewingMode = 0,
	rankID = 0,

	arrayIndex = 0,

	numOfSchoolDays = 1,

	additionalSchedsOfRank = [],
	setAdditionalScheds = () => {},
}) => {
	
	const lastSchedTimeRef = useRef();

	const [schedName, setSchedName] = useState(additionalSchedsOfRank.name);
	const [schedSubject, setSchedSubject] = useState(
		additionalSchedsOfRank.subject || ''
	);
	const [schedDuration, setSchedDuration] = useState(
		additionalSchedsOfRank.duration || 0
	);
	const [schedFrequency, setSchedFrequency] = useState(
		additionalSchedsOfRank.frequency || 0
	);
	const [schedShown, setSchedShown] = useState(
		additionalSchedsOfRank.shown || false
	);
	const [schedTime, setSchedTime] = useState(
		additionalSchedsOfRank.time || 0
	);

	const [time, setTime] = useState();

	const handleSave = () => {
		const newSched = {
			name: schedName,
			subject: schedSubject,
			duration: schedDuration,
			frequency: schedFrequency,
			shown: schedShown,
			time: getTimeSlotIndex(time),
		};

		// console.log('Old Sched: ', additionalSchedsOfRank);

		setAdditionalScheds((prev) => {
			const updatedScheds = [...prev];
			updatedScheds[arrayIndex] = newSched;

			// console.log('Updated Scheds:', updatedScheds);

			return updatedScheds;
		});

		resetStates();

		document
			.getElementById(
				`add_additional_sched_modal_${viewingMode}_tr-${rankID}_idx-${arrayIndex}`
			)
			.close();
	};

	const handleClose = () => {
		const modal = document.getElementById(
			`add_additional_sched_modal_${viewingMode}_tr-${rankID}_idx-${arrayIndex}`
		);

		resetStates();

		if (modal) {
			modal.close();
		}
	};

	const resetStates = () => {
		setSchedName(additionalSchedsOfRank.name);
		setSchedSubject(additionalSchedsOfRank.subject);
		setSchedDuration(additionalSchedsOfRank.duration);
		setSchedFrequency(additionalSchedsOfRank.frequency);
		setSchedShown(additionalSchedsOfRank.frequency);
	};

	useEffect(() => {
		if (schedTime !== lastSchedTimeRef.current) {
			lastSchedTimeRef.current = schedTime;

			const timeString = getTimeSlotString(schedTime);
			// console.log('schedTime', schedTime);

			// console.log('timeString', timeString);

			if (timeString) {
				setTime(timeString);
			}

		}
	}, [schedTime]);

	useEffect(() => {
		setSchedName(additionalSchedsOfRank.name || '');
		setSchedSubject(additionalSchedsOfRank.subject || 0);
		setSchedDuration(additionalSchedsOfRank.duration || 0);
		setSchedFrequency(additionalSchedsOfRank.frequency || '');
		setSchedShown(additionalSchedsOfRank.shown || false);
		setSchedTime(additionalSchedsOfRank.time || 0);
	}, [additionalSchedsOfRank]);

	// useEffect(() => {
	//     console.log('schedName', schedName);
	//     console.log('schedSubject', schedSubject);
	//     console.log('typeof schedSubject', typeof schedSubject);
	//     console.log('schedDuration', schedDuration);
	//     console.log('schedFrequency', schedFrequency);
	//     console.log('schedShown', schedShown);
	// }, [schedName, schedSubject, schedDuration, schedFrequency, schedShown]);

	return (
		<dialog
			id={`add_additional_sched_modal_${viewingMode}_tr-${rankID}_idx-${arrayIndex}`}
			className="modal modal-bottom sm:modal-middle"
		>
			<div className="modal-box">
				<div>
					<div className="mb-3 text-center text-lg font-bold">
						{viewingMode === 1 ? (
							<div>View Mode</div>
						) : (
							<div>Edit Mode</div>
						)}
					</div>

					{/* Schedule Name */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1">
							Schedule Name:
						</label>
						<input
							type="text"
							// ref={inputNameRef}
							className="input input-bordered w-full"
							value={schedName}
							onChange={(e) => setSchedName(e.target.value)}
							placeholder="Enter schedule name"
							// disabled={viewingMode !== 0}
							readOnly={viewingMode !== 0}
						/>
					</div>

					{/* Schedule Subject */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1">
							Subject:
						</label>
						<input
							type="text"
							className="input input-bordered w-full"
							value='N/A'
							placeholder="Enter schedule name"
							readOnly
						/>
					</div>

					{/* Schedule Duration */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1">
							Duration (in minutes):
						</label>
						<input
							type="number"
							className="input input-bordered w-full"
							value={schedDuration}
							onChange={(e) =>
								setSchedDuration(Number(e.target.value))
							}
							placeholder="Enter duration"
							// disabled={viewingMode !== 0}
							readOnly={viewingMode !== 0}
						/>
					</div>

					{/* Schedule Frequency */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1">
							Frequency:
						</label>
						<input
							type="number"
							className="input input-bordered w-full"
							value={schedFrequency}
							onChange={(e) =>
								setSchedFrequency(Number(e.target.value))
							}
							placeholder="Enter frequency"
							min={1}
							max={numOfSchoolDays}
							// disabled={viewingMode !== 0}
							readOnly={viewingMode !== 0}
						/>
					</div>

					{/* Must Appear on Schedule */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1">
							Must Appear on Schedule:
						</label>
						<select
							className={clsx('input input-bordered w-full', {
								'pointer-events-none': viewingMode !== 0,
								select: viewingMode === 0,
							})}
							value={schedShown ? 'Yes' : 'No'}
							onChange={(e) =>
								setSchedShown(e.target.value === 'Yes')
							}
							// disabled={viewingMode !== 0}
							readOnly={viewingMode !== 0}
						>
							<option value="Yes">Yes</option>
							<option value="No">No</option>
						</select>
					</div>

					{/* Time */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1">
							Time:
						</label>
						{viewingMode === 0 ? (
							<TimeSelector 
								className='z-10'

								key={`newRankTimePicker-rank{${rankID}}-arrayIndex${arrayIndex}`}
								interval={5}
								time={time}
								setTime={setTime}
							/>
						) : (
							<div className="flex items-center justify-start input border rounded h-12 bg-white border border-gray-300 text-base">
								{time
									? time
									: '--:--- --'}
							</div>
						)}
					</div>		

					<div className="mt-4 text-center text-lg font-bold">
						{viewingMode !== 1 && (
							<div className="flex flex-wrap gap-2 justify-center">
								<button
									className="btn btn-sm rounded-lg bg-green-600 text-white hover:bg-green-500"
									onClick={handleSave}
								>
									Save
								</button>
								<button
									className="btn btn-sm rounded-lg bg-red-600 text-white hover:bg-red-500"
									onClick={handleClose}
								>
									Cancel
								</button>
							</div>
						)}
					</div>
				</div>

				<div className="modal-action w-full mt-0">
					<button
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
						onClick={handleClose}
					>
						✕
					</button>
				</div>
			</div>
		</dialog>
	);
};

const AddTeacherRankContainer = ({
	close,
	reduxFunction,
	errorMessage,
	setErrorMessage,
	errorField,
	setErrorField,
	numOfSchoolDays,
}) => {
  	const inputNameRef = useRef();

	const { ranks, status: rankStatus } = useSelector(
		(state) => state.rank
	)
	const { subjects, status: subjectStatus } = useSelector(
		(state) => state.subject
	);

	const dispatch = useDispatch();

	const [rankValue, setRankValue] = useState('');
	const [additionalRankScheds, setAdditionalRankScheds] = useState([]);

	const handleAddRank = () => {

		if (!rankValue.trim()) {
			setErrorMessage('All fields are required.');
			if (rankValue === ""){
				setErrorField('rank');
			} else {
				setErrorField('load');
			}
			return;
		}

		const duplicateRank = Object.values(ranks).find(
			(r) => r.rank.trim().toLowerCase() === rankValue.trim().toLowerCase()
		);

		if (duplicateRank) {
			setErrorMessage('Rank already exists.');
			setErrorField('rank');
			return;
		} else {
			dispatch(
				reduxFunction({
					rank: rankValue,
					additionalRankScheds: additionalRankScheds,
				})
			);
		}

		toast.success('Rank added successfully', {
			style: { backgroundColor: 'green', color: 'white', bordercolor: 'green', },
		});

		handleReset();
		close();

		if (inputNameRef.current) {
			inputNameRef.current.focus();
			inputNameRef.current.select();
		}

	};

	const handleAddTeacherAdditionalSchedules = () => {
		setAdditionalRankScheds((prevScheds) => [
			...prevScheds,
			{
				name: '',
				subject: 0,
				duration: 60,
				frequency: 1,
				shown: true,
				time: 72,
			},
		]);
	};
	
	const handleDeleteTeacherAdditionalSchedule = (index) => {
		setAdditionalRankScheds((prevScheds) =>
			prevScheds.filter((_, i) => i !== index)
		);
	};
	
	const handleReset = () => {
		setErrorField('');
		setErrorMessage('');
		setRankValue('');
	};

	// useEffect(() => {
	// 	console.log('additionalRankScheds', additionalRankScheds);
	// }, [additionalRankScheds]);

	useEffect(() => {
		if (rankStatus === 'idle') {
			dispatch(fetchRanks());
		}
	}, [rankStatus, dispatch]);

	useEffect(() => {
		if (subjectStatus === 'idle') {
			dispatch(fetchSubjects());
		}
	}, [subjectStatus, dispatch]);

	useEffect(() => {
		if (inputNameRef.current) {
			inputNameRef.current.focus();
		}
	}, []);

	return (
		<div className="justify-left">
			<div className="flex justify-center mb-4">
			<h3 className="text-xl font-bold">Add New Rank</h3>
			</div>

			{/* Rank Name */}
			<div className="mb-4">
				<label className="block text-sm font-medium mb-1" htmlFor="rankName">Rank Name:</label>
				<input
					id="rankName"
					type="text"
					className={`input input-bordered w-full ${errorField === 'rank' ? 'border-red-500' : ''
					}`}
					value={rankValue}
					onChange={(e) => setRankValue(e.target.value)}
					placeholder="Enter rank name"
					aria-label="Rank Name"
					ref={inputNameRef} 
				/>
			</div>

			<div className="flex flex-col items-center justify-center p-1 rounded-lg">
				<div className='w-2/3 p-1 block text-sm font-medium'>
					Additional Teacher Schedules 
					<b> (Optional) </b>
					:
				</div>

				<div className='mt-2 w-2/3 h-auto flex justify-end items-center border border-gray-300 rounded-t-lg'>
					{/* Button to add schedules */}
					<button
						onClick={handleAddTeacherAdditionalSchedules}
						className="font-bold items-right text-xs m-1 bg-blue-900 text-white px-2 py-1 rounded-lg hover:bg-blue-600"
					>
						+ Add Schedule
					</button>
				</div>

				<div
					className="overflow-y-auto w-2/3 min-h-5 max-h-36 border border-gray-300 rounded-b-lg"
					style={{
						scrollbarWidth: 'thin',
						scrollbarColor:
							'#a0aec0 #edf2f7',
					}} // Optional for styled scrollbars
				>
					{additionalRankScheds.map(
						(sched, index) => (
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
										onClick={() =>
											document
												.getElementById(
													`add_additional_sched_modal_1_tr-0_idx-${index}`
												)
												.showModal()
										}
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
									<AdditionalScheduleForTeacherRank
										viewingMode={1}
										rankID={0}
										arrayIndex={index}
										additionalSchedsOfRank={sched}
									/>
								</div>
								<div className="w-1/12  flex items-center justify-center border rounded-r-lg hover:bg-gray-200">
									<button
										onClick={() =>
											document
												.getElementById(
													`add_additional_sched_modal_0_tr-0_idx-${index}`
												)
												.showModal()
										}
									>
										<RiEdit2Fill
											size={15}
										/>
									</button>
									<AdditionalScheduleForTeacherRank
										viewingMode={0}
										rankID={0}
										arrayIndex={index}
										numOfSchoolDays={numOfSchoolDays}
										additionalSchedsOfRank={sched}
										setAdditionalScheds={setAdditionalRankScheds}
									/>
								</div>
							</div>
						)
					)}
				</div>
			</div>

			{errorMessage && (
				<p className="text-red-500 text-sm my-4 font-medium select-none ">{errorMessage}</p>
			)}

			<div className="flex justify-center gap-4 mt-4">
				<button className="btn btn-secondary" onClick={handleReset}>
					Reset
				</button>
				<button className="btn btn-primary" onClick={handleAddRank}>
					Add Rank
				</button>
			</div>
		</div>
	);
};

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
	const handleEditRankClick = (rank) => {
		setEditRankId(rank.id);
		setEditRankValue(rank.rank);
		setEditAdditionalRankScheds(rank.additionalRankScheds);
	};

	const handleCancelRankEditClick = () => {
		setEditRankId(null);
		setEditRankValue('');
		setEditAdditionalRankScheds([]);
	};

// ===================================================================================================

	//  HANDLING ADDITION AND DELETION OF ADDITIONAL RANK SCHEDULES
	const handleAddAdditionalSchedule = () => {
		setEditAdditionalRankScheds((prevScheds) => [
			...prevScheds,
			{
				name: '',
				subject: 0,
				duration: 60,
				frequency: 1,
				shown: true,
				time: 72,
			},
		]);
	};

	const handleDeleteAdditionalSchedule = (index) => {
		setEditAdditionalRankScheds((prevScheds) =>
			prevScheds.filter((_, i) => i !== index)
		);
	};

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
						time: updatedSched.time || existingSched.time,
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

	const deleteModal = (id) => {
		const deleteModalElement = document.getElementById("delete_modal");
		deleteModalElement.showModal();  

		const deleteButton = document.getElementById("delete_button");
		deleteButton.onclick = () => handleDelete(id);  
	};

	const handleDelete = (id) => {
		dispatch(removeRank(id));  
		document.getElementById("delete_modal").close(); 
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
									{editRankId === rank.id ? (
										<input
											type="text"
											className="input input-bordered input-sm w-full"
											value={editRankValue}
											onChange={(e) => setEditRankValue(e.target.value)}
										/>
									) : (
										rank.rank
									)}
								</td>
								<td>
									{editRankId === rank.id ? (
										<>
											<div
												key={`edit-add-sched-edit-tr(${editRankId})`}
												className="mt-2 overflow-y-auto h-36 max-h-36 border border-gray-300 bg-white rounded-lg"
												style={{
													scrollbarWidth:
														'thin',
													scrollbarColor:
														'#a0aec0 #edf2f7',
												}} // Optional for styled scrollbars
											>
												<div
													className="flex flex-wrap"
													style={{
														position: 'sticky',
														top: 0,
														zIndex: 1,
														backgroundColor:'white',
													}}
												>
													<div className="w-3/12 flex justify-center items-center border-b border-gray-300">
														<button
															className="w-3/4 bg-green-700 m-2 font-bold text-white rounded-lg hover:bg-green-500"
															onClick={handleAddAdditionalSchedule}
														>
															+
														</button>
													</div>
												</div>
												{editAdditionalRankScheds.map((sched, index) => 
													(
														<div
															key={index}
															className="flex flex-wrap"
														>
															<button
																className="w-1/12 border rounded-l-lg bg-blue-200 hover:bg-blue-100 flex items-center justify-center"
																onClick={() => handleDeleteAdditionalSchedule(index)}
															>
																<RiDeleteBin7Line
																	size={15}
																/>
															</button>
															<div className="w-10/12">
																<button
																	className="w-full text-xs bg-gray-100 p-2 border shadow-sm hover:bg-gray-200"
																	onClick={() =>
																		document.getElementById(`add_additional_sched_modal_1_tr-${editRankId}_idx-${index}`).showModal()
																	}
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
																						: subjects[sched.subject].subject}
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
																	rankID={editRankId}
																	arrayIndex={index}
																	additionalSchedsOfRank={sched}
																/>
															</div>
															<div className="w-1/12 text-xs font-bold rounded-r-lg bg-blue-200 hover:bg-blue-100 flex text-center justify-center items-center p-2 cursor-pointer">
																<button
																	onClick={() =>
																		document.getElementById(`add_additional_sched_modal_0_tr-${editRankId}_idx-${index}`).showModal()
																	}
																>
																	<RiEdit2Fill
																		size={15}
																	/>
																</button>
																<AdditionalScheduleForTeacherRank
																	viewingMode={0}
																	rankID={editRankId}
																	arrayIndex={index}
																	numOfSchoolDays={numOfSchoolDays}
																	additionalSchedsOfRank={sched}
																	setAdditionalScheds={setEditAdditionalRankScheds}
																/>
															</div>
														</div>
													)
												)}
											</div>
										</>
									) : (
										<>
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
																				{sched.subject === 0
																					? 'N/A'
																					: subjects[sched.subject].subject
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
										</>
									)}
								</td>

								{editable && 
									(
										<td className="w-28 text-right">
											{editRankId === rank.id ? (
												<>
													<button
														className="btn btn-xs btn-ghost text-green-500"
														onClick={() => document.getElementById(`confirm_rank_edit_modal`).showModal()}
													>
														Save
													</button>
													<button
														className="btn btn-xs btn-ghost text-red-500"
														onClick={() => handleCancelRankEditClick()}
													>
														Cancel
													</button>
												</>
												) : (
												<>
													<button
														className="btn btn-xs btn-ghost text-blue-500"
														onClick={() => handleEditRankClick(rank)}
													>
														<RiEdit2Fill size={20} />
													</button>
													<button
														className="btn btn-xs btn-ghost text-red-500"
														onClick={() => deleteModal(rank.id)}
													>
														<RiDeleteBin7Line size={20} />
													</button>

													<dialog id="delete_modal" className="modal modal-bottom sm:modal-middle">
														<form method="dialog" className="modal-box">
															{/* Icon and message */}
															<div className="flex flex-col items-center justify-center">
																<TrashIcon 
																	className="text-red-500 mb-4" 
																	width={40} 
																	height={40} 
																/>
																<h3 className="font-bold text-lg text-center">
																	Are you sure you want to delete this item?
																</h3>
																<p className="text-sm text-gray-500 text-center">
																	This action cannot be undone.
																</p>
															</div>

															{/* Modal actions */}
															<div className="modal-action flex justify-center">
															{/* Close Button */}
															<button
																className="btn btn-sm btn-ghost"
																onClick={() => document.getElementById("delete_modal").close()}
																aria-label="Cancel deletion"
															>
																Cancel
															</button>

															{/* Confirm Delete Button */}
															<button
																className="btn btn-sm btn-error text-white"
																id="delete_button"
															>
																Delete
															</button>
															</div>
														</form>
													</dialog>
												</>
											)}
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
