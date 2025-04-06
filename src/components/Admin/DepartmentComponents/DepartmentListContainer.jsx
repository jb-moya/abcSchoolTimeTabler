import { useState, useEffect, useCallback} from 'react';
import debounce from 'debounce';

import { IoAdd, IoSearch } from 'react-icons/io5';

import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

import AddDepartmentContainer from './DepartmentAdd';
import DeleteData from '../DeleteData';
import DepartmentEdit from './DepartmentEdit';

const DepartmentListContainer = ({ 
	departments,
	teachers,
	editable = false 
}) => {

// ====================================================================

	const [errorMessage, setErrorMessage] = useState('');
	const [errorField, setErrorField] = useState('');

	const [searchDepartmentValue, setSearchDepartmentValue] = useState('');
	const [searchDepartmentResult, setSearchDepartmentResult] = useState(departments);
	// const [searchTerm, setSearchTerm] = useState('');

	const handleClose = () => {
		const modal = document.getElementById('add_department_modal');
		if (modal) {
			modal.close();
			setErrorMessage('');
			setErrorField('');
		} else {
			console.error("Modal with ID 'add_department_modal' not found.");
		}
	};

	const debouncedSearch = useCallback(
		debounce((searchValue, departments) => {	
		setSearchDepartmentResult(
			filterObject(departments, ([, department]) => {
			const escapedSearchValue = escapeRegExp(searchValue)
				.split('\\*')
				.join('.*');

			const pattern = new RegExp(escapedSearchValue, 'i');

			return pattern.test(department.name);
			})
		);
		}, 200),
		[]
	);

	useEffect(() => {
		debouncedSearch(searchDepartmentValue, departments);
	}, [searchDepartmentValue, departments, debouncedSearch]);

	const itemsPerPage = 10;
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = Math.ceil(Object.values(searchDepartmentResult).length / itemsPerPage);
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = Object.entries(searchDepartmentResult).slice(
		indexOfFirstItem,
		indexOfLastItem
	);

	return (
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
								handleCancelDepartmentEditClick();
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
								handleCancelDepartmentEditClick();
							}}
							disabled={currentPage === totalPages}
						>
							»
						</button>
					</div>
				)}

				{/* Remove Pagination if No Items */}
				{currentItems.length === 0 && currentPage > 1 && (
					<div className="hidden">
						{setCurrentPage(currentPage - 1)}
					</div>
				)}

				{/* Search Department */}
				<div className="flex-grow w-full md:w-1/3 lg:w-1/4">
					<label className="input input-bordered flex items-center gap-2 w-full">
						<input
							type="text"
							className="grow p-3 text-sm w-full"
							placeholder="Search Department"
							value={searchDepartmentValue}
							onChange={(e) => setSearchDepartmentValue(e.target.value)}
						/>
						<IoSearch className="text-xl" />
					</label>
				</div>

				{/* Add Department Button (only when editable) */}
				{editable && (
					<div className="w-full mt-4 md:mt-0 md:w-auto">
						<button
							className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
							onClick={() => document.getElementById('add_department_modal').showModal()}
						>
							Add Department <IoAdd size={20} className="ml-2" />
						</button>

						{/* Modal for adding department */}
						<dialog id="add_department_modal" className="modal modal-bottom sm:modal-middle">
							<div className="modal-box">
								<AddDepartmentContainer
									departments={departments}
									close={() => document.getElementById('add_department_modal').close()}
									errorMessage={errorMessage}
									setErrorMessage={setErrorMessage}
									errorField={errorField}
									setErrorField={setErrorField}
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

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="table table-sm table-zebra md:table-md w-full">
					<thead>
						<tr>
						<th className="w-8">#</th>
						<th>ID</th>
						<th>Department Name</th>
						<th>Department Head</th>
						{editable && <th className="text-right">Actions</th>}
						</tr>
					</thead>
					<tbody>
						{currentItems.length === 0 ? (
							<tr>
								<td colSpan="5" className="text-center">
								No departments found.
								</td>
							</tr>
						) : (
							currentItems.map(([, department], index) => (
								<tr key={department.id} className="group hover">

									{/* Department Number */}
									<td>{index + 1}</td>

									{/* Department ID */}
									<td>{department.id}</td>

									{/* Department Name */}
									<td>{department.name}</td>

									{/* Department Head */}
									<td className="flex gap-1 flex-wrap">
										{teachers[department.head]?.teacher || 'N/A'}
									</td>

									{editable && (
										<td className="w-28">
											<div className="flex">
												<DepartmentEdit
													className="btn btn-xs btn-ghost text-blue-500"
													departments={departments}
													teachers={teachers}
													department={department}  // Pass the entire department object
													errorMessage={errorMessage}
													setErrorMessage={setErrorMessage}
													errorField={errorField}
													setErrorField={setErrorField}
												/> 
												
												<DeleteData
													className='btn btn-xs btn-ghost text-red-500' 
													collection={'departments'}
													id={department.id}
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

	);
};

export default DepartmentListContainer;
