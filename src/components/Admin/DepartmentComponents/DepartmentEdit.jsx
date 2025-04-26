import { useState, useEffect, useRef } from 'react';

import { toast } from 'sonner';
import { RiEdit2Fill } from 'react-icons/ri';

import { useEditDocument } from '../../../hooks/firebaseCRUD/useEditDocument';
import { COLLECTION_ABBREVIATION } from '../../../constants';
import { useSelector } from 'react-redux';
import LoadingButton from '../../LoadingButton';
import { ImInfo } from 'react-icons/im';

const DepartmentEdit = ({ departments, teachers, department, setErrorMessage, errorMessage, setErrorField }) => {
    const { editDocument, loading: isEditLoading, error: editError } = useEditDocument();
    const inputNameRef = useRef(null);
    const { user: currentUser } = useSelector((state) => state.user);

    const [editDepartmentValue, setEditDepartmentValue] = useState(department.name || '');
    const [selectedTeacher, setSelectedTeacher] = useState(department.head || null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSaveDepartmentEditClick = async () => {
        if (!editDepartmentValue.trim() || !selectedTeacher) {
            setErrorMessage('Please fill out all fields.');
            setErrorField(['name', 'head']);

            return;
        }

        const duplicateDepartment = Object.values(departments).find(
            (dep) => dep.name.trim().toLowerCase() === editDepartmentValue.trim().toLowerCase() && dep.id !== department.id
        );

        if (duplicateDepartment) {
            toast.error('A department with this name already exists.', {
                style: { backgroundColor: 'red', color: 'white' },
            });

            return;
        }

        try {
            await editDocument({
                collectionName: 'departments',
                collectionAbbreviation: COLLECTION_ABBREVIATION.DEPARTMENTS,
                userName: currentUser?.username || 'unknown user',
                itemName: department?.name || 'an item',
                docId: department.id,
                entryData: {
                    n: editDepartmentValue.trim(),
                    h: selectedTeacher,
                },
            });
        } catch {
            toast.error('Something went wrong. Please try again.');
            console.error('Something went wrong. Please try again.');
        } finally {
            toast.success('Data and dependencies updated successfully!', {
                style: {
                    backgroundColor: '#28a745',
                    color: '#fff',
                    borderColor: '#28a745',
                },
            });

            handleResetDepartmentEditClick();
            closeModal();
        }
    };

    const handleResetDepartmentEditClick = () => {
        setEditDepartmentValue(department.name || '');
        setSelectedTeacher(department.head || null);
        setSearchTerm('');
    };

    const handleTeacherClick = (teacherId) => {
        setSelectedTeacher(teacherId);
    };

    useEffect(() => {
        setEditDepartmentValue(department.name || '');
        setSelectedTeacher(department.head || null);
    }, [department]);

    const closeModal = () => {
        const modalCheckbox = document.getElementById(`edit_modal_${department.id}`);
        if (modalCheckbox) {
            modalCheckbox.checked = false;
        }
        handleResetDepartmentEditClick();
    };

    return (
        <div className='flex items-center justify-center'>
            {/* Trigger Button */}
            <label htmlFor={`edit_modal_${department.id}`} className='btn btn-xs btn-ghost text-blue-500'>
                <RiEdit2Fill size={20} />
            </label>

            {/* Modal */}
            <input type='checkbox' id={`edit_modal_${department.id}`} className='modal-toggle' />

            <div className='modal'>
                <div className='modal-box relative'>
                    <label htmlFor={`edit_modal_${department.id}`} className='btn btn-sm btn-circle absolute right-2 top-2'>
                        ✕
                    </label>
                    <h3 className='flex justify-center text-lg font-bold mb-4'>Edit Department</h3>

                    <hr className='mb-4' />

                    <div className='mb-4'>
                        <label className='block text-sm font-medium mb-2'>Department Name:</label>
                        <input
                            type='text'
                            className='input input-bordered w-full'
                            value={editDepartmentValue}
                            onChange={(e) => setEditDepartmentValue(e.target.value)}
                            placeholder='Enter department name'
                            ref={inputNameRef}
                        />
                    </div>

                    <div className='mb-4'>
                        {/* Selected Teacher Section */}
                        <div className='flex space-x-4 mb-4'>
                            <label className='block text-sm font-medium mb-2'>Selected Teacher:</label>
                            <div className='flex flex-wrap gap-2'>
                                {selectedTeacher || department.head ? (
                                    <div className='badge badge-primary cursor-pointer flex items-center gap-2'>
                                        {teachers[selectedTeacher || department.head]?.teacher || 'N/A'}
                                    </div>
                                ) : (
                                    <span className='text-gray-500'>No teacher selected</span>
                                )}
                            </div>
                        </div>

                        <label className='text-sm font-medium flex'>
                            <div>Search and Select Teacher:</div>
                            <div
                                className='lg:tooltip ml-2'
                                data-tip='To assign teacher to this department, refer to the teacher list under "Modify Teachers" tab'
                            >
                                <ImInfo size={20} className='text-blue-500'/>
                            </div>
                        </label>
                        <div className='card bg-base-100 shadow-lg p-4'>
                            {/* Search Bar */}
                            <input
                                type='text'
                                className='input input-bordered w-full mb-2'
                                placeholder='Search for a teacher'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <ul className='flex flex-col bg-base-100 rounded-lg max-h-[8rem] overflow-y-auto border border-base-content border-opacity-20 w-full space-y-1'>
                                {Object.keys(teachers)
                                    .filter(
                                        (key) =>
                                            teachers[key].department === department.id &&
                                            teachers[key].teacher.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((key) => (
                                        <li
                                            key={teachers[key].id}
                                            className='border-b last:border-b-0 border-base-content border-opacity-20'
                                        >
                                            <button
                                                className='w-full text-left py-2 px-4 hover:bg-base-300'
                                                onClick={() => handleTeacherClick(teachers[key].id)}
                                            >
                                                {teachers[key].teacher}
                                            </button>
                                        </li>
                                    ))}
                                {Object.keys(teachers).filter(
                                    (key) =>
                                        teachers[key].department === department.id &&
                                        teachers[key].teacher.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && (
                                    <li className='text-gray-500 text-center py-2'>
                                        No teachers found under this department yet.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {errorMessage && <p className='flex justify-center text-red-500 text-sm my-4 font-medium'>{errorMessage}</p>}

                    <div className='flex justify-center gap-2 mt-4'>
                        <LoadingButton
                            onClick={handleSaveDepartmentEditClick}
                            disabled={isEditLoading}
                            isLoading={isEditLoading}
                            loadingText='Updating Department...'
                            className='btn btn-primary'
                        >
                            Update Department
                        </LoadingButton>

                        <button className='btn btn-error ' onClick={handleResetDepartmentEditClick}>
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentEdit;
