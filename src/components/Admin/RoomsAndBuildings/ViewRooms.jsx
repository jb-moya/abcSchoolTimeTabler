import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { fetchBuildings, editBuilding } from '@features/buildingSlice';
import { fetchSections } from '@features/sectionSlice';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';

const ViewRooms = ({
    viewMode = 1,
    sectionId = 0,
    sectionModality = [],
    building = 0,
    roomDetails = {},
    setRoomDetails = () => {},
    startTime = 0,
    endTime = 0,
}) => {
    const dispatch = useDispatch();

    // ============================================================================

    const { documents: sections, loading1, error1 } = fetchDocuments('sections');

    const { documents: stringfy_buildings, loading2, error2 } = fetchDocuments('buildings');
    // console.log('stringfy_buildings: ', stringfy_buildings);

    useEffect(() => {
        try {
            const converted_buildings = Object.values(stringfy_buildings).reduce((acc, { custom_id, data, id }) => {
                const parsedData = JSON.parse(data);
                acc[custom_id] = { ...parsedData, id, custom_id }; // Include id and custom_id inside data
                return acc;
            }, {});
            console.log('converted_buildings: ', converted_buildings);

            setBuildings(converted_buildings);
        } catch (error) {
            console.error('Failed to parse buildings JSON:', error);
        }
    }, [stringfy_buildings]);

    const [buildings, setBuildings] = useState({});
    useEffect(() => {
        console.log('buildings: ', buildings);
    }, [buildings]);

    // ============================================================================

    const [buildingId, setBuildingId] = useState(-1);
    const [floorIdx, setFloorIdx] = useState(-1);
    const [roomIdx, setRoomIdx] = useState(-1);

    const [selectedStartTime, setSelectedStartTime] = useState(0);
    const [selectedEndTime, setSelectedEndTime] = useState(0);

    // For display of floors and rooms
    const [floors, setFloors] = useState({});

    useEffect(() => {
        console.log('floors: ', floors);
    }, [floors]);

    useEffect(() => {
        console.log('floorIdx: ', floorIdx);
    }, [floorIdx]);

    useEffect(() => {
        console.log('roomIdx: ', roomIdx);
    }, [roomIdx]);

    // For setting the buildingId, floorIdx, and roomIdx
    useEffect(() => {
        setBuildingId(roomDetails.buildingId);
        setFloorIdx(roomDetails.floorIdx);
        setRoomIdx(roomDetails.roomIdx);
    }, [roomDetails]);

    useEffect(() => {
        setSelectedStartTime(startTime);
    }, [startTime]);

    useEffect(() => {
        setSelectedEndTime(endTime);
    }, [endTime]);

    // ============================================================================

    const handleBuildingChange = (e) => {
        console.log(e.target.value);
        setBuildingId(parseInt(e.target.value, 10));

        setFloorIdx(-1);
        setRoomIdx(-1);
        console.log('buildings: ', buildings);
        console.log('wtf is this: ', parseInt(e.target.value, 10));
        setFloors(buildings[parseInt(e.target.value, 10)].rooms);
    };

    const handleRoomSelect = (floorIndex, roomIndex) => {
        setFloorIdx(floorIndex);
        setRoomIdx(roomIndex);
    };

    const handleConfirm = () => {
        let hasConflict = Object.values(sections).some(
            (section) =>
                section.roomDetails.buildingId === buildingId &&
                section.roomDetails.floorIdx === floorIdx &&
                section.roomDetails.roomIdx === roomIdx &&
                section.modality.some(
                    (mod, i) =>
                        mod === 1 &&
                        sectionModality[i] === 1 &&
                        selectedEndTime > section.startTime &&
                        selectedStartTime < section.endTime &&
                        (alert(`[ERR] Overlapping schedules with Section ${section.section}.`), true)
                )
        );

        if (hasConflict) return;

        setRoomDetails((prevDetails) => ({
            ...prevDetails,
            buildingId: parseInt(buildingId, 10),
            floorIdx: parseInt(floorIdx, 10),
            roomIdx: parseInt(roomIdx, 10),
        }));

        resetStates();
        document.getElementById(`view_rooms_modal_viewMode(${viewMode})_section(${sectionId})_building(${building})`).close();
    };

    const handleCancel = () => {
        resetStates();
        document.getElementById(`view_rooms_modal_viewMode(${viewMode})_section(${sectionId})_building(${building})`).close();
    };

    const resetStates = () => {
        setBuildingId(roomDetails.buildingId);
        setFloorIdx(roomDetails.floorIdx);
        setRoomIdx(roomDetails.roomIdx);

        if (buildingId === -1) {
            setFloors([]);
        } else {
            setFloors(buildings[buildingId].rooms);
        }
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DEBUG ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // useEffect(() => {
    //     console.log('tempBuildingId: ', tempBuildingId);
    //     console.log('tempFloorIdx: ', tempFloorIdx);
    //     console.log('tempRoomIdx: ', tempRoomIdx);
    // }, [tempBuildingId, tempFloorIdx, tempRoomIdx]);

    useEffect(() => {
        console.log('buildingId: ', buildingId);
        console.log('floorIdx: ', floorIdx);
        console.log('roomIdx: ', roomIdx);
    }, [roomIdx, floorIdx, buildingId]);

    useEffect(() => {
        if (buildingId !== -1 && buildings[buildingId]) {
            setFloors(buildings[buildingId].rooms);
        } else {
            setFloors([]); // Clear floors if no valid building
        }
    }, [buildingId, buildings]);
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DEBUG ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    return (
        <dialog
            id={`view_rooms_modal_viewMode(${viewMode})_section(${sectionId})_building(${building})`}
            className='modal modal-bottom sm:modal-middle'
        >
            <div className='modal-box' style={{ width: '60%', maxWidth: 'none' }}>
                <div>
                    {viewMode === 1 ? (
                        <h1 className='font-bold text-lg'>View Rooms</h1>
                    ) : (
                        <h1 className='font-bold text-lg'>Edit Rooms</h1>
                    )}
                </div>

                <div className='flex flex-col'>
                    <div className={`flex flex-wrap items-center ${viewMode === 1 ? 'justify-start' : 'justify-center'}`}>
                        <label className='w-1/3 label font-bold'>
                            <span className='label-text'>Building</span>
                        </label>

                        {viewMode !== 1 && (
                            <>
                                <label className='w-1/3 label font-bold'>
                                    <span className='label-text'>Floor</span>
                                </label>
                                <label className='w-1/3 label font-bold'>
                                    <span className='label-text'>Room</span>
                                </label>
                            </>
                        )}
                    </div>

                    <div className={`flex flex-wrap items-center ${viewMode === 1 ? 'justify-start' : 'justify-center'}`}>
                        {/* Building */}
                        <div className='w-1/3 flex items-center justify-start'>
                            <select
                                className='w-3/4 select select-bordered'
                                value={buildingId}
                                onChange={(e) => handleBuildingChange(e)}
                            >
                                <option value={-1} disabled>
                                    Select a building
                                </option>
                                {Object.keys(buildings).map((key) => (
                                    <option key={buildings[key].id} value={buildings[key].custom_id}>
                                        {buildings[key].name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {viewMode !== 1 && (
                            <>
                                {/* Floor */}
                                <div className='w-1/3 flex items-center justify-start'>
                                    <select
                                        className='w-3/4 select select-bordered'
                                        value={floorIdx}
                                        onChange={(e) => {
                                            setFloorIdx(parseInt(e.target.value, 10));
                                            setRoomIdx(-1);
                                        }}
                                    >
                                        <option value={-1} disabled>
                                            Select floor
                                        </option>
                                        {buildingId !== -1 &&
                                            buildings[buildingId]?.rooms &&
                                            Object.keys(buildings[buildingId].rooms).map((key, index) => (
                                                <option key={index} value={key}>
                                                    {parseInt(key) + 1} {/* Convert key to number and display properly */}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* Room */}
                                <div className='w-1/3 flex items-center justify-start'>
                                    <select
                                        className='w-3/4 select select-bordered'
                                        value={roomIdx}
                                        onChange={(e) => setRoomIdx(parseInt(e.target.value, 10))}
                                    >
                                        <option value={-1} disabled>
                                            Select room
                                        </option>
                                        {buildingId !== -1 &&
                                            floorIdx !== -1 &&
                                            buildings[buildingId]?.rooms[floorIdx] &&
                                            Object.entries(buildings[buildingId].rooms[floorIdx]).map(([roomIndex, room]) => (
                                                <option key={roomIndex} value={roomIndex}>
                                                    {room.roomName}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className='mt-3'>
                    {Object.entries(floors)
                        .sort(([a], [b]) => b - a) // Reverse the order to match the original `reversedFloorIndex`
                        .map(([floorIndex, rooms]) => {
                            const reversedFloorIndex = parseInt(floorIndex); // Convert key to an integer

                            return (
                                <div key={`${building}-${sectionId}-${reversedFloorIndex}`} className='mb-1 flex flex-wrap'>
                                    <h3 className='w-1/6 text-lg font-bold flex items-center justify-center'>
                                        Floor {reversedFloorIndex + 1}
                                    </h3>
                                    <div className='w-5/6 flex flex-wrap gap-2 p-2 items-center justify-center border border-gray-300 rounded-lg'>
                                        {Object.entries(rooms).map(([roomIndex, room]) => (
                                            <button
                                                key={`${building}-${sectionId}-${reversedFloorIndex}-${roomIndex}`}
                                                className={`w-1/12 h-20 max-h-20 px-4 py-2 border rounded text-sm ${
                                                    floorIdx === reversedFloorIndex && roomIdx === parseInt(roomIndex)
                                                        ? 'bg-yellow-500 text-black'
                                                        : 'bg-green-600 text-white'
                                                }`}
                                                onClick={() => handleRoomSelect(reversedFloorIndex, parseInt(roomIndex))}
                                                disabled={viewMode === 1}
                                            >
                                                {room.roomName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                </div>

                <div className='mt-4 text-center text-lg font-bold'>
                    {viewMode !== 1 && (
                        <div className='flex flex-wrap gap-2 justify-center'>
                            <button
                                className='btn btn-sm rounded-lg bg-green-600 text-white hover:bg-green-500'
                                onClick={handleConfirm}
                                disabled={buildingId === -1 || floorIdx === -1 || roomIdx === -1}
                            >
                                Confirm
                            </button>
                            <button
                                className='btn btn-sm rounded-lg bg-red-600 text-white hover:bg-red-500'
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className='modal-action w-full mt-0'>
                    <button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2' onClick={handleCancel}>
                        ✕
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default ViewRooms;
