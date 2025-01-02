import  { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from 'sonner';
import { RiEdit2Fill } from "react-icons/ri";

import { fetchDepartments } from "@features/departmentSlice";
import { fetchTeachers } from "@features/teacherSlice";

const DepartmentEdit = ({
  department,
  reduxFunction,
  setErrorMessage,
  errorMessage,
  errorField,
  setErrorField,
}) => {

	const inputNameRef = useRef(null);
	const dispatch = useDispatch();

// ==========================================================================

	const { departments, status: departmentStatus } = useSelector(
		(state) => state.department
	);

	const { teachers, status: teacherStatus } = useSelector(
		(state) => state.teacher
	);
	

// ==========================================================================

	const [editDepartmentValue, setEditDepartmentValue] = useState(department.name || "");
	const [selectedTeacher, setSelectedTeacher] = useState(department.head || null);
	const [searchTerm, setSearchTerm] = useState("");

// ==========================================================================
	
	const handleSaveDepartmentEditClick = () => {

		if (!editDepartmentValue.trim() || !selectedTeacher) {

			setErrorMessage("Please fill out all fields.");
			setErrorField(["name", "head"]);

			return;

		}

		const duplicateDepartment = Object.values(departments).find(
			(dep) => dep.name.trim().toLowerCase() === editDepartmentValue.trim().toLowerCase() 
					&& dep.id !== department.id
		);

		if (duplicateDepartment) {

			toast.error("A department with this name already exists.", {
				style: { backgroundColor: "red", color: "white" },
			});

			return;

		}

		dispatch (

			reduxFunction({
				departmentId: department.id,
				updatedDepartment: {
				name: editDepartmentValue.trim(),
				head: selectedTeacher
				},
			})
			
		).then((action) => {
			if (action.meta.requestStatus === "fulfilled") {

				toast.success("Department updated successfully!", {
					style: { backgroundColor: "#28a745", color: "#fff" },
				});

				handleResetDepartmentEditClick(); // Reset input fields
				closeModal(); // Close modal	

			} else {

				toast.error("Failed to update department.");

			}
		});
	};

	const handleResetDepartmentEditClick = () => {
		setEditDepartmentValue(department.name || "");
		setSelectedTeacher(department.head || null); // Reset selected teacher
		setSearchTerm("");
	};

	const handleTeacherClick = (teacherId) => {
		setSelectedTeacher(teacherId); // Only one teacher can be selected
	};

// ==========================================================================

	useEffect(() => {
		if (teacherStatus === "idle") {
			dispatch(fetchTeachers());
		}
		if (departmentStatus === "idle") {
			dispatch(fetchDepartments());
		}
	}, [teacherStatus, departmentStatus, dispatch]);

	useEffect(() => {
		setEditDepartmentValue(department.name || "");
		setSelectedTeacher(department.head || null);
	}, [department]);
	

// ==========================================================================

	const closeModal = () => {
		const modalCheckbox = document.getElementById(`edit_modal_${department.id}`);
		if (modalCheckbox) {
			modalCheckbox.checked = false; // Uncheck the modal toggle
		}
		handleResetDepartmentEditClick();
	};

	return (
		<div className="flex items-center justify-center">
			{/* Trigger Button */}
			<label
				htmlFor={`edit_modal_${department.id}`}
				className="btn btn-xs btn-ghost text-blue-500"
			>
				<RiEdit2Fill size={20} />
			</label>

			{/* Modal */}
			<input type="checkbox" id={`edit_modal_${department.id}`} className="modal-toggle" />

			<div className="modal">
				<div className="modal-box relative">
					<label
						htmlFor={`edit_modal_${department.id}`}
						className="btn btn-sm btn-circle absolute right-2 top-2"
					>
						✕
					</label>
					<h3 className="flex justify-center text-lg font-bold mb-4">Edit Department</h3>

					<hr className="mb-4" />

					<div className="mb-4">
						<label className="block text-sm font-medium mb-2">
							Department Name:
						</label>
						<input
							type="text"
							className="input input-bordered w-full"
							value={editDepartmentValue}
							onChange={(e) => setEditDepartmentValue(e.target.value)}
							placeholder="Enter department name"
							ref={inputNameRef}
						/>
					</div>

					<div className="mb-4">
					{/* Selected Teacher Section */}
						<div className="flex space-x-4 mb-4">
							<label className="block text-sm font-medium mb-2">Selected Teacher:</label>
							<div className="flex flex-wrap gap-2">
								{selectedTeacher || department.head ? (
									<div className="badge badge-primary cursor-pointer flex items-center gap-2">
										{/* Display Teacher's Name */}
										{teachers[selectedTeacher || department.head]?.teacher || "N/A"}

										{/* Close Button (x) */}
										{/* <span
										className="text-red-500 font-bold cursor-pointer"
										onClick={(e) => {
											e.stopPropagation(); // Prevent event from propagating to parent div
											setSelectedTeacher(null); // Set selectedTeacher to null
										}}
										>
										x
										</span> */}
									</div>
									) : (
									<span className="text-gray-500">No teacher selected</span>
								)}
							</div>
						</div>

						<label className="block text-sm font-medium mb-2">Search and Select Teacher:</label>
						<div className="card bg-base-100 shadow-lg p-4">
							{/* Search Bar */}
							<input
								type="text"
								className="input input-bordered w-full mb-2"
								placeholder="Search for a teacher"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>

							{/* Filtered Teacher List */}
							<ul
								className="flex flex-col bg-base-100 rounded-box max-h-[8rem] overflow-y-auto border w-full space-y-1"
							>
								{Object.keys(teachers)
									.filter(
										(key) =>
										teachers[key].department === department.id &&
										teachers[key].teacher
											.toLowerCase()
											.includes(searchTerm.toLowerCase())
									)
									.map((key) => (
										<li key={teachers[key].id} className="border-b last:border-b-0">
										<button
											className="w-full text-left py-2 px-4 hover:bg-blue-100"
											onClick={() => handleTeacherClick(teachers[key].id)}
										>
											{teachers[key].teacher}
										</button>
										</li>
								))}
								{Object.keys(teachers).filter(
									(key) =>
										teachers[key].department === department.id &&
										teachers[key].teacher
										.toLowerCase()
										.includes(searchTerm.toLowerCase())
									).length === 0 && (
									<li className="text-gray-500 text-center py-2">No teachers found</li>
								)}
							</ul>

						</div>
					</div>

					{errorMessage && (
                        <p className="flex justify-center text-red-500 text-sm my-4 font-medium">{errorMessage}</p>
                    )}

					<div className="flex justify-center gap-2 mt-4">
						<button 
							className="btn btn-primary " 
							onClick={handleSaveDepartmentEditClick}
						>
							Update Department
						</button>
						<button 
							className="btn btn-error " 
							onClick={handleResetDepartmentEditClick}
						>
							Reset
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DepartmentEdit;
