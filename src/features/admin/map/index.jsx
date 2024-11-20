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
                onClick={closePopup} // Close popup when clicking outside
              >
                <div
                  className="bg-white p-6 rounded shadow-lg"
                  onClick={(e) => e.stopPropagation()} // Prevent click on popup from closing it
                >
                  <p className="text-lg font-semibold">
                    Available rooms for {selectedBuilding?.name} will be displayed here.
                  </p>
                  <button
                    className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-focus transition-colors"
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
