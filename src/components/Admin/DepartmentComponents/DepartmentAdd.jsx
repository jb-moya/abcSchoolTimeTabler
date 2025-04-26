import { useState, useEffect, useRef } from 'react';

import { toast } from 'sonner';

import { useAddDocument } from '../../../hooks/firebaseCRUD/useAddDocument';
import { useSelector } from 'react-redux';
import { COLLECTION_ABBREVIATION } from '../../../constants';
import LoadingButton from '../../LoadingButton';

const AddDepartmentContainer = ({
    // STORES
    departments,
    // STORES
    close,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    // reduxFunction,
}) => {
    const inputNameRef = useRef();

    const { addDocument, loading: isAddLoading, error: addError } = useAddDocument();

    const { user: currentUser } = useSelector((state) => state.user);

    // ===================================================================================

    const [departmentName, setDepartmentName] = useState('');
    const [selectedHead, setSelectedHead] = useState('');

    // ===================================================================================

    const handleAddDepartment = async () => {
        if (!departmentName.trim()) {
            setErrorMessage('Both department name required.');
            if (!departmentName.trim()) {
                setErrorField('name');
            }
            return;
        }

        const duplicateDepartment = Object.values(departments).find(
            (department) => department.name.trim().toLowerCase() === departmentName.trim().toLowerCase()
        );

        if (duplicateDepartment) {
            setErrorMessage('A department with this name already exists.');
            setErrorField('name');
            return;
        }

        try {
            await addDocument({
                collectionName: 'departments',
                collectionAbbreviation: COLLECTION_ABBREVIATION.DEPARTMENTS,
                userName: currentUser?.username || 'unknown user',
                itemName: departmentName || 'an item',
                entryData: {
                    n: departmentName.trim(),
                    h: selectedHead.trim(),
                },
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
                <h3 className='text-lg font-bold mb-4'>Add New Department</h3>
            </div>

            <hr className='mb-4' />

            <div className='mb-4'>
                <label className='block text-sm font-medium mb-2'>Department Name:</label>
                <input
                    type='text'
                    className={`input input-bordered w-full ${errorField === 'name' ? 'border-red-500' : ''}`}
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder='Enter department name'
                    ref={inputNameRef}
                />
            </div>

            {errorMessage && <p className='text-red-500 text-sm my-4 font-medium select-none '>{errorMessage}</p>}

            <div className='flex justify-center gap-2'>
                <div className='flex justify-end space-x-2'>
                    <LoadingButton
                        onClick={handleAddDepartment}
                        isLoading={isAddLoading}
                        loadingText='Adding Department'
                        disabled={isAddLoading}
                        className='btn btn-primary'
                    >
                        Add Department
                    </LoadingButton>

                    <button className='btn btn-error border-0' onClick={handleReset}>
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddDepartmentContainer;
