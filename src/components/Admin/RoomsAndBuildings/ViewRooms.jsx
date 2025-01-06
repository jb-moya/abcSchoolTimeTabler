import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { fetchBuildings, editBuilding } from '@features/buildingSlice';
import { fetchSections } from '@features/sectionSlice';

const ViewRooms = ({
    viewMode = 1,
    sectionId = 0,
    building = 0,
    roomDetails = {},
    setRoomDetails = () => {},
    startTime = 0,
    endTime = 0,
}) => {

    const dispatch = useDispatch();

// ============================================================================
    
    const { buildings, status: buildingStatus } = useSelector(
        (state) => state.building
    );

    const { sections, status: sectionStatus } = useSelector(
        (state) => state.section
    );

    useEffect(() => {
        if (buildingStatus === 'idle') {
            dispatch(fetchBuildings());
        }
    }, [buildingStatus, dispatch]);

    useEffect(() => {
        if (sectionStatus === 'idle') {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

// ============================================================================

    const [buildingId, setBuildingId] = useState(-1);
    const [floorIdx, setFloorIdx] = useState(-1);
    const [roomIdx, setRoomIdx] = useState(-1);

    const [selectedStartTime, setSelectedStartTime] = useState(0);
    const [selectedEndTime, setSelectedEndTime] = useState(0);

    // For display of floors and rooms
    const [floors, setFloors] = useState([]);

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
        setBuildingId(parseInt(e.target.value, 10));

        setFloorIdx(-1);
        setRoomIdx(-1);

        setFloors(buildings[parseInt(e.target.value, 10)].rooms);
    };

    const handleRoomSelect = (floorIndex, roomIndex) => {
        setFloorIdx(floorIndex);
        setRoomIdx(roomIndex);
    };

    const handleConfirm = () => {
        
        // updatedBuildings[buildingId].rooms[floorIdx][roomIdx].occupyingSections.push(sectionId);

        Object.entries(sections).forEach(([sectionId, section]) => {
            if (section.roomDetails.buildingId === buildingId && section.roomDetails.floorIdx === floorIdx && section.roomDetails.roomIdx === roomIdx) {
                const sectionStartTime = section.startTime;
                const sectionEndTime = section.endTime;

                if (selectedEndTime > sectionStartTime && selectedStartTime < sectionEndTime) {
                    alert(`Overlapping schedules with Section ${section.section}. Consider adjusting start time.`);
                    return;
                }
            }
        })

        // dispatch(editBuilding({ buildingId: buildingId, updatedBuilding: updatedBuildings[buildingId] }));
        
        setRoomDetails((prevDetails) => ({
            ...prevDetails,
            buildingId: parseInt(buildingId, 10),
            floorIdx: parseInt(floorIdx, 10),
            roomIdx: parseInt(roomIdx, 10),
        }))

        resetStates();
        document.getElementById(`view_rooms_modal_viewMode(${viewMode})_section(${sectionId})_building(${building})`).close()
    };

    const handleCancel = () => {
        resetStates();
        document.getElementById(`view_rooms_modal_viewMode(${viewMode})_section(${sectionId})_building(${building})`).close()
    };

    const resetStates = () => {
        setBuildingId(roomDetails.buildingId);
        setFloorIdx(roomDetails.floorIdx);
        setRoomIdx(roomDetails.roomIdx);

        if (buildingId === - 1) {
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
            <div
                className='modal-box'
                style={{ width: '60%', maxWidth: 'none' }}
            >
               <div>
                    {
                        viewMode === 1 
                            ? (
                                <h1 className='font-bold text-lg'>
                                    View Rooms
                                </h1>
                            ) 
                            : (
                                <h1 className='font-bold text-lg'>
                                    Edit Rooms
                                </h1>
                            )
                    }
                </div>

                <div className='flex flex-col'>

                    <div className={`flex flex-wrap items-center ${viewMode === 1 ? 'justify-start' : 'justify-center'}`}>
                        <label className="w-1/3 label font-bold">
                            <span className="label-text">Building</span>    
                        </label>

                        {
                            viewMode !== 1 &&
                            (   
                                <>
                                    <label className="w-1/3 label font-bold">
                                        <span className="label-text">Floor</span>    
                                    </label>
                                    <label className="w-1/3 label font-bold">
                                        <span className="label-text">Room</span>    
                                    </label>
                                </> 
                            )
                        }

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
                                    <option key={buildings[key].id} value={buildings[key].id}>
                                        {buildings[key].name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {
                            viewMode !== 1 &&
                            (
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
                                            {buildingId !== -1 
                                                && buildings[buildingId]?.rooms.map((_, index) => (
                                                <option key={index} value={index}>
                                                    {index + 1}
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
                                            {buildingId !== -1 
                                                && floorIdx !== -1 
                                                    && buildings[buildingId]?.rooms[floorIdx].map((_, index) => (
                                                <option key={index} value={index}>
                                                    {buildings[buildingId]?.rooms[floorIdx][index].roomName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )
                        }

                        
                    </div>
                </div>
                       
                <div 
                    className="mt-3"
                >
                    {floors.map((rooms, floorIndex) => {
                        const reversedFloorIndex = floors.length - 1 - floorIndex;

                        return (
                            <div
                                key={`${building}-${sectionId}-${reversedFloorIndex}`}
                                className="mb-1 flex flex-wrap"
                            >
                                <h3 className="w-1/6 text-lg font-bold flex items-center justify-center">
                                    Floor {reversedFloorIndex + 1}
                                </h3>
                                <div className="w-5/6 flex flex-wrap gap-2 p-2 items-center justify-center border border-gray-300 rounded-lg">
                                    {floors[reversedFloorIndex].map((room, roomIndex) => (
                                        <button
                                            key={`${building}-${sectionId}-${reversedFloorIndex}-${roomIndex}`}
                                            className={`w-1/12 h-20 max-h-20 px-4 py-2 border rounded text-sm`}
                                            onClick={() => handleRoomSelect(reversedFloorIndex, roomIndex)}
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

                <div className="mt-4 text-center text-lg font-bold">
                    {viewMode !== 1 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            <button
                                className="btn btn-sm rounded-lg bg-green-600 text-white hover:bg-green-500"
                                onClick={handleConfirm}
                                disabled={buildingId === -1 || floorIdx === -1 || roomIdx === -1}
                            >
                                Confirm
                            </button>
                            <button
                                className="btn btn-sm rounded-lg bg-red-600 text-white hover:bg-red-500"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className="modal-action w-full mt-0">
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        onClick={handleCancel}
                    >
                        ✕
                    </button>
                </div>

            </div>
        </dialog>
    );

};

export default ViewRooms;