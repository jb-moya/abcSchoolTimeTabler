import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { toast } from "sonner";

import { subscribeToDepartments } from '@features/slice/department_slice';

import { addDocument } from '../../../hooks/CRUD/addDocument';

const AddDepartmentContainer = ({
    close,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    // reduxFunction,
  }) => {

    const inputNameRef = useRef();
    const dispatch = useDispatch();

// ===================================================================================

	// const { documents: departments, loading1, error1 } = fetchDocuments('departments');
	const { data: departments, loading1, error1 } = useSelector((state) => state.departments);

	useEffect(() => {
		dispatch(subscribeToDepartments());
	}, [dispatch]);

// ===================================================================================
  
    const [departmentName, setDepartmentName] = useState('');
    const [selectedHead, setSelectedHead] = useState('');

// ===================================================================================
  
	const handleAddDepartment = () => {

		if (!departmentName.trim()) {
			setErrorMessage('Both department name required.');
			if (!departmentName.trim()) {
				setErrorField('name');
			}
				return;
		}

		const duplicateDepartment = Object.values(departments).find(
			(department) =>
				department.name.trim().toLowerCase() === departmentName.trim().toLowerCase()
		);

		if (duplicateDepartment) {
			setErrorMessage('A department with this name already exists.');
			setErrorField('name');
			return;
		}

		try {

			addDocument('departments', {
				name: departmentName.trim(),
          		head: selectedHead.trim(),
			});

		} catch (error) {

			console.error('Error adding department:', error);

		} finally {

			toast.success('Department added successfully', {
				style: {
					backgroundColor: 'green',
					color: 'white',
					bordercolor: 'green',
				},
			});

			handleReset();
			close();
		}

    //   dispatch(
    //     reduxFunction({
    //       name: departmentName.trim(),
    //       head: selectedHead.trim(),
    //     })
    //   ).then((action) => {
    //     if (action.meta.requestStatus === 'fulfilled') {
    //       toast.success('Department added successfully', {
    //         style: { backgroundColor: 'green', color: 'white', borderColor: 'green' },
    //       });
    //       handleReset();
    //       close();
    //       if (inputNameRef.current) {
    //         inputNameRef.current.focus();
    //       }
    //     } else {
    //       toast.error('Failed to add department.');
    //     }
    //   });
    
	};
  
    const handleReset = () => {
      setErrorField('');
      setErrorMessage('');
      setDepartmentName('');
      setSelectedHead('');
    };

// ===================================================================================
  
    useEffect(() => {
      if (inputNameRef.current) {
        inputNameRef.current.focus();
      }
    }, []);

	// useEffect(() => {
	// if (teacherStatus === 'idle') {
	// 	dispatch(fetchTeachers());
	// }
	// }, [teacherStatus, dispatch]);

	return (
		<div>
			<div>
				<h3 className="text-lg font-bold mb-4">Add New Department</h3>
			</div>

			<hr className="mb-4" />

			<div className="mb-4">
				<label className="block text-sm font-medium mb-2">Department Name:</label>
				<input
					type="text"
					className={`input input-bordered w-full ${errorField === 'name' ? 'border-red-500' : ''
						}`}
					value={departmentName}
					onChange={(e) => setDepartmentName(e.target.value)}
					placeholder="Enter department name"
					ref={inputNameRef}
				/>
			</div>

			{errorMessage && (
				<p className="text-red-500 text-sm my-4 font-medium select-none ">{errorMessage}</p>
			)}

			<div className="flex justify-center gap-2">
				<div className="flex justify-end space-x-2">
					<button className="btn btn-primary" onClick={handleAddDepartment}>
						Add Department
					</button>
					<button className="btn btn-error border-0" onClick={handleReset}>
						Reset
					</button>
				</div>
			</div>
		</div>
	);
  };
  
  export default AddDepartmentContainer;