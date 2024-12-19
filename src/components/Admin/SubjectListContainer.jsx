import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';

import {
    fetchSubjects,
    addSubject,
    editSubject,
    removeSubject,
} from '@features/subjectSlice';
import { fetchPrograms, editProgram } from '@features/programSlice';
import { fetchSections, editSection } from '@features/sectionSlice';

import { getTimeSlotIndex } from './timeSlotMapper';

import { IoAdd, IoSearch } from 'react-icons/io5';
import debounce from 'debounce';
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';

import { toast } from 'sonner';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import calculateTotalTimeslot from '../../utils/calculateTotalTimeslot';

const AddSubjectContainer = ({
    close,
    reduxFunction,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    defaultSubjectClassDuration,
}) => {
    const inputNameRef = useRef();
    const dispatch = useDispatch();
    const subjects = useSelector((state) => state.subject.subjects);

    const dayNames = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ];

    const [subjectName, setSubjectName] = useState('');
    const [classSubjectDuration, setClassSubjectDuration] = useState(
        defaultSubjectClassDuration || 10
    );

    const [subjectWeeklyMinutes, setSubjectWeeklyMinutes] = useState(200);

    const handleAddSubject = () => {
        if (!subjectName.trim()) {
            setErrorMessage('Subject name cannot be empty');
            setErrorField('name'); // Highlight Subject Name input
            return;
        } else if (!classSubjectDuration) {
            setErrorMessage('Class duration cannot be empty');
            setErrorField('duration'); // Highlight Class Duration input
            return;
        } else if (!subjectWeeklyMinutes) {
            alert('Subject weekly minutes cannot be empty');
            return;
        }

        const classDuration = parseInt(classSubjectDuration, 10);
        const weeklyMinutes = parseInt(subjectWeeklyMinutes, 10);

        const duplicateSubject = Object.values(subjects).find(
            (subject) =>
                subject.subject.trim().toLowerCase() ===
                subjectName.trim().toLowerCase()
        );

        if (duplicateSubject) {
            setErrorMessage('A subject with this name already exists');
            setErrorField('name');
        } else {
            dispatch(
                reduxFunction({
                    subject: subjectName,
                    classDuration: classDuration,
                    weeklyMinutes: weeklyMinutes,
                })
            );

            toast.success('Subject added successfully', {
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
        setSubjectName('');
        setClassSubjectDuration(defaultSubjectClassDuration || 10);
        setSubjectWeeklyMinutes(200);

        setErrorMessage('');
        setErrorField('');
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    };

    // Tracks which input field has an error
    useEffect(() => {
        if (!close) {
            setErrorMessage('');
            setErrorField('');
        }
    }, [close, setErrorMessage, setErrorField]);

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    return (
        <div>
            <h3 className="text-lg font-bold mb-4">Add New Subject</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Subject Name:
                </label>
                <input
                    type="text"
                    className={`input input-bordered w-full ${
                        errorField === 'name' ? 'border-red-500' : ''
                    }`}
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Enter subject name"
                    ref={inputNameRef}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Class Duration (minutes):
                </label>
                <input
                    type="number"
                    className={`input input-bordered w-full ${
                        errorField === 'duration' ? 'border-red-500' : ''
                    }`}
                    value={classSubjectDuration}
                    onChange={(e) =>
                        setClassSubjectDuration(Number(e.target.value))
                    }
                    placeholder="Enter class duration"
                    step={5}
                    min={10}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Subject's Weekly Time Requirement (minutes):
                </label>
                <input
                    type="number"
                    className="input input-bordered w-full"
                    value={subjectWeeklyMinutes}
                    onChange={(e) => {
                        const value = Number(e.target.value);
                        setSubjectWeeklyMinutes(value);
                    }}
                    placeholder="Enter subject's weekly minutes"
                    step={5}
                />
            </div>

            {errorMessage && (
                <p className="text-red-500 text-sm my-4 font-medium select-none ">
                    {errorMessage}
                </p>
            )}

            <div className="flex justify-center gap-2">
                <button
                    className="btn btn-secondary border-0"
                    onClick={handleReset}
                >
                    Reset
                </button>
                <button className="btn btn-primary" onClick={handleAddSubject}>
                    Add Subject
                </button>
            </div>
        </div>
    );
};

const SubjectListContainer = ({
    numOfSchoolDays: externalNumOfSchoolDays,
    editable = false,
}) => {
    const dispatch = useDispatch();

    const { subjects, status: subjectStatus } = useSelector(
        (state) => state.subject
    );
    const { programs, status: programStatus } = useSelector(
        (state) => state.program
    );
    const { sections, status: sectionStatus } = useSelector(
        (state) => state.section
    );

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return (
            externalNumOfSchoolDays ??
            (Number(localStorage.getItem('numOfSchoolDays')) || 0)
        );
    });
    const defaultSubjectClassDuration = localStorage.getItem(
        'defaultSubjectClassDuration'
    );

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState('');

    const [editSubjectId, setEditSubjectId] = useState(null);
    const [searchSubjectResult, setSearchSubjectResult] = useState(subjects);
    const [editSubjectValue, setEditSubjectValue] = useState('');
    const [editClassDuration, setEditClassDuration] = useState(0);
    const [editSubjectWeeklyMinutes, setEditSubjectWeeklyMinutes] = useState(0);

    const [searchSubjectValue, setSearchSubjectValue] = useState('');

    const handleEditSubjectClick = (subject) => {
        setEditSubjectId(subject.id);
        setEditSubjectValue(subject.subject);
        setEditClassDuration(subject.classDuration);
        setEditSubjectWeeklyMinutes(subject.weeklyMinutes);
    };

    const handleSaveSubjectEditClick = (subjectId) => {
        if (!editSubjectValue.trim()) {
            alert('Subject name cannot be empty');
            return;
        } else if (!editClassDuration) {
            alert('Class duration cannot be empty');
            return;
        } else if (!editSubjectWeeklyMinutes) {
            alert('Subject weekly minutes cannot be empty');
            return;
        }

        const currentSubject = subjects[subjectId]?.subject || '';

        if (
            editSubjectValue.trim().toLowerCase() ===
            currentSubject.toLowerCase()
        ) {
            dispatch(
                editSubject({
                    subjectId,
                    updatedSubject: {
                        subject: editSubjectValue,
                        classDuration: editClassDuration,
                        weeklyMinutes: editSubjectWeeklyMinutes,
                    },
                })
            );

            updateSubjectDependencies();

            toast.success('Data and dependencies updated successfully', {
                style: {
                    backgroundColor: 'green',
                    color: 'white',
                    bordercolor: 'green',
                },
            });

            setEditSubjectId(null);
            setEditSubjectValue('');
            setEditClassDuration(0);
            setEditSubjectWeeklyMinutes(0);
        } else {
            const duplicateSubject = Object.values(subjects).find(
                (subject) =>
                    subject.subject.trim().toLowerCase() ===
                    editSubjectValue.trim().toLowerCase()
            );

            if (duplicateSubject) {
                alert('A subject with this name already exists.');
            } else if (editSubjectValue.trim()) {
                dispatch(
                    editSubject({
                        subjectId,
                        updatedSubject: {
                            subject: editSubjectValue,
                            classDuration: editClassDuration,
                            weeklyMinutes: editSubjectWeeklyMinutes,
                        },
                    })
                );
                updateSubjectDependencies();
                // console.log('after :D subjects', subjects);
                toast.success('Data and dependencies updated successfully!', {
                    style: {
                        backgroundColor: '#28a745',
                        color: '#fff',
                        borderColor: '#28a745',
                    },
                });

                // resetInputs();
            } else {
                const duplicateSubject = Object.values(subjects).find(
                    (subject) =>
                        subject.subject.trim().toLowerCase() ===
                        editSubjectValue.trim().toLowerCase()
                );

                if (duplicateSubject) {
                    alert('A subject with this name already exists.');
                } else if (editSubjectValue.trim()) {
                    dispatch(
                        editSubject({
                            subjectId,
                            updatedSubject: {
                                subject: editSubjectValue,
                                classDuration: editClassDuration,
                                weeklyMinutes: editSubjectWeeklyMinutes,
                            },
                        })
                    );

                    updateSubjectDependencies();

                    toast.success(
                        'Data and dependencies updated successfully',
                        {
                            style: {
                                backgroundColor: 'green',
                                color: 'white',
                                bordercolor: 'green',
                            },
                        }
                    );

                    setEditSubjectId(null);
                    setEditSubjectValue('');
                    setEditClassDuration(0);
                    setEditSubjectWeeklyMinutes(0);
                }
            }
        }
    };

    const handleCancelSubjectEditClick = () => {
        setEditSubjectId(null);
        setEditSubjectValue('');
        setEditClassDuration(0);
        setEditSubjectWeeklyMinutes(0);
    };

    const updateSubjectDependencies = () => {
        if (Object.keys(programs).length === 0) return;

        // Update subject dependencies in PROGRAMS
        Object.entries(programs).forEach(([id, program]) => {
            const originalProgram = JSON.parse(JSON.stringify(program));
            const newProgram = JSON.parse(JSON.stringify(program));

            console.log('originalProgradsm', originalProgram);
            console.log('newProgarm', newProgram);

            [7, 8, 9, 10].forEach((grade) => {
                if (!newProgram[grade].subjects.length === 0) {
                    return;
                }

                const newTotalTimeslot = calculateTotalTimeslot(
                    {
                        ...subjects,
                        [editSubjectId]: {
                            ...subjects[editSubjectId],
                            subject: editSubjectValue,
                            classDuration: editClassDuration,
                            weeklyMinutes: editSubjectWeeklyMinutes,
                        },
                    },
                    newProgram[grade].subjects,
                    numOfSchoolDays
                );

                Object.entries(newProgram[grade].fixedPositions).forEach(
                    ([subjectId, fixedPosition]) => {
                        fixedPosition.forEach((item, i) => {
                            if (item > newTotalTimeslot) {
                                fixedPosition[i] = 0;
                                newProgram[grade].fixedDays[subjectId][i] = 0;
                            }
                        });
                    }
                );

                console.log(
                    'newTotalTimeslot', newTotalTimeslot);

                console.log(`newProgram[${grade}].subjects`,
                    newProgram[grade].subjects
                );

                let dayTimeSlots = {};
                let positionTimeSlots = {};

                for (let subjectID of newProgram[grade].subjects) {
                    const { fixedDays, fixedPositions } = newProgram[grade];
                    
                    fixedDays[subjectID].forEach((day, i) => {
                        const position = fixedPositions[subjectID][i];
                
                        if (day || position) { // Only process non-zero day or position
                            dayTimeSlots[day] ??= newTotalTimeslot; // Use nullish coalescing assignment
                            positionTimeSlots[position] ??= numOfSchoolDays;
                        }
                    });
                }                

                console.log('dayTimeSlots', dayTimeSlots);

                console.log('positionTimeSlots', positionTimeSlots);

                // Loop through all subjects of the year level
                for (let subjectID of newProgram[grade].subjects) {
                    // Retrieve the number of classes allowed for the subject
                    let numOfClasses = 0;
                    if (subjectID === editSubjectId) {
                        numOfClasses = Math.min(
                            Math.ceil(
                                editSubjectWeeklyMinutes / editClassDuration
                            ),
                            numOfSchoolDays
                        );
                    } else {
                        numOfClasses = Math.min(
                            Math.ceil(
                                subjects[subjectID].weeklyMinutes /
                                    subjects[subjectID].classDuration
                            ),
                            numOfSchoolDays
                        );
                    }
                    console.log('grade', grade);
                    console.log('subjectID', subjectID);
                    console.log('numOfClasses', numOfClasses);

                    const fixedDays = newProgram[grade].fixedDays[subjectID];
                    const fixedPositions =
                        newProgram[grade].fixedPositions[subjectID];

                    console.log('fixedDays', fixedDays);
                    console.log('fixedPositions', fixedPositions);

                    // Use hash maps to quickly look up subjects and day-position pairs
                    const dayPositionMap = new Map();

                    fixedDays.forEach((day, index) => {
                        const pos = fixedPositions[index];
                        console.log('day', day);
                        console.log('pos', pos);
                        if (
                            (
                                (day !== 0 && pos === 0) ||
                                    (day === 0 && pos !== 0) ||
                                    (day !== 0 && pos !== 0)) &&
                                !dayPositionMap.has(`${day}-${pos}`
                            )
                        ) {
                            dayPositionMap.set(`${day}-${pos}`, [day, pos]);
                        }
                    });

                    console.log('dayPositionMap', dayPositionMap);

                    // Now we process the day-position pairs efficiently
                    let result = [];
                    dayPositionMap.forEach(([day, pos]) => {
                        if (result.length < numOfClasses && dayTimeSlots[day] > 0 && positionTimeSlots[pos] > 0) {
                            result.push([day, pos]);
                            dayTimeSlots[day]--;
                            positionTimeSlots[pos]--;
                        }
                    });

                    console.log('result', result);

                    // Pad with [0, 0] if necessary
                    while (result.length < numOfClasses) {
                        result.push([0, 0]);
                    }

                    // Split the combined array back into fixedDays and fixedPositions
                    newProgram[grade].fixedDays[subjectID] = result.map(
                        ([day]) => day
                    );
                    newProgram[grade].fixedPositions[subjectID] = result.map(
                        ([_, pos]) => pos
                    );
                }
            });

            const updateProgramDetails = (newProgram, grade) => ({
                subjects: newProgram[grade].subjects,
                fixedDays: newProgram[grade].fixedDays,
                fixedPositions: newProgram[grade].fixedPositions,
                shift: newProgram[grade].shift,
                startTime: getTimeSlotIndex(
                    newProgram[grade].startTime || '06:00 AM' // TODO: David: paano kung panghapon ung section?
                ),
            });

            console.log('updated newProgram', newProgram);

            if (originalProgram !== newProgram) {
                dispatch(
                    editProgram({
                        programId: newProgram.id,
                        updatedProgram: {
                            program: newProgram.program,
                            ...[7, 8, 9, 10].reduce((grades, grade) => {
                                grades[grade] = updateProgramDetails(
                                    newProgram,
                                    grade
                                );
                                return grades;
                            }, {}),
                        },
                    })
                );
            } else {
                console.log('no changes');
            }
        });

        if (Object.keys(sections).length === 0) return;

        // Update subject dependencies in SECTIONS
        Object.entries(sections).forEach(([id, section]) => {
            const originalSection = JSON.parse(JSON.stringify(section));
            const newSection = JSON.parse(JSON.stringify(section));

            if (!newSection.subjects.includes(editSubjectId)) return;

            const originalTotalTimeslot = calculateTotalTimeslot(
                subjects,
                newSection.subjects,
                numOfSchoolDays
            );

            const newTotalTimeslot = calculateTotalTimeslot(
                {
                    ...subjects,
                    [editSubjectId]: {
                        ...subjects[editSubjectId],
                        subject: editSubjectValue,
                        classDuration: editClassDuration,
                        weeklyMinutes: editSubjectWeeklyMinutes,
                    },
                },
                newSection.subjects,
                numOfSchoolDays
            );

            if (newTotalTimeslot < originalTotalTimeslot) {
                Object.entries(newSection.fixedPositions).forEach(
                    ([subjectId, fixedPosition]) => {
                        fixedPosition.forEach((item, i) => {
                            if (item > newTotalTimeslot) {
                                fixedPosition[i] = 0;
                                newSection.fixedDays[subjectId][i] = 0;
                            } // reset all positions to zero if timeslot is removed
                        });
                    }
                );
            }

            const numOfClasses = Math.min(
                Math.ceil(editSubjectWeeklyMinutes / editClassDuration),
                numOfSchoolDays
            );

            const fixedDays = newSection.fixedDays[editSubjectId];
            const fixedPositions = newSection.fixedPositions[editSubjectId];

            let dayTimeSlots = {};
            let positionTimeSlots = {};

            for (let subjectID of newSection.subjects) {
                const { fixedDays, fixedPositions } = newSection;
                
                fixedDays[subjectID].forEach((day, i) => {
                    const position = fixedPositions[subjectID][i];
            
                    if (day || position) { // Only process non-zero day or position
                        dayTimeSlots[day] ??= newTotalTimeslot; // Use nullish coalescing assignment
                        positionTimeSlots[position] ??= numOfSchoolDays;
                    }
                });
            }    

            // Use hash maps to quickly look up subjects and day-position pairs
            const dayPositionMap = new Map();

            fixedDays.forEach((day, index) => {
                const pos = fixedPositions[index];
                if (
                    ((day !== 0 && pos === 0) ||
                        (day === 0 && pos !== 0) ||
                        (day !== 0 && pos !== 0)) &&
                    !dayPositionMap.has(`${day}-${pos}`)
                ) {
                    dayPositionMap.set(`${day}-${pos}`, [day, pos]);
                }
            });

            // Now we process the day-position pairs efficiently
            let result = [];
            dayPositionMap.forEach(([day, pos]) => {
                if (result.length < numOfClasses && dayTimeSlots[day] > 0 && positionTimeSlots[pos] > 0) {
                    result.push([day, pos]);
                    dayTimeSlots[day] -= 1;
                    positionTimeSlots[pos] -= 1;
                }
            });

            console.log('fafaf dayPositionMap', dayPositionMap);

            // Pad with [0, 0] if necessary
            while (result.length < numOfClasses) {
                result.push([0, 0]);
            }

            // Split the combined array back into fixedDays and fixedPositions
            newSection.fixedDays[editSubjectId] = result.map(([day]) => day);
            newSection.fixedPositions[editSubjectId] = result.map(
                ([_, pos]) => pos
            );

            if (originalSection !== newSection) {
                dispatch(
                    editSection({
                        sectionId: newSection.id,
                        updatedSection: {
                            id: newSection.id,
                            teacher: newSection.teacher,
                            program: newSection.program,
                            section: newSection.section,
                            subjects: newSection.subjects,
                            fixedDays: newSection.fixedDays,
                            fixedPositions: newSection.fixedPositions,
                            year: newSection.year,
                            shift: newSection.shift,
                            startTime: getTimeSlotIndex(
                                newSection.startTime || '06:00 AM'
                            ),
                        },
                    })
                );
            }
        });
    };

    const handleClose = () => {
        const modal = document.getElementById('add_subject_modal');
        if (modal) {
            modal.close();
            setErrorMessage('');
            setErrorField('');
        } else {
            console.error("Modal with ID 'add_subject_modal' not found.");
        }
    };

    const deleteModal = (id) => {
        const deleteModalElement = document.getElementById('delete_modal');
        deleteModalElement.showModal();

        const deleteButton = document.getElementById('delete_button');
        deleteButton.onclick = () => handleDelete(id);
    };

    const handleDelete = (id) => {
        dispatch(removeSubject(id));
        document.getElementById('delete_modal').close();
    };

    const debouncedSearch = useCallback(
        debounce((searchValue, subjects) => {
            setSearchSubjectResult(
                filterObject(subjects, ([, subject]) => {
                    const escapedSearchValue = escapeRegExp(searchValue)
                        .split('\\*')
                        .join('.*');

                    const pattern = new RegExp(escapedSearchValue, 'i');

                    return pattern.test(subject.subject);
                })
            );
        }, 200),
        []
    );

    useEffect(() => {
        if (externalNumOfSchoolDays !== undefined) {
            setNumOfSchoolDays(externalNumOfSchoolDays);
        }
    }, [externalNumOfSchoolDays]);

    useEffect(() => {
        console.log('numOfSchoolDays:', numOfSchoolDays);
    }, [numOfSchoolDays]);

    // Initialization of stores
    useEffect(() => {
        if (subjectStatus === 'idle') {
            dispatch(fetchSubjects());
        }
    }, [subjectStatus, dispatch]);

    useEffect(() => {
        if (programStatus === 'idle') {
            dispatch(fetchPrograms());
        }
    }, [programStatus, dispatch]);

    useEffect(() => {
        if (sectionStatus === 'idle') {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

    useEffect(() => {
        debouncedSearch(searchSubjectValue, subjects);
    }, [searchSubjectValue, subjects, debouncedSearch]);

    const itemsPerPage = 10; // Change this to adjust the number of items per page
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages
    const totalPages = Math.ceil(
        Object.values(searchSubjectResult).length / itemsPerPage
    );

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = Object.entries(searchSubjectResult).slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5">
                {/* Pagination */}
                {currentItems.length > 0 && (
                    <div className="join flex justify-center  mb-4 md:mb-0">
                        <button
                            className={`join-item btn ${
                                currentPage === 1 ? 'btn-disabled' : ''
                            }`}
                            onClick={() => {
                                if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                }
                                resetInputs();
                            }}
                            disabled={currentPage === 1}
                        >
                            «
                        </button>
                        <button className="join-item btn">
                            Page {currentPage} of {totalPages}
                        </button>
                        <button
                            className={`join-item btn ${
                                currentPage === totalPages ? 'btn-disabled' : ''
                            }`}
                            onClick={() => {
                                if (currentPage < totalPages) {
                                    setCurrentPage(currentPage + 1);
                                }
                                resetInputs();
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

                {/* Search Subject */}
                <div className="flex-grow w-full md:w-1/3 lg:w-1/4">
                    <label className="input input-bordered flex items-center gap-2 w-full">
                        <input
                            type="text"
                            className="grow p-3 text-sm w-full"
                            placeholder="Search Subject"
                            value={searchSubjectValue}
                            onChange={(e) =>
                                setSearchSubjectValue(e.target.value)
                            }
                        />
                        <IoSearch className="text-xl" />
                    </label>
                </div>

                {/* Add Subject Button (only when editable) */}
                {editable && (
                    <div className="w-full mt-4 md:mt-0 md:w-auto">
                        <button
                            className="btn btn-primary h-12 flex items-center justify-center w-full md:w-52"
                            onClick={() =>
                                document
                                    .getElementById('add_subject_modal')
                                    .showModal()
                            }
                        >
                            Add Subject <IoAdd size={20} className="ml-2" />
                        </button>

                        {/* Modal for adding subject */}
                        <dialog
                            id="add_subject_modal"
                            className="modal modal-bottom sm:modal-middle"
                        >
                            <div className="modal-box">
                                <AddSubjectContainer
                                    close={() =>
                                        document
                                            .getElementById('add_subject_modal')
                                            .close()
                                    }
                                    reduxFunction={addSubject}
                                    errorMessage={errorMessage}
                                    setErrorMessage={setErrorMessage}
                                    errorField={errorField}
                                    setErrorField={setErrorField}
                                    defaultSubjectClassDuration={
                                        defaultSubjectClassDuration
                                    }
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
                            {/* <th className="w-8">#</th> */}
                            <th>ID</th>
                            <th>Subject</th>
                            <th>Duration (min)</th>
                            <th>Weekly Requirement (min)</th>
                            <th># of Classes (Max: {numOfSchoolDays})</th>
                            {editable && <th className="text-left">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    No subjects found
                                </td>
                            </tr>
                        ) : (
                            currentItems.map(([, subject], index) => (
                                <tr key={subject.id} className="group hover">
                                    {/* <td>{index + indexOfFirstItem + 1}</td> */}

                                    {/* Subject ID */}
                                    <th>{subject.id}</th>

                                    {/* Subject Name */}
                                    <td>
                                        {editSubjectId === subject.id ? (
                                            <input
                                                type="text"
                                                value={editSubjectValue}
                                                onChange={(e) =>
                                                    setEditSubjectValue(
                                                        e.target.value
                                                    )
                                                }
                                                className="input input-bordered input-sm w-full"
                                            />
                                        ) : (
                                            subject.subject
                                        )}
                                    </td>

                                    {/* Duration */}
                                    <td>
                                        {editSubjectId === subject.id ? (
                                            <input
                                                type="number"
                                                value={editClassDuration}
                                                onChange={(e) => {
                                                    const newDuration = Number(
                                                        e.target.value
                                                    );
                                                    setEditClassDuration(
                                                        newDuration
                                                    );
                                                }}
                                                className="input input-bordered input-sm w-full"
                                                placeholder="Enter class duration"
                                                step={5}
                                                min={10}
                                            />
                                        ) : (
                                            `${subject.classDuration}`
                                        )}
                                    </td>

                                    {/* Weekly Minutes */}
                                    <td>
                                        {editSubjectId === subject.id ? (
                                            <input
                                                type="number"
                                                value={editSubjectWeeklyMinutes}
                                                onChange={(e) => {
                                                    const newDuration = Number(
                                                        e.target.value
                                                    );
                                                    setEditSubjectWeeklyMinutes(
                                                        newDuration
                                                    );
                                                }}
                                                className="input input-bordered input-sm w-full"
                                                placeholder="Enter subject weekly minutes"
                                                step={5}
                                            />
                                        ) : (
                                            `${subject.weeklyMinutes}`
                                        )}
                                    </td>
                                    <td>
                                        {Math.min(
                                            Math.ceil(
                                                subject.weeklyMinutes /
                                                    subject.classDuration
                                            ),
                                            numOfSchoolDays
                                        )}
                                    </td>
                                    {editable && (
                                        <td className="w-28 text-right">
                                            {editSubjectId === subject.id ? (
                                                <>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-green-500"
                                                        onClick={() =>
                                                            handleSaveSubjectEditClick(
                                                                subject.id
                                                            )
                                                        }
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-red-500"
                                                        onClick={() =>
                                                            handleCancelSubjectEditClick()
                                                        }
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-blue-500"
                                                        onClick={() =>
                                                            handleEditSubjectClick(
                                                                subject
                                                            )
                                                        }
                                                    >
                                                        <RiEdit2Fill
                                                            size={20}
                                                        />
                                                    </button>

                                                    <button
                                                        className="btn btn-xs btn-ghost text-red-500"
                                                        onClick={() =>
                                                            deleteModal(
                                                                subject.id
                                                            )
                                                        }
                                                    >
                                                        <RiDeleteBin7Line
                                                            size={20}
                                                        />
                                                    </button>

                                                    {/* Modal for deleting an item */}
                                                    <dialog
                                                        id="delete_modal"
                                                        className="modal modal-bottom sm:modal-middle"
                                                    >
                                                        <form
                                                            method="dialog"
                                                            className="modal-box"
                                                        >
                                                            {/* Icon and message */}
                                                            <div className="flex flex-col items-center justify-center">
                                                                <TrashIcon
                                                                    className="text-red-500 mb-4"
                                                                    width={40}
                                                                    height={40}
                                                                />
                                                                <h3 className="font-bold text-lg text-center">
                                                                    Are you sure
                                                                    you want to
                                                                    delete this
                                                                    item?
                                                                </h3>
                                                                <p className="text-sm text-gray-500 text-center">
                                                                    This action
                                                                    cannot be
                                                                    undone.
                                                                </p>
                                                            </div>

                                                            {/* Modal actions */}
                                                            <div className="modal-action flex justify-center">
                                                                {/* Close Button */}
                                                                <button
                                                                    className="btn btn-sm btn-ghost"
                                                                    onClick={() =>
                                                                        document
                                                                            .getElementById(
                                                                                'delete_modal'
                                                                            )
                                                                            .close()
                                                                    }
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

export default SubjectListContainer;
