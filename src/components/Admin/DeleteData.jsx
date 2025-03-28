import React, { useEffect } from 'react';

import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import {RiDeleteBin7Line } from 'react-icons/ri';

import { fetchDocuments } from '../../hooks/CRUD/retrieveDocuments';
import { deleteDocument } from '../../hooks/CRUD/deleteDocument';

import { toast } from "sonner";

const DeleteData = ({ 
    id,
    collection, 
    callback 
}) => {

// ===============================================================================================

    const { documents: subjects, loading1, error1 } = fetchDocuments('subjects');
    const { documents: programs, loading2, error2 } = fetchDocuments('programs');
    const { documents: sections, loading3, error3 } = fetchDocuments('sections');   
    const { documents: ranks, loading4, error4 } = fetchDocuments('ranks');
    const { documents: teachers, loading5, error5 } = fetchDocuments('teachers');
    const { documents: departments, loading6, error6 } = fetchDocuments('departments');

// ===============================================================================================

    useEffect(() => {
        console.log('id:', id);
    }, [id]);

    const handleDelete = async () => {

        try {

            let entry_id = null;

            if (collection === 'subjects') {

                const subject_id = subjects[id]?.id;

                const isInPrograms = Object.values(programs).some(program =>
                    [7, 8, 9, 10].some(grade =>
                        Object.values(program[grade]?.subjects || []).flat().includes(id)
                    )
                );                
            
                const isInSections = Object.values(sections).some(section =>
                    (section.subjects || []).includes(id)
                ); 
                
                const isInTeachers = Object.values(teachers).some(teacher =>
                    (teacher.subjects || []).includes(id) 
                );

                const dependencies = [
                    { condition: isInPrograms && isInSections && isInTeachers, message: 'Subject is used in programs, teachers, and sections. Cannot delete.' },
                    { condition: isInSections && isInPrograms, message: 'Subject is used in sections and programs. Cannot delete.' },
                    { condition: isInPrograms && isInTeachers, message: 'Subject is used in programs and teachers. Cannot delete.' },
                    { condition: isInSections && isInTeachers, message: 'Subject is used in sections and teachers. Cannot delete.' },
                    { condition: isInSections, message: 'Subject is used in sections. Cannot delete.' },
                    { condition: isInTeachers, message: 'Subject is used in teachers. Cannot delete.' },
                    { condition: isInPrograms, message: 'Subject is used in programs. Cannot delete.' }
                ];
                
                const dependency = dependencies.find(dep => dep.condition);
                
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

                const isInSections = Object.values(sections).some(section => section.program === id);

                if ( isInSections ) {
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

                const isInTeachers = Object.values(teachers).some(teacher => teacher.rank === id);

                if ( isInTeachers ) {
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

                const isInSections = Object.values(sections).some(section => section.teacher === id);

                if ( isInSections ) {
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

                const isInTeachers = Object.values(teachers).some(teacher => teacher.department === id);

                if ( isInTeachers ) {
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

                entry_id = sections[id]?.id;

            }

            const result = await deleteDocument(collection, entry_id);

            toast.success(`Entry deleted from ${collection} successfully.`, {
				style: {
					backgroundColor: 'green',
					color: 'white',
					bordercolor: 'green',
				},
			});

            console.log(result);

        } catch (error) {
            console.error(error);
        } finally {

            if (callback) {
                callback(result);
            }

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
            <button
                className="btn btn-xs btn-ghost text-red-500"
                onClick={openModal}
            >
                <RiDeleteBin7Line size={20} />
            </button>

            {/* Modal */}
            <input
                type="checkbox"
                id={`delete_modal_${collection}_${id}`}
                className="modal-toggle"
            />
            <div className="modal">
                <div className="modal-box">
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
                        {/* Cancel Button */}
                        <label
                            htmlFor={`delete_modal_${collection}_${id}`}
                            className="btn btn-sm btn-ghost"
                        >
                            Cancel
                        </label>

                        {/* Confirm Delete Button */}
                        <button
                            className="btn btn-sm btn-error text-white"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default DeleteData;
