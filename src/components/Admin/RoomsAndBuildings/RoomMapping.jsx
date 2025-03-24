import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';

import { fetchBuildings, addBuilding, editBuilding, removeBuilding } from '@features/buildingSlice';

import { IoAdd, IoSearch, IoTrashBin } from 'react-icons/io5';
import debounce from 'debounce';
import { toast } from 'sonner';
import NearbyBuildingDropdown from './nearbyBuildingDropdown';
import { PiBuildingApartment } from 'react-icons/pi';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';
import { addDocument } from '../../../hooks/CRUD/addDocument';
import { editDocument } from '../../../hooks/CRUD/editDocument';
import { deleteDocument } from '../../../hooks/CRUD/deleteDocument';
import { fetchSections } from '../../../features/sectionSlice';


const AddBuildingContainer = ({ 
    close, 
    setErrorMessage, 
    setErrorField, 
    errorMessage, 
    errorField 
}) => {

    const inputBuildingNameRef = useRef();

// ===========================================================================

    // const availableBuildings = useSelector((state) => Object.values(state.building.buildings));

    const { documents: buildings, loading1, error1 } = fetchDocuments('buildings');

// ===========================================================================

    const [buildingName, setBuildingName] = useState('');

    const [numberOfFloors, setNumberOfFloors] = useState(1);

    const [numberOfRooms, setNumberOfRooms] = useState([]);

    const [roomNames, setRoomNames] = useState({});

    const [buildingImage, setBuildingImage] = useState('');

    const [previewImage, setPreviewImage] = useState('');

    const [nearbyBuildings, setNearbyBuildings] = useState([]);

// ===========================================================================

    // useEffect(() => {
    //     dispatch(fetchBuildings());
    // }, [dispatch]);

    useEffect(() => {
        if (!close) {
            setErrorMessage('');
            setErrorField('');
        }
    }, [close, setErrorMessage, setErrorField]);

    useEffect(() => {
        if (inputBuildingNameRef.current) {
            inputBuildingNameRef.current.focus();
        }
    }, []);

    useEffect(() => {
        setNumberOfRooms((prev) =>
            Array.from({ length: numberOfFloors }, (_, i) => prev[i] || 0)
        );
    
        setRoomNames((prev) =>
            Array.from({ length: numberOfFloors }, (_, i) => prev[i] || {})
                .reduce((acc, _, i) => {
                    acc[i] = prev[i] || {}; // Ensure each floor is an object
                    return acc;
                }, {})
        );
    }, [numberOfFloors]);
    
    const handleNumberOfRoomsChange = (floorIndex, value) => {
        const roomsCount = Math.max(1, Number(value)); // Ensure no negative values
    
        // Update number of rooms per floor
        setNumberOfRooms((prev) => {
            const updatedRooms = [...prev];
            updatedRooms[floorIndex] = roomsCount;
            return updatedRooms;
        });
    
        // Adjust roomNames structure (ensure it's treated as an object)
        setRoomNames((prev) => {
            const updatedRoomNames = { ...prev }; // Copy existing room names object
    
            // Create new room objects
            const newRooms = {};
            for (let i = 0; i < roomsCount; i++) {
                newRooms[i] = {
                    roomName: `${buildingName || 'room'} - ${(floorIndex + 1) * 100 + i + 1}`
                };
            }
    
            updatedRoomNames[floorIndex] = newRooms; // Assign room object to corresponding floor index
            return updatedRoomNames;
        });
    };
    
    const handleRoomNameChange = (floorIndex, roomIndex, newRoomName) => {
        const updatedRoomNames = [...roomNames];
        if (!updatedRoomNames[floorIndex]) updatedRoomNames[floorIndex] = [];
        if (!updatedRoomNames[floorIndex][roomIndex]) {
            updatedRoomNames[floorIndex][roomIndex] = { roomName: '' };
        }

        updatedRoomNames[floorIndex][roomIndex] = {
            ...updatedRoomNames[floorIndex][roomIndex],
            roomName: newRoomName,
        };

        setRoomNames(updatedRoomNames);
    };

// ===========================================================================

    const handleImageUpload = (e) => {

        const file = e.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setBuildingImage(reader.result); // Save the Base64 string of the image
                setPreviewImage(reader.result); // For previewing the image
            };
            reader.readAsDataURL(file); // Read file as Base64 string
        } else {
            setBuildingImage(null); // Reset file name if no file is selected
            setPreviewImage(null); // Reset preview if no file is selected
        }

    };

    const handleReset = () => {
        setBuildingImage(null);
        setBuildingName('');
        setNumberOfFloors(1);
        setNumberOfRooms([]);
        setRoomNames([]);
        setBuildingImage('');
        setPreviewImage('');
        setNearbyBuildings([]);
        setErrorMessage('');
        setErrorField('');
        if (inputBuildingNameRef.current) {
            inputBuildingNameRef.current.focus();
        }
    };

    const handleAddBuilding = () => {

        // Check if building name is empty
        if (!buildingName.trim()) {
            setErrorMessage('Building name cannot be empty');
            setErrorField('buildingName');
            return;
        }

        // Check for duplicate building names
        const isDuplicateName = Object.values(buildings).some(
            (building) => building.name === buildingName.trim()
        );

        if (isDuplicateName) {
            setErrorMessage('Building name must be unique');
            setErrorField('buildingName');
            return;
        }

        // Check if there is at least one floor and one room
        if (numberOfFloors < 1 || roomNames.length < 1) {
            setErrorMessage('There must be at least one floor and one room');
            setErrorField('floorsAndRooms');
            return;
        }

        // Check if room names are valid (not empty or spaces)
        const hasEmptyRoomNames = Object.values(roomNames).some(
            (floorRooms) =>
                Object.keys(floorRooms).length === 0 || // Check if the floor has no rooms
                Object.values(floorRooms).some((room) => !room.roomName.trim()) // Check if any room has an empty name
        );
        
        if (hasEmptyRoomNames) {
            setErrorMessage('Room names cannot be empty');
            setErrorField('roomNames');
            return;
        }

        // Check if there are at least three nearby buildings
        if (nearbyBuildings.length > 3 && buildings.length == 0) {
            setErrorMessage('Please select at least three nearby buildings');
            setErrorField('nearbyBuildings');
            return;
        }

        // // Prepare building data for submission
        // const buildingData = {
        //     name: buildingName,
        //     floors: numberOfFloors,
        //     rooms: roomNames,
        //     image: buildingImage, // Base64 string
        //     nearbyBuildings: nearbyBuildings.map((building) => ({
        //         id: building.id,
        //         name: building.name,
        //     })),
        // };

        // // Dispatch the action to add the building
        // dispatch(addBuilding(buildingData));

        try {
            // Prepare building data for submission
        // const buildingData = {
        //     name: buildingName,
        //     floors: numberOfFloors,
        //     rooms: roomNames,
        //     image: buildingImage, // Base64 string
        //     nearbyBuildings: nearbyBuildings.map((building) => ({
        //         id: building.id,
        //         name: building.name,
        //     })),
        // };

        // // Dispatch the action to add the building
        // dispatch(addBuilding(buildingData));
            addDocument('buildings', {
                name: buildingName,
                floors: numberOfFloors,
                rooms: roomNames,
                image: buildingImage, // Base64 string
                // nearbyBuildings: nearbyBuildings.map((building) => ({
                //     id: building.id,
                //     name: building.name,
                // })),
                nearbyBuildings: nearbyBuildings,
            });
        } catch (error) {
            console.error('Error addingbuilding:', error);
        } finally {
            toast.success('Building added successfully', {
                style: {
                    backgroundColor: 'green',
                    color: 'white',
                    bordercolor: 'green',
                },
            });
    
            // Reset form and close modal
            handleReset();
            document.getElementById('add_building_modal').close();
        }
        
    };

    return (
        <>
            <div className='flex gap-4 mb-4 shrink-0'>
                <div className='w-3/12 mt-2 items-center flex'>
                    {previewImage !== '' ? (
                        <div className='w-auto relative rounded-md'>
                            <button
                                className='btn btn-sm btn-circle shadow-lg btn-error absolute top-[-5px] right-[-5px]'
                                onClick={() => setPreviewImage('')}
                            >
                                <RiDeleteBin7Line size={20} />
                            </button>
                            <img src={previewImage} alt='Preview' className='object-cover aspect-square' />
                        </div>
                    ) : (
                        <div className='flex justify-center rounded-md items-center w-full h-full opacity-50'>
                            <PiBuildingApartment size={100} />
                        </div>
                    )}
                </div>

                <div className='w-9/12 p-2'>
                    <div className='flex items-center justify-between'>
                        <h3 className='text-xl font-bold '>Add new Building</h3>

                        <div className='flex justify-center gap-4'>
                            <button className='btn btn-secondary' onClick={handleReset}>
                                Reset
                            </button>
                            <button className='btn btn-primary' onClick={handleAddBuilding}>
                                Add Building
                            </button>
                        </div>
                    </div>

                    <div className='text-red-500 text-right mt-2 text-sm'>
                        {errorMessage || <span className='invisible line-clamp-1'>...</span>}
                    </div>

                    <div className='divider'></div>

                    <div className='flex gap-4'>
                        <div className='w-6/12 flex flex-col gap-2'>

                            {/* Building Name */}
                            <div className='flex items-center text-left'>
                                <label className='text-sm  w-9/12'>Building Name:</label>
                                <input
                                    type='text'
                                    className={`input input-sm input-bordered w-full ${
                                        errorField === 'buildingName' ? 'border-red-500' : ''
                                    }`}
                                    value={buildingName}
                                    onChange={(e) => setBuildingName(e.target.value)}
                                    ref={inputBuildingNameRef}
                                />
                            </div>
                            
                            {/* Number of Floors */}
                            <div className='flex items-center text-left'>
                                <label className='text-sm  w-9/12'>Number of Floors:</label>
                                <input
                                    type='number'
                                    className={`input input-sm input-bordered w-full ${
                                        errorField === 'floors' ? 'border-red-500' : ''
                                    }`}
                                    value={numberOfFloors}
                                    onChange={(e) => setNumberOfFloors(Math.max(1, Number(e.target.value)))}
                                    min={1}
                                />
                            </div>
                            
                            {/* Building Image */}
                            {/* <div className=''>
                                <div className='space-y-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Building Image:</label>
                                        <label className='form-control w-full'>
                                            <input
                                                type='file'
                                                accept='image/*'
                                                className={`file-input file-input-sm file-input-bordered w-full ${
                                                    errorField === 'buildingImage' ? 'border-red-500' : ''
                                                }`}
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div> */}

                        </div>

                        <div className='w-6/12'>
                            <div>
                                <label className='block text-sm text-left pl-2 mb-1'>
                                    Nearby Buildings:
                                </label>
                                <NearbyBuildingDropdown
                                    availableBuildings={buildings}
                                    // availableBuildings={availableBuildings}
                                    nearbyBuildings={nearbyBuildings}
                                    setNearbyBuildings={setNearbyBuildings}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex-grow overflow-auto grid grid-cols-1 md:grid-cols-4 gap-4'>
                {Array.from({ length: numberOfFloors }, (_, floorIndex) => (
                    <div key={floorIndex} className='flex flex-col border border-base-content border-opacity-20 h-96 rounded-md p-2 shadow-sm'>
                        <div className='flex mb-3 gap-1 items-center'>
                            <div className='w-6/12 leading-none'>
                                <h4 className='text-sm font-semibold'>Floor {floorIndex + 1}</h4>
                                <span className='text-sm'>room count:</span>
                            </div>
                            <input
                                type='number'
                                className='input input-bordered input-sm w-6/12'
                                value={numberOfRooms[floorIndex] || 0}
                                onChange={(e) => handleNumberOfRoomsChange(floorIndex, e.target.value)}
                                min={1}
                            />
                        </div>

                        <div
                            className='overflow-auto w-full rounded-md h-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200'
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            {Array.from({ length: numberOfRooms[floorIndex] || 0 }, (_, roomIndex) => (
                                <div className='flex w-full justify-center items-center mb-1 gap-1' key={roomIndex}>
                                    <input
                                        key={roomIndex}
                                        type='text'
                                        className='w-9/12 input rounded-md input-sm input-bordered'
                                        placeholder={`Room ${roomIndex + 1}`}
                                        value={roomNames[floorIndex]?.[roomIndex]?.roomName || `Room ${roomIndex + 1}`}
                                        onChange={(e) => handleRoomNameChange(floorIndex, roomIndex, e.target.value)}
                                    />
                                    
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

const RoomListContainer = ({ 
    editable = false 
}) => {

    const inputBuildingNameRef = useRef();

// =========================================================================================================================

    const { documents: buildings, loading1, error1 } = fetchDocuments('buildings');
    const { documents: sections, loading2, error2 } = fetchDocuments('sections');

// =========================================================================================================================

    const [errorMessage, setErrorMessage] = useState('');
    const [errorField, setErrorField] = useState('');

    const [editBuildingID, setEditBuildingID] = useState(``);
    const [editBuildingCustomID, setEditBuildingCustomID] = useState(``);
    const [editBuildingName, setEditBuildingName] = useState('');
    const [editNumberOfFloors, setEditNumberOfFloors] = useState(1);
    const [editNumberOfRooms, setEditNumberOfRooms] = useState([]);
    const [editRoomNames, setEditRoomNames] = useState({});
    const [editBuildingImage, setEditBuildingImage] = useState('');
    const [editPreviewImage, setEditPreviewImage] = useState('');
    const [editNearbyBuildings, setEditNearbyBuildings] = useState([]);

    const [searchBuildingValue, setSearchBuildingValue] = useState('');
    const [searchBuildingResult, setSearchBuildingResult] = useState([]);

// ========================================================================================================================

    const handleClose = () => {
        const modal = document.getElementById('add_building_modal');
        if (modal) {
            modal.close();
            setErrorMessage('');
            setErrorField('');
        }
    };

    const debouncedSearch = useCallback(
        debounce((searchValue, buildings) => {
            const lowerCaseSearchValue = searchValue.toLowerCase();
            setSearchBuildingResult(
                Object.values(buildings).filter((building) => {
                    // Search by building name or room names
                    const nameMatch = building.name.toLowerCase().includes(lowerCaseSearchValue);
                    const roomMatch = Object.values(building.rooms).some((floor) =>
                        Object.values(floor).some((room) => room.roomName.toLowerCase().includes(lowerCaseSearchValue))
                    );
                    return nameMatch || roomMatch;
                })
            );
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchBuildingValue, buildings);
    }, [searchBuildingValue, buildings, debouncedSearch]);

    useEffect(() => {
        setSearchBuildingResult(Object.values(buildings));
    }, [buildings]);

// =======================================================================================================================

    const handleDelete = (id) => {

        try {

            const building_id = buildings[id]?.id;

            const isInSections = Object.values(sections).some(section => section.roomDetails?.buildingId === id);

            if ( isInSections ) {
                toast.error('Building is used in sections. Cannot delete.', {
                    style: {
                        backgroundColor: 'red',
                        color: 'white',
                        bordercolor: 'red',
                    },
                });
                throw new Error('Building is used in sections. Cannot delete.');
            } else {
                deleteDocument('buildings', building_id);

                toast.success(`Entry deleted from buildings successfully.`, {
                    style: {
                        backgroundColor: 'green',
                        color: 'white',
                        bordercolor: 'green',
                    },
                });
            }

        } catch (error) {
            console.error(error);
        } finally {
            document.getElementById('delete_modal').close();
        }
    };

    useEffect(() => {
        setEditNumberOfRooms((prev) =>
            Array.from({ length: editNumberOfFloors }, (_, i) => prev[i] || 0)
        );
    
        setEditRoomNames((prev) => {
            const updatedRoomNames = { ...prev }; // Ensure it's an object
    
            for (let i = 0; i < editNumberOfFloors; i++) {
                if (!updatedRoomNames[i]) {
                    updatedRoomNames[i] = {}; // Ensure each floor index is an object
                }
            }
    
            return updatedRoomNames;
        });
    }, [editNumberOfFloors]);
    

    const handleRoomNameChange = (floorIndex, roomIndex, newRoomName) => {
        const updatedRoomNames = [...editRoomNames];
    
        if (!updatedRoomNames[floorIndex]) updatedRoomNames[floorIndex] = [];
        if (!updatedRoomNames[floorIndex][roomIndex]) {
            updatedRoomNames[floorIndex][roomIndex] = { roomName: '' };
        }
    
        updatedRoomNames[floorIndex][roomIndex] = {
            ...updatedRoomNames[floorIndex][roomIndex], 
            roomName: newRoomName
        };
    
        setEditRoomNames(updatedRoomNames);
    };    

    const handleNumberOfRoomsChange = (floorIndex, value) => {
        const roomsCount = Math.max(1, Number(value)); // Ensure no negative values
    
        // Update number of rooms per floor
        const updatedRooms = [...editNumberOfRooms];
        updatedRooms[floorIndex] = roomsCount;
        setEditNumberOfRooms(updatedRooms);
    
        // Adjust roomNames structure
        const updatedRoomNames = { ...editRoomNames }; // Clone as an object
    
        // Create room objects with numeric keys
        const newRooms = {};
        for (let i = 0; i < roomsCount; i++) {
            newRooms[i] = {
                roomName: `${editBuildingName || "room"} - ${(floorIndex + 1) * 100 + i + 1}`,
            };
        }
    
        updatedRoomNames[floorIndex] = newRooms; // Assign room object to corresponding floor index
        setEditRoomNames(updatedRoomNames);
    };
    
    const handleImageUpload = (e) => {
        const file = e.target.files[0];

        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only JPEG and PNG files are allowed.');
                e.target.value = null; // Reset the file input
                setEditBuildingImage(null);
                setEditPreviewImage(null);
                return;
            }

            // Validate file size (example: max 2MB)
            const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSizeInBytes) {
                alert('File size exceeds the 2MB limit.');
                e.target.value = null; // Reset the file input
                setEditBuildingImage(null);
                setEditPreviewImage(null);
                return;
            }

            // Process valid file
            const reader = new FileReader();
            reader.onload = () => {
                setEditBuildingImage(reader.result); // Save the Base64 string of the image
                setEditPreviewImage(reader.result); // For previewing the image
            };
            reader.readAsDataURL(file); // Read file as Base64 string
        } else {
            // Reset if no file is selected
            setEditBuildingImage(null);
            setEditPreviewImage(null);
        }
    };

    const handleEdit = (building) => {
        console.log('Editing building:', building);

        setEditBuildingID(building.id);
        setEditBuildingCustomID(building.custom_id);
        setEditBuildingName(building.name || '');
        setEditNumberOfFloors(building.floors || 1);

        // Ensure rooms are correctly mapped for editing
        const roomCounts = Object.values(building.rooms || {}).map((floor) => Object.keys(floor).length);
        setEditNumberOfRooms(roomCounts);

        // const roomNames = Object.values(building.rooms || {}).flatMap((floor) => Object.values(floor));
        setEditRoomNames(building.rooms || {});

        setEditBuildingImage(building.image || '');
        setEditPreviewImage(building.image || '');

        setEditNearbyBuildings(building.nearbyBuildings || []);

        // Open modal
        document.getElementById('edit_building_modal').showModal();
    };

    // useEffect(() => {
    //     console.log('editRoomNames:', editRoomNames);
    // }, [editRoomNames]);

// ========================================================================================================================

    const handleSaveBuildingEditClick = () => {

        if (!editBuildingName.trim()) {
            setErrorMessage('Building name cannot be empty');
            setErrorField('buildingName');
            return;
        }

        // Check if the number of floors is valid
        if (editNumberOfFloors <= 0) {
            setErrorMessage('Number of floors must be greater than zero');
            setErrorField('floors');
            return;
        }

        // Check if each floor has at least one room
        if (editNumberOfRooms.some((rooms) => rooms <= 0)) {
            setErrorMessage('Each floor must have at least one room');
            setErrorField('rooms');
            return;
        }

        // Check if all room names are provided and non-empty
        const hasEmptyRoomNames = Object.values(editRoomNames).some(
            (floorRooms) =>
                Object.keys(floorRooms).length === 0 || 
                Object.values(floorRooms).some((room) => !room.roomName.trim()) 
        );
        if (hasEmptyRoomNames) {
            setErrorMessage('All rooms must have names');
            setErrorField('roomNames');
            return;
        }

        try {
            editDocument('buildings', editBuildingID, {
                name: editBuildingName,
                floors: editNumberOfFloors,
                rooms: editRoomNames,
                image: editBuildingImage || '',
                // nearbyBuildings: editNearbyBuildings.map((building) => ({
                //     id: building.id,
                //     name: building.name,
                // })),
                nearbyBuildings: editNearbyBuildings,
            });
        } catch {
            toast.error('Something went wrong. Please try again.');
            console.error('Something went wrong. Please try again.');
        } finally {
            toast.success('Data updated successfully!', {
                style: {
                    backgroundColor: '#28a745',
                    color: '#fff',
                    borderColor: '#28a745',
                },
            });
    
            setEditBuildingName('');
            setEditNumberOfFloors(1);
            setEditNumberOfRooms([]);
            setEditRoomNames([]);
            setEditBuildingImage(null);
            setEditPreviewImage(null);
            setEditNearbyBuildings([]);

            document.getElementById('edit_building_modal').close();
        }

        // Prepare updated building data
        // const updatedBuilding = {
        //     id: editBuildingID,
        //     name: editBuildingName,
        //     floors: editNumberOfFloors,
        //     rooms: editRoomNames,
        //     image: editBuildingImage || null,
        //     nearbyBuildings: editNearbyBuildings.map((building) => ({
        //         id: building.id,
        //         name: building.name,
        //     })),
        // };

        // Dispatch the update action
        // dispatch(editBuilding({ buildingId: editBuildingID, updatedBuilding }))
        //     .then(() => {
        //         // Close modal and clear state
        //         setEditBuildingName('');
        //         setEditNumberOfFloors(1);
        //         setEditNumberOfRooms([]);
        //         setEditRoomNames([]);
        //         setEditBuildingImage(null);
        //         setEditPreviewImage(null);
        //         setEditNearbyBuildings([]);

        //         document.getElementById('edit_building_modal').close();
        //     })
        //     .catch((error) => {
        //         console.error('Failed to update building:', error);
        //         setErrorMessage('Failed to update building');
        //     });

        // toast.success('Building updated successfully', {
        //     style: {
        //         backgroundColor: 'green',
        //         color: 'white',
        //         bordercolor: 'green',
        //     },
        // });
    
    };

    const handleCancelBuildingEditClick = () => {
        setEditBuildingName('');
        setEditNumberOfFloors(1);
        setEditNumberOfRooms([]);
        setEditRoomNames([]);
        setEditBuildingImage('');
        setEditPreviewImage('');
        setEditNearbyBuildings([]);
        setErrorMessage('');
        setErrorField('');
        if (inputBuildingNameRef.current) {
            inputBuildingNameRef.current.focus();
        }

        document.getElementById('edit_building_modal').close();
    };

    const handleBadgeRemove = (buildingId) => {
        setEditNearbyBuildings((prev) => prev.filter((b) => b.id !== buildingId));
    };

    const deleteModal = (id) => {
        const deleteModalElement = document.getElementById('delete_modal');
        deleteModalElement.showModal();

        const deleteButton = document.getElementById('delete_button');
        deleteButton.onclick = () => handleDelete(id);
    };

// =======================================================================================================================

    return (
        <div className='w-full'>

            {/* Header with Search and Add Building Button */}
            <div className='flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5'>

                {/* Search Building */}
                <div className='flex-grow w-full md:w-1/3 lg:w-1/4'>
                    <label className='input input-bordered flex items-center gap-2 w-full'>
                        <input
                            type='text'
                            className='grow p-3 text-sm w-full'
                            placeholder='Search Building'
                            value={searchBuildingValue}
                            onChange={(e) => setSearchBuildingValue(e.target.value)}
                        />
                        <IoSearch className='text-xl' />
                    </label>
                </div>

                {/* Add Building Button */}
                {editable && (
                    <div className='w-full mt-4 md:mt-0 md:w-auto'>
                        <button
                            className='btn btn-primary h-12 flex items-center justify-center w-full md:w-48'
                            onClick={() => document.getElementById('add_building_modal').showModal()}
                        >
                            Add Building <IoAdd size={20} className='ml-2' />
                        </button>
                        <dialog id='add_building_modal' className='modal'>
                            <div className='modal-box flex flex-col h-[90%] max-w-5xl overflow-hidden'>
                                <AddBuildingContainer
                                    close={() => document.getElementById('add_building_modal').close()}
                                    errorMessage={errorMessage}
                                    setErrorMessage={setErrorMessage}
                                    errorField={errorField}
                                    setErrorField={setErrorField}
                                />
                                <div className='modal-action'>
                                    <button
                                        className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
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

            {/* Building Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                {searchBuildingResult.length === 0 ? (
                    <div className='text-center text-sm col-span-full'>No Buildings Found</div>
                ) : (
                    searchBuildingResult.map((building) => (
                        <div
                            key={building.id}
                            className='card shadow-lg border border-base-content border-opacity-20 hover:shadow-xl p-4 cursor-pointer'
                        >
                            {building.image ? (
                                <img
                                    src={building.image || 'https://via.placeholder.com/150'}
                                    alt={building.name}
                                    className='h-40 w-full object-cover mb-4 rounded'
                                />
                            ) : (
                                <div className='flex justify-center rounded-md items-center w-full h-40 opacity-50'>
                                    <PiBuildingApartment size={100} />
                                </div>
                            )}
                            <h2 className='text-lg font-bold mb-2'>{building.name}</h2>
                            <div className='text-sm'>
                                {Object.entries(building.rooms || {}).map(([floorIndex, rooms]) => (
                                    <div key={floorIndex}>
                                        Floor {Number(floorIndex) + 1}: {Object.keys(rooms).length} Rooms
                                    </div>
                                ))}

                            </div>
                            {editable && (
                                <div className='flex justify-end mt-2 gap-2'>
                                    <button className='btn btn-xs btn-ghost text-blue-500' onClick={() => handleEdit(building)}>
                                        <RiEdit2Fill size={20} />
                                    </button>
                                    <button
                                        className='btn btn-xs btn-ghost text-red-500'
                                        onClick={() => deleteModal(building.custom_id)}
                                    >
                                        <RiDeleteBin7Line size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Edit Building Modal */}
             <dialog id='edit_building_modal' className='modal'>
                <div
                    className='modal-box flex flex-col h-screen w-8/12 overflow-hidden'
                    style={{
                        maxWidth: 'none',
                    }}
                >
                    <div className='shrink-0 flex gap-4 mb-4'>
                        <div className='w-3/12 mt-2 items-center flex'>
                            {editPreviewImage !== '' ? (
                                <div className='w-auto relative rounded-md'>
                                    <button
                                        className='btn btn-sm btn-circle shadow-lg btn-error absolute top-[-5px] right-[-5px]'
                                        onClick={() => {
                                            setEditBuildingImage('');
                                            setEditPreviewImage('');
                                        }}
                                    >
                                        <RiDeleteBin7Line size={20} />
                                    </button>
                                    <img src={editPreviewImage} alt='Preview' className='object-cover aspect-square' />
                                </div>
                            ) : (
                                <div className='flex justify-center rounded-md items-center w-full h-full opacity-50'>
                                    <PiBuildingApartment size={100} />
                                </div>
                            )}
                        </div>

                        <div className='w-9/12 p-2'>

                            <div className='flex items-center justify-between'>
                                <h3 className='text-xl font-bold '>Edit Building</h3>

                                <div className='flex justify-center gap-4'>
                                    <button className='btn btn-secondary' onClick={handleCancelBuildingEditClick}>
                                        Cancel
                                    </button>
                                    <button className='btn btn-primary' onClick={handleSaveBuildingEditClick}>
                                        Update Building
                                    </button>
                                </div>
                            </div>

                            <div className='text-red-500 text-right mt-2 text-sm'>
                                {errorMessage || <span className='invisible line-clamp-1'>...</span>}
                            </div>

                            <div className='divider'></div>

                            <div className='flex gap-4'>
                                <div className='w-6/12 flex flex-col gap-2'>
                                    
                                    {/* Building Name */}
                                    <div className='flex items-center text-left'>
                                        <label className='text-sm  w-9/12'>Building Name:</label>
                                        <input
                                            type='text'
                                            className={`input input-sm input-bordered w-full ${
                                                errorField === 'buildingName' ? 'border-red-500' : ''
                                            }`}
                                            value={editBuildingName}
                                            onChange={(e) => setEditBuildingName(e.target.value)}
                                            ref={inputBuildingNameRef}
                                        />
                                    </div>
                                    
                                    {/* Number of Floors */}
                                    <div className='flex items-center text-left'>
                                        <label className='text-sm  w-9/12'>Number of Floors:</label>
                                        <input
                                            type='number'
                                            className={`input input-sm input-bordered w-full ${
                                                errorField === 'floors' ? 'border-red-500' : ''
                                            }`}
                                            value={editNumberOfFloors}
                                            onChange={(e) => setEditNumberOfFloors(Math.max(1, Number(e.target.value)))}
                                            min={1}
                                        />
                                    </div>
                                    
                                    {/* Building Image */}
                                    {/* <div className=''>
                                        <div className='space-y-4'>
                                            <div>
                                                <label className='block text-sm font-medium mb-1'>Building Image:</label>
                                                <label className='form-control w-full'>
                                                    <input
                                                        type='file'
                                                        accept='image/*'
                                                        className={`file-input file-input-sm file-input-bordered w-full ${
                                                            errorField === 'buildingImage' ? 'border-red-500' : ''
                                                        }`}
                                                        onChange={handleImageUpload}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div> */}
                                </div>
                                
                                {/* Nearby Buildings */}
                                <div className='w-6/12'>
                                    <div>
                                        <label className='block text-sm text-left pl-2 mb-1'>Nearby Buildings:</label>
                                        <NearbyBuildingDropdown
                                            availableBuildings={buildings}
                                            nearbyBuildings={editNearbyBuildings}
                                            setNearbyBuildings={setEditNearbyBuildings}
                                            // currentBuildingId={editBuildingID}
                                            currentBuildingId={editBuildingCustomID}
                                        />
                                    </div>
                                    {/* <div className='flex flex-wrap gap-2 mt-3'>
                                        {editNearbyBuildings.length > 0 &&
                                            editNearbyBuildings.map((id, index) => {
                                                // const building = availableBuildings.find((b) => b.id === id);

                                                const building = buildings[id];
                                                return (
                                                    building && (
                                                        <span
                                                            key={`${building.id}-${index}`}
                                                            className='badge badge-primary gap-2 cursor-pointer'
                                                            onClick={() => handleBadgeRemove(building.id)}
                                                        >
                                                            {building.name}
                                                        </span>
                                                    )
                                                );
                                            })}
                                    </div> */}
                                </div>
                            </div>

                        </div>
                    </div>
                    
                    {/* Floors and Rooms */}
                    <div className='flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 overflow-auto'>
                        {Array.from({ length: editNumberOfFloors }, (_, floorIndex) => (
                            <div key={floorIndex} className='flex flex-col border border-base-content border-opacity-20 rounded-lg h-96 p-3 shadow-sm'>
                                <div className='flex mb-3 gap-1 items-center'>
                                    <div className='w-6/12 leading-none'>
                                        <h4 className='text-sm font-semibold'>Floor {floorIndex + 1}</h4>
                                        <span className='text-sm'>room count:</span>
                                    </div>
                                    <input
                                        type='number'
                                        className='input input-bordered input-sm w-6/12'
                                        value={editNumberOfRooms[floorIndex] || 0}
                                        onChange={(e) => handleNumberOfRoomsChange(floorIndex, e.target.value)}
                                        min={1}
                                    />
                                </div>

                                <div
                                    className='overflow-auto h-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200'
                                    style={{
                                        WebkitOverflowScrolling: 'touch',
                                    }}
                                >
                                    {Array.from(
                                        {
                                            length: editNumberOfRooms[floorIndex] || 0,
                                        },
                                        (_, roomIndex) => (
                                            <div className='flex justify-center items-center mb-1 gap-1' key={roomIndex}>
                                                <input
                                                    type='text'
                                                    className='w-9/12 input rounded-md input-sm input-bordered'
                                                    placeholder={`Room ${roomIndex + 1}`}
                                                    value={editRoomNames[floorIndex]?.[roomIndex]?.roomName || ''}
                                                    onChange={(e) => handleRoomNameChange(floorIndex, roomIndex, e.target.value)}
                                                />

                                                {/* <input
                                                        type="checkbox"
                                                        className="w-3/12 toggle toggle-sm toggle-primary"
                                                        checked={
                                                            editRoomNames[
                                                                floorIndex
                                                            ]?.[roomIndex]
                                                                ?.isAvailable ||
                                                            false
                                                        }
                                                        onChange={(e) =>
                                                            handleRoomAvailabilityChange(
                                                                floorIndex,
                                                                roomIndex
                                                            )
                                                        }
                                                    /> */}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className='modal-action'>
                    <button
                        className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'
                        onClick={() => document.getElementById('edit_building_modal').close()}
                    >
                        ✕
                    </button>
                </div>
            </dialog>

            {/* Delete Confirmation Modal */}
            <dialog id='delete_modal' className='modal modal-bottom sm:modal-middle'>
                <div className='modal-box'>
                    <h3 className='font-bold text-lg'>Confirm Delete</h3>
                    <p>Are you sure you want to delete this building?</p>
                    <div className='modal-action'>
                        <button className='btn btn-error' id='delete_button'>
                            Delete
                        </button>
                        <button className='btn btn-secondary' onClick={() => document.getElementById('delete_modal').close()}>
                            Cancel
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default RoomListContainer;
