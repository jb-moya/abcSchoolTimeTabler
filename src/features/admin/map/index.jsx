import React, { useState } from "react";
import Breadcrumbs from "@components/Admin/Breadcrumbs";

function Map() {
  const links = [
    { name: "Home", href: "/" },
    // { name: 'Modify Subjects', href: '/modify-subjects' },
  ];

  // Building Representation
  const buildings = [
    { id: 1, name: "SB BLDG.", image: "/sb.jpg" },
    { id: 2, name: "GMA BLDG.", image: "/sb.jpg" },
    { id: 3, name: "LIBAN B. BLDG.", image: "/sb.jpg" },
    { id: 4, name: "TECHVOC BLDG.", image: "/sb.jpg" },
    { id: 5, name: "LIBAN AB BLDG.", image: "/sb.jpg" },
    { id: 6, name: "LIBAN B BLDG.", image: "/sb.jpg" },
    { id: 7, name: "LIBAN C BLDG.", image: "/sb.jpg" },
    { id: 8, name: "SUSANO BLDG.", image: "/sb.jpg" },
    { id: 9, name: "CASTELO BLDG.", image: "/sb.jpg" },
  ];
  //Floors of Building
  const floors = [
    { id: 1, name: 'First Floor' },
    { id: 2, name: 'Second Floor' },
    { id: 3, name: 'Third Floor' },
    { id: 4, name: 'Fourth Floor' },
  ];
  //Static Rooms
  const [newRoomName, setNewRoomName] = React.useState('')
  const rooms = [
    { id: 1, name: 'Room 101', floorId: 1, isVacant: true },
    { id: 2, name: 'Room 102', floorId: 1, isVacant: true },
    { id: 3, name: 'Room 201', floorId: 2, isVacant: true },
    { id: 4, name: 'Room 202', floorId: 2, isVacant: false },
  ];
  //Display rooms
  const getRoomsForFloor = (floorId) => {
    return rooms.filter((room) => {
      if (room.floorId !== floorId) return false; // Show all rooms
      if (filter === 'vacant') return room.isVacant; // Show vacant rooms
      if (filter === 'occupied') return !room.isVacant; // Show occupied rooms
      return true; // Show all rooms by default
    });
  };
  
  
  const [vacantRooms, setVacantRooms] = React.useState([]);

  const allocateRoom = (room) => {
    console.log(`Allocating room: ${room.name}`);
    // Add your allocation logic here
  };
  
  //Floor Selection handler
  const handleFloorSelection = (floor) => {
    if (selectedFloor?.id === floor.id) {
      setSelectedFloor(null);
      setVacantRooms([]);
    } else {
      setSelectedFloor(floor);
      const roomsForFloor = rooms.filter(
        (room) => room.floorId === floor.id && room.isVacant
      );
      setVacantRooms(roomsForFloor);
    }
  };

  
  //filter rooms
  const[filter, setFilter] = React.useState('all');

  const [selectedFloor, setSelectedFloor] = React.useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

    
  const handleSelectBuilding = (building) => {
    setSelectedBuilding(building);
  };

  const handleCheckRooms = (building) => {
    // Simulate action to check rooms
    setIsPopupVisible(true); // Show popup
  };

  const closePopup = () => {
    setIsPopupVisible(false); // Hide popup
  };

  const handleAddRoom = (e) => {
    e.preventDefault();
  
    if (newRoomName.trim() === '') {
      alert('Room name cannot be empty.');
      return;
    } else{
      alert('Room has been created')
    }
  
    const newRoom = {
      id: rooms.length + 1, // Generate a new unique ID
      name: newRoomName,
      floorId: selectedFloor.id,
      isVacant: true, // Default to vacant
    };
  
    setRooms([...rooms, newRoom]);
    setNewRoomName(''); // Clear input field
  
    // Update vacant rooms for the selected floor
    const updatedVacantRooms = rooms.filter(
      (room) => room.floorId === selectedFloor.id && room.isVacant
    );
    setVacantRooms(updatedVacantRooms);
  };
  
  //Clicking of room sched
  const handleVacancyToggle = (roomId) => {
    // Add your logic to toggle the room's vacancy status here.
    alert("Assign and Delete Function")
  };
  

  return (
    <div className="App container mx-auto px-4 mb-10">
      <Breadcrumbs title="Room Utilization" links={links} />

      {/* Main Content */}
      <div className="flex flex-col gap-4">
        <div className="card w-full bg-base-100 shadow-md">
          <div className="card-body">
            <p className="text-lg font-bold mb-4">
              Batasan Hills National Highschool Buildings
            </p>

            {/* Building Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {buildings.map((building) => (
                <div
                  key={building.id}
                  className={`card bg-base-200 shadow hover:shadow-lg cursor-pointer p-4 ${
                    selectedBuilding?.id === building.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleSelectBuilding(building)}
                >
                  <img
                    src={building.image}
                    alt={building.name}
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-center font-medium mt-2">{building.name}</p>
                </div>
              ))}
            </div>

            {/* Selected Building */}
            {selectedBuilding && (
              <div className="mt-4 p-4">
                <button
                  className="p-4 w-full bg-primary text-white rounded font-semibold hover:bg-primary-focus transition-colors"
                  onClick={() => handleCheckRooms(selectedBuilding)}
                >
                  Check Available Rooms: {selectedBuilding.name}
                </button>
              </div>
            )}

            {/* Popup */}
            {isPopupVisible && (
              <div
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                onClick={closePopup}
              >
                <div
                  className="bg-white p-6 rounded shadow-lg w-full max-w-4xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-lg font-semibold mb-4">
                    Room Management for {selectedBuilding?.name}
                  </p>

                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column: Floor selection and Add Room form */}
                    <div className="w-full md:w-1/3">
                      {/* Floor selection radio-like checkboxes */}
                      <div>
                        <p className="text-md font-medium mb-2">Select Floor:</p>
                        <div className="space-y-2">
                          {floors.map((floor, index) => (
                            <label key={index} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-primary"
                                checked={selectedFloor?.id === floor.id}
                                onChange={() => handleFloorSelection(floor)}
                              />
                              <span className="text-gray-700">{floor.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Add Room Form */}
                      {selectedFloor && (
                        <div className="mt-6">
                          <p className="text-md font-medium mb-2">Add a Room to {selectedFloor.name}:</p>
                          <form
                            className="flex flex-col space-y-2"
                            onSubmit={handleAddRoom}
                          >
                            <input
                              type="text"
                              placeholder="Room Name"
                              className="border border-gray-300 rounded p-2 w-full"
                              value={newRoomName}
                              onChange={(e) => setNewRoomName(e.target.value)}
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Add
                            </button>
                          </form>
                        </div>
                      )}
                    </div>

                    {/* Right column: Room filter and list */}
                    <div className="w-full md:w-2/3">
                      {/* Dropdown selection */}
                      <div className="mb-4">
                        <label htmlFor="room-filter" className="block text-md font-medium text-gray-700 mb-2">
                          Filter Rooms:
                        </label>
                        <select
                          id="room-filter"
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          className="block w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-primary focus:border-primary"
                        >
                          <option value="all">View all</option>
                          <option value="vacant">Vacant</option>
                          <option value="occupied">Occupied</option>
                        </select>
                      </div>

                      {/* Filtered Rooms Section */}
                      {selectedFloor && (
                        <div>
                          <p className="text-md font-medium mb-2">Rooms on {selectedFloor.name}:</p>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {getRoomsForFloor(selectedFloor.id).map((room, index) => (
                              <div
                                key={index}
                                className={`flex justify-between items-center p-2 rounded shadow ${
                                  room.isVacant ? 'bg-green-100' : 'bg-red-100'
                                }`}
                              >
                                <span className="text-gray-700">{room.name}</span>
                                <button
                                  onClick={() => handleVacancyToggle(room.id)}
                                  className={`text-sm font-medium px-3 py-1 rounded ${
                                    room.isVacant
                                      ? 'bg-green-500 text-white hover:bg-green-600'
                                      : 'bg-red-500 text-white hover:bg-red-600'
                                  }`}
                                >
                                  {room.isVacant ? 'Vacant' : 'Occupied'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="mt-6 px-4 py-2 bg-primary text-white rounded hover:bg-primary-focus transition-colors"
                    onClick={closePopup}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Map;