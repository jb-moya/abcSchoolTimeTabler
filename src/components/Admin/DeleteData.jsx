import { useEffect } from 'react';

import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import { RiDeleteBin7Line } from 'react-icons/ri';

import { useDeleteDocument } from '../../hooks/firebaseCRUD/useDeleteDocument';
import { useEditDocument } from '../../hooks/firebaseCRUD/useEditDocument';
import { useSelector } from 'react-redux';

import { toast } from 'sonner';
import { COLLECTION_ABBREVIATION } from '../../constants';
import LoadingButton from '../LoadingButton';

const DeleteData = ({ id, collection, callback }) => {
    const { deleteDocument, loading: isDeleteLoading, error: deleteError } = useDeleteDocument();
    const { editDocument, loading: isEditLoading, error: editError } = useEditDocument();

    // ===============================================================================================
    const { user: currentUser } = useSelector((state) => state.user);

    const { subjects } = useSelector((state) => state.subjects);
    const { programs } = useSelector((state) => state.programs);
    const { sections } = useSelector((state) => state.sections);
    const { ranks } = useSelector((state) => state.ranks);
    const { teachers } = useSelector((state) => state.teachers);
    const { departments } = useSelector((state) => state.departments);
    // ===============================================================================================

    useEffect(() => {
        console.log('id:', id);
    }, [id]);

    console.log('id:', id);
    const handleDelete = async () => {
        try {
            let entry_id = null;

            if (collection === 'subjects') {
                const subject_id = subjects[id]?.id;

                const isInPrograms = Object.values(programs).some((program) =>
                    [7, 8, 9, 10].some((grade) =>
                        Object.values(program[grade]?.subjects || [])
                            .flat()
                            .includes(id)
                    )
                );

                const isInSections = Object.values(sections).some((section) => (section.subjects || []).includes(id));

                const isInTeachers = Object.values(teachers).some((teacher) => (teacher.subjects || []).includes(id));

                const dependencies = [
                    {
                        condition: isInPrograms && isInSections && isInTeachers,
                        message: 'Subject is used in programs, teachers, and sections. Cannot delete.',
                    },
                    {
                        condition: isInSections && isInPrograms,
                        message: 'Subject is used in sections and programs. Cannot delete.',
                    },
                    {
                        condition: isInPrograms && isInTeachers,
                        message: 'Subject is used in programs and teachers. Cannot delete.',
                    },
                    {
                        condition: isInSections && isInTeachers,
                        message: 'Subject is used in sections and teachers. Cannot delete.',
                    },
                    { condition: isInSections, message: 'Subject is used in sections. Cannot delete.' },
                    { condition: isInTeachers, message: 'Subject is used in teachers. Cannot delete.' },
                    { condition: isInPrograms, message: 'Subject is used in programs. Cannot delete.' },
                ];

                const dependency = dependencies.find((dep) => dep.condition);

                if (dependency) {
                    toast.error(dependency.message, {
                        style: {
                            backgroundColor: 'red',
                            color: 'white',
                            borderColor: 'red',
                        },
                    });
                    throw new Error(dependency.message);
                }

                entry_id = subject_id;
            } else if (collection === 'programs') {
                const program_id = programs[id]?.id;

                const isInSections = Object.values(sections).some((section) => section.program === id);

                if (isInSections) {
                    toast.error('Program is used in sections. Cannot delete.', {
                        style: {
                            backgroundColor: 'red',
                            color: 'white',
                            bordercolor: 'red',
                        },
                    });
                    throw new Error('Program is used in sections. Cannot delete.');
                } else {
                    entry_id = program_id;
                }
            } else if (collection === 'ranks') {
                const rank_id = ranks[id]?.id;

                const isInTeachers = Object.values(teachers).some((teacher) => teacher.rank === id);

                if (isInTeachers) {
                    toast.error('Rank is used in teachers. Cannot delete.', {
                        style: {
                            backgroundColor: 'red',
                            color: 'white',
                            bordercolor: 'red',
                        },
                    });
                    throw new Error('Rank is used in teachers. Cannot delete.');
                } else {
                    entry_id = rank_id;
                }
            } else if (collection === 'teachers') {
                const teacher_id = teachers[id]?.id;

                const isInSections = Object.values(sections).some((section) => section.teacher === id);

                if (isInSections) {
                    toast.error('Teacher is used in sections. Cannot delete.', {
                        style: {
                            backgroundColor: 'red',
                            color: 'white',
                            bordercolor: 'red',
                        },
                    });
                    throw new Error('Teacher is used in sections. Cannot delete.');
                } else {
                    entry_id = teacher_id;
                }
            } else if (collection === 'departments') {
                const department_id = departments[id]?.id;

                const isInTeachers = Object.values(teachers).some((teacher) => teacher.department === id);

                if (isInTeachers) {
                    toast.error('Department is used in teachers. Cannot delete.', {
                        style: {
                            backgroundColor: 'red',
                            color: 'white',
                            bordercolor: 'red',
                        },
                    });
                    throw new Error('Department is used in teachers. Cannot delete.');
                } else {
                    entry_id = department_id;
                }
            } else if (collection === 'sections') {
                const adviser_id = sections[id]?.teacher;
                const section_adviser = structuredClone(teachers[adviser_id]);

                if (section_adviser.additionalTeacherScheds) {
                    section_adviser.additionalTeacherScheds = section_adviser.additionalTeacherScheds.filter(
                        (sched) => sched.name !== 'Advisory Load'
                    );
                }

                await editDocument({
                    collectionName: 'teachers',
                    collectionAbbreviation: COLLECTION_ABBREVIATION.TEACHERS,
                    userName: currentUser?.username || 'unknown user',
                    itemName: teachers[adviser_id]?.teacher || 'unknown teacher',
                    docId: adviser_id,
                    entryData: {
                        at: section_adviser.additionalTeacherScheds,
                    },
                });

                entry_id = sections[id]?.id;
            } else if (collection === 'schedules') {
                entry_id = id;
            }

            await deleteDocument({
                docId: entry_id === null ? id : entry_id,
                collectionName: collection,
                collectionAbbreviation: COLLECTION_ABBREVIATION[collection.toUpperCase()],
                userName: currentUser?.username || 'unknown user',
                itemName: 'an item',
            });

            toast.success(`Entry deleted from ${collection} successfully.`, {
                style: {
                    backgroundColor: 'green',
                    color: 'white',
                    bordercolor: 'green',
                },
            });
        } catch (error) {
            console.error(error);
        } finally {
            closeModal();
        }
    };

    const openModal = () => {
        const deleteModalElement = document.getElementById(`delete_modal_${collection}_${id}`);
        if (deleteModalElement) {
            deleteModalElement.checked = true; // DaisyUI's checkbox-based toggle
        }
    };

    const closeModal = () => {
        const deleteModalElement = document.getElementById(`delete_modal_${collection}_${id}`);
        if (deleteModalElement) {
            deleteModalElement.checked = false;
        }
    };

    return (
        <div>
            {/* Trigger Button */}
            <button className='btn btn-xs btn-ghost text-red-500' onClick={openModal}>
                <RiDeleteBin7Line size={20} />
            </button>

            {/* Modal */}
            <input type='checkbox' id={`delete_modal_${collection}_${id}`} className='modal-toggle' />
            <div className='modal'>
                <div className='modal-box'>
                    {/* Icon and message */}
                    <div className='flex flex-col items-center justify-center'>
                        <TrashIcon className='text-red-500 mb-4' width={40} height={40} />
                        <h3 className='font-bold text-lg text-center'>Are you sure you want to delete this item?</h3>
                        <p className='text-sm text-gray-500 text-center'>This action cannot be undone.</p>
                    </div>

                    {/* Modal actions */}
                    <div className='modal-action flex justify-center'>
                        {/* Cancel Button */}
                        <label htmlFor={`delete_modal_${collection}_${id}`} className='btn btn-sm btn-ghost'>
                            Cancel
                        </label>

                        <LoadingButton
                            onClick={handleDelete}
                            isLoading={isDeleteLoading || isEditLoading}
                            loadingText='Deleting...'
                            disabled={isDeleteLoading || isEditLoading}
                            className='btn btn-sm btn-error text-white'
                        >
                            Delete
                        </LoadingButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteData;
