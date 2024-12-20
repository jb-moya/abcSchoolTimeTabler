import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RiEdit2Fill, RiDeleteBin7Line } from 'react-icons/ri';
import { useDispatch } from 'react-redux';

import {
  fetchBuildings,
  addBuilding,
  editBuilding,
  removeBuilding,
} from '@features/buildingSlice';

import { IoAdd, IoSearch, IoTrashBin } from 'react-icons/io5';
import debounce from 'debounce';
import { toast } from "sonner";
import NearbyBuildingDropdown from './nearbyBuildingDropdown';

const AddBuildingContainer = ({
  close,
  setErrorMessage,
  setErrorField,
  errorMessage,
  errorField,
}) => {

  const dispatch = useDispatch();
  const inputBuildingNameRef = useRef();
  const fileInputRef = useRef(null);

  const [buildingName, setBuildingName] = useState("");
  const [numberOfFloors, setNumberOfFloors] = useState(1);
  const [numberOfRooms, setNumberOfRooms] = useState([]);
  const [roomNames, setRoomNames] = useState([]);
  const [buildingImage, setBuildingImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [nearbyBuildings, setNearbyBuildings] = useState([]);

  const availableBuildings = useSelector((state) =>
    Object.values(state.building.buildings)
  );

  useEffect(() => {
    dispatch(fetchBuildings());
  }, [dispatch]);

  useEffect(() => {
    if (!close) {
      setErrorMessage("");
      setErrorField("");
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
      Array.from({ length: numberOfFloors }, (_, i) => prev[i] || [])
    );
  }, [numberOfFloors]);


  const handleNumberOfRoomsChange = (floorIndex, value) => {
    const roomsCount = Math.max(1, Number(value)); // Ensure no negative values
    const updatedRooms = [...numberOfRooms];
    updatedRooms[floorIndex] = roomsCount;
    setNumberOfRooms(updatedRooms);

    // Adjust roomNames for the new number of rooms
    const updatedRoomNames = [...roomNames];
    updatedRoomNames[floorIndex] = Array.from({ length: roomsCount }, (_, i) =>
      updatedRoomNames[floorIndex]?.[i] || ""
    );
    setRoomNames(updatedRoomNames);
  };

  const handleRoomNameChange = (floorIndex, roomIndex, value) => {
    const updatedRoomNames = [...roomNames];
    if (!updatedRoomNames[floorIndex]) updatedRoomNames[floorIndex] = [];
    updatedRoomNames[floorIndex][roomIndex] = value;
    setRoomNames(updatedRoomNames);
  };


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBuildingImage(reader.result);  // Save the Base64 string of the image
        setPreviewImage(reader.result);   // For previewing the image
      };
      reader.readAsDataURL(file);  // Read file as Base64 string
    } else {
      setBuildingImage(null);  // Reset file name if no file is selected
      setPreviewImage(null);   // Reset preview if no file is selected
    }
  };

  // const handleBadgeRemove = (buildingId) => {
  //   setNearbyBuildings((prev) => prev.filter((b) => b.id !== buildingId));
  // };

  const handleReset = () => {
    setBuildingImage(null);
    setBuildingName("");
    setNumberOfFloors(1);
    setNumberOfRooms([]);
    setRoomNames([]);
    setBuildingImage(null);
    setPreviewImage(null);
    setNearbyBuildings([]);
    setErrorMessage("");
    setErrorField("");
    if (inputBuildingNameRef.current) {
      inputBuildingNameRef.current.focus();
    }
  };

  const 
  handleAddBuilding = () => {
    // Check if building name is empty
    if (!buildingName.trim()) {
      setErrorMessage("Building name cannot be empty");
      setErrorField("buildingName");
      return;
    }
  
    // Check for duplicate building names
    const isDuplicateName = availableBuildings.some((availableBuildings) => availableBuildings.name === buildingName.trim());
    if (isDuplicateName) {
      setErrorMessage("Building name must be unique");
      setErrorField("buildingName");
      return;
    }
  
    // Check if there is at least one floor and one room
    if (numberOfFloors < 1 || roomNames.length < 1) {
      setErrorMessage("There must be at least one floor and one room");
      setErrorField("floorsAndRooms");
      return;
    }
  
    // Check if room names are valid (not empty or spaces)
    const hasEmptyRoomNames = roomNames.some(
      (floorRooms) =>
        floorRooms.length === 0 || floorRooms.some((room) => !room.trim())
    );
    if (hasEmptyRoomNames) {
      setErrorMessage("Room names cannot be empty");
      setErrorField("roomNames");
      return;
    }
  
    // Check if there is a building image
    if (!buildingImage) {
      setErrorMessage("Please upload a building image");
      setErrorField("buildingImage");
      return;
    }
  
    // Check if there are at least three nearby buildings
    if (nearbyBuildings.length > 3 && availableBuildings.length == 0) {
      setErrorMessage("Please select at least three nearby buildings");
      setErrorField("nearbyBuildings");
      return;
    }
  
    // Prepare building data for submission
    const buildingData = {
      name: buildingName,
      floors: numberOfFloors,
      rooms: roomNames,
      image: buildingImage, // Base64 string
      nearbyBuildings: nearbyBuildings.map((building) => ({
        id: building.id,
        name: building.name,
      })),
    };
  
    // Dispatch the action to add the building
    dispatch(addBuilding(buildingData));
    
    toast.success('Building added successfully', {
      style: {
          backgroundColor: 'green',
          color: 'white',
          bordercolor: 'green',
      },
  });

    // Reset form and close modal
    handleReset();
    document.getElementById("add_building_modal").close();
  };
  

  return (
    <div className="p-4">

      <h3 className="text-xl font-bold text-center mb-4">Add New Building</h3>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Building Name:</label>
          <input
            type="text"
            className={`input input-bordered w-full ${errorField === "buildingName" ? "border-red-500" : ""
              }`}
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            ref={inputBuildingNameRef}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Number of Floors:</label>
          <input
            type="number"
            className={`input input-bordered w-full ${errorField === "floors" ? "border-red-500" : ""
              }`}
            value={numberOfFloors}
            onChange={(e) => setNumberOfFloors(Math.max(1, Number(e.target.value)))}
            min={1}
          />
        </div>
      </div>

      <hr className='my-5'></hr>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: numberOfFloors }, (_, floorIndex) => (
          <div
            key={floorIndex}
            className="border rounded-lg p-3 bg-gray-50 shadow-sm"
          >
            <h4 className="text-sm font-semibold mb-2">Floor {floorIndex + 1}:</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Number of Rooms:</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={numberOfRooms[floorIndex] || 0}
                onChange={(e) => handleNumberOfRoomsChange(floorIndex, e.target.value)}
                min={1}
              />
            </div>

            <div
              className="overflow-y-auto max-h-28 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {Array.from({ length: numberOfRooms[floorIndex] || 0 }, (_, roomIndex) => (
                <input
                  key={roomIndex}
                  type="text"
                  className="input input-sm input-bordered w-full mb-2"
                  placeholder={`Room ${roomIndex + 1}`}
                  value={roomNames[floorIndex]?.[roomIndex] || ""}
                  onChange={(e) =>
                    handleRoomNameChange(floorIndex, roomIndex, e.target.value)
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <hr className='my-5'></hr>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Building Image:</label>
            <label className="form-control w-full">
                <input
                  ref={fileInputRef} // Reference for resetting input
                  type="file"
                  accept="image/jpeg, image/png, image/jpg"
                  className={`file-input file-input-bordered w-full ${
                    errorField === "buildingImage" ? "border-red-500" : ""
                  }`}
                  onChange={handleImageUpload} // Call image upload handler
                />
              </label>
            {previewImage && (
              <div>
                <img
                  src={previewImage}
                  alt="Preview"
                  className="mt-4 h-40 object-cover rounded-md"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nearby Buildings:</label>
            <NearbyBuildingDropdown
              availableBuildings={availableBuildings} // Full list of available buildings
              nearbyBuildings={nearbyBuildings} // Current state for selected buildings
              setNearbyBuildings={setNearbyBuildings} // Setter function to update selected buildings
            />
          </div>
        </div>
      </div>

      <hr className='my-5'></hr>

      {errorMessage && (
        <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
      )}

      <div className="flex justify-center gap-4">
        <button className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
        <button className="btn btn-primary" onClick={handleAddBuilding}>
          Add Building
        </button>
      </div>
    </div>
  );
};

const RoomListContainer = ({ editable = false }) => {
  const dispatch = useDispatch();
  const { buildings, status: buildingStatus } = useSelector((state) => state.building);

  const availableBuildings = useSelector((state) =>
    Object.values(state.building.buildings)
  );

  const inputBuildingNameRef = useRef();

  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState("");

  const [editBuildingID, setEditBuildingID] = useState(``);
  const [editBuildingName, setEditBuildingName] = useState("");
  const [editNumberOfFloors, setEditNumberOfFloors] = useState(1);
  const [editNumberOfRooms, setEditNumberOfRooms] = useState([]);
  const [editRoomNames, setEditRoomNames] = useState([]);
  const [editBuildingImage, setEditBuildingImage] = useState(null);
  const [editPreviewImage, setEditPreviewImage] = useState(null);
  const [editNearbyBuildings, setEditNearbyBuildings] = useState([]);

  const [searchBuildingValue, setSearchBuildingValue] = useState("");
  const [searchBuildingResult, setSearchBuildingResult] = useState([]);


  const handleClose = () => {
    const modal = document.getElementById("add_building_modal");
    if (modal) {
      modal.close();
      setErrorMessage("");
      setErrorField("");
    }
  };

  const debouncedSearch = useCallback(
    debounce((searchValue, buildings) => {
      const lowerCaseSearchValue = searchValue.toLowerCase();
      setSearchBuildingResult(
        Object.values(buildings).filter((building) => {
          // Search by building name or room names
          const nameMatch = building.name.toLowerCase().includes(lowerCaseSearchValue);
          const roomMatch = building.rooms.some((floor) =>
            floor.some((room) => room.toLowerCase().includes(lowerCaseSearchValue))
          );
          return nameMatch || roomMatch;
        })
      );
    }, 300),
    []
  );

  useEffect(() => {
    if (buildingStatus === "idle") {
      dispatch(fetchBuildings());
    }
  }, [buildingStatus, dispatch]);

  useEffect(() => {
    debouncedSearch(searchBuildingValue, buildings);
  }, [searchBuildingValue, buildings, debouncedSearch]);

  useEffect(() => {
    setSearchBuildingResult(Object.values(buildings));
  }, [buildings]);

  const handleDelete = (id) => {
    dispatch(removeBuilding(id))
    .then(() => {
      // Remove building from local state immediately
      setSearchBuildingResult((prevResults) =>
        prevResults.filter((building) => building.id !== id)
      );
      
      setEditNearbyBuildings([]);
      
      // Dispatch action to refetch available buildings from the store
      dispatch(fetchBuildings()); // Assuming you have this action to fetch the buildings.

      // Close the modal
      document.getElementById("delete_modal").close();

      // Optionally, show success toast
      toast.success("Building deleted successfully.");
    })
    .catch((error) => {
      console.error("Error deleting building:", error);
      toast.error("Failed to delete building.");
    });
  };

  useEffect(() => {
    setEditNumberOfRooms((prev) =>
      Array.from({ length: editNumberOfFloors }, (_, i) => prev[i] || 0)
    );
    setEditRoomNames((prev) =>
      Array.from({ length: editNumberOfFloors }, (_, i) => prev[i] || [])
    );
  }, [editNumberOfFloors]);
  const handleRoomNameChange = (floorIndex, roomIndex, value) => {
    const updatedRoomNames = [...editRoomNames];
    if (!updatedRoomNames[floorIndex]) updatedRoomNames[floorIndex] = [];
    updatedRoomNames[floorIndex][roomIndex] = value;
    setEditRoomNames(updatedRoomNames);
  };


  const handleNumberOfRoomsChange = (floorIndex, value) => {
    const count = Math.max(0, Number(value));
    const updatedNumberOfRooms = [...editNumberOfRooms];

    updatedNumberOfRooms[floorIndex] = count;
    setEditNumberOfRooms(updatedNumberOfRooms);

    const updatedRoomNames = [...editRoomNames];
    updatedRoomNames[floorIndex] = Array.from(
      { length: count },
      (_, i) => updatedRoomNames[floorIndex]?.[i] || ""
    );
    setEditRoomNames(updatedRoomNames);
  };


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        alert("Only JPEG and PNG files are allowed.");
        e.target.value = null; // Reset the file input
        setEditBuildingImage(null);
        setEditPreviewImage(null);
        return;
      }
  
      // Validate file size (example: max 2MB)
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeInBytes) {
        alert("File size exceeds the 2MB limit.");
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

    setEditBuildingID(building.id);
    setEditBuildingName(building.name || "");
    setEditNumberOfFloors(building.floors || 1);

    // Ensure rooms are correctly mapped for editing
    const roomCounts = building.rooms?.map((roomGroup) => roomGroup.length) || [];
    setEditNumberOfRooms(roomCounts);

    const roomNames = building.rooms?.map((roomGroup) => [...roomGroup]) || [];
    setEditRoomNames(roomNames);

    setEditBuildingImage(building.image || null);
    setEditPreviewImage(building.image || null);

    setEditNearbyBuildings(building.nearbyBuildings || []);

    // Open modal
    document.getElementById("edit_building_modal").showModal();
  };

  useEffect(() => {
    console.log("Name: ", editBuildingName);
    console.log("Floors: ", editNumberOfFloors);
    console.log("Rooms: ", editNumberOfRooms);
    console.log("Room Names: ", editRoomNames);
    console.log("Building Images: ", editBuildingImage);
    console.log("Nearby Buildings: ", editNearbyBuildings);
    console.log("Preview Image:", editPreviewImage);
  }, [
    editBuildingName,
    editNumberOfFloors,
    editNumberOfRooms,
    editRoomNames,
    editBuildingImage,
    editNearbyBuildings,
    editPreviewImage,
  ]);

  const handleSaveBuildingEditClick = () => {
 
    if (!editBuildingName.trim()) {
      setErrorMessage("Building name cannot be empty");
      setErrorField("buildingName");
      return;
    }
  
    // Check if the number of floors is valid
    if (editNumberOfFloors <= 0) {
      setErrorMessage("Number of floors must be greater than zero");
      setErrorField("floors");
      return;
    }
  
    // Check if each floor has at least one room
    if (editNumberOfRooms.some((rooms) => rooms <= 0)) {
      setErrorMessage("Each floor must have at least one room");
      setErrorField("rooms");
      return;
    }
  
    // Check if all room names are provided and non-empty
    const hasEmptyRoomNames = editRoomNames.some(
      (floorRooms) =>
        floorRooms.length === 0 || floorRooms.some((room) => !room.trim())
    );
    if (hasEmptyRoomNames) {
      setErrorMessage("All rooms must have names");
      setErrorField("roomNames");
      return;
    }
  
    // Check if building image is provided
    if (!editBuildingImage) {
      setErrorMessage("Building image cannot be empty");
      setErrorField("buildingImage");
      return;
    }
  
    // Prepare updated building data
    const updatedBuilding = {
      id: editBuildingID,
      name: editBuildingName,
      floors: editNumberOfFloors,
      rooms: editRoomNames,
      image: editBuildingImage,
      nearbyBuildings: editNearbyBuildings.map((building) => ({
        id: building.id,
        name: building.name,
      })),
    };
  
    // Dispatch the update action
    dispatch(editBuilding({ buildingId: editBuildingID, updatedBuilding }))
      .then(() => {
        // Close modal and clear state
        setEditBuildingName("");
        setEditNumberOfFloors(1);
        setEditNumberOfRooms([]);
        setEditRoomNames([]);
        setEditBuildingImage(null);
        setEditPreviewImage(null);
        setEditNearbyBuildings([]);
  
        document.getElementById("edit_building_modal").close();
      })
      .catch((error) => {
        console.error("Failed to update building:", error);
        setErrorMessage("Failed to update building");
      });

      toast.success('Building updated successfully', {
        style: {
            backgroundColor: 'green',
            color: 'white',
            bordercolor: 'green',
        },
    });
  };

  const handleCancelBuildingEditClick = () => {
    setEditBuildingName("");
    setEditNumberOfFloors(1);
    setEditNumberOfRooms([]);
    setEditRoomNames([]);
    setEditBuildingImage(null);
    setEditPreviewImage(null);
    setEditNearbyBuildings([]);
    setErrorMessage("");
    setErrorField("");
    if (inputBuildingNameRef.current) {
      inputBuildingNameRef.current.focus();
    }

    document.getElementById("edit_building_modal").close();
  };

  const handleBadgeRemove = (buildingId) => {
    setEditNearbyBuildings((prev) => prev.filter((b) => b.id !== buildingId));
  };

  const deleteModal = (id) => {
    const deleteModalElement = document.getElementById("delete_modal");
    deleteModalElement.showModal();

    const deleteButton = document.getElementById("delete_button");
    deleteButton.onclick = () => handleDelete(id);
  };

  return (
    <div className="w-full">
      {/* Header with Search and Add Building Button */}
      <div className="flex flex-col md:flex-row md:gap-6 justify-between items-center mb-5">
        {/* Search Building */}
        <div className="flex-grow w-full md:w-1/3 lg:w-1/4">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <input
              type="text"
              className="grow p-3 text-sm w-full"
              placeholder="Search Building"
              value={searchBuildingValue}
              onChange={(e) => setSearchBuildingValue(e.target.value)}
            />
            <IoSearch className="text-xl" />
          </label>
        </div>

        {/* Add Building Button */}
        {editable && (
          <div className="w-full mt-4 md:mt-0 md:w-auto">
            <button
              className="btn btn-primary h-12 flex items-center justify-center w-full md:w-48"
              onClick={() => document.getElementById("add_building_modal").showModal()}
            >
              Add Building <IoAdd size={20} className="ml-2" />
            </button>
            <dialog id="add_building_modal" className="modal">
              <div className="modal-box w-11/12 max-w-5xl">
                <AddBuildingContainer
                  close={() => document.getElementById("add_building_modal").close()}
                  errorMessage={errorMessage}
                  setErrorMessage={setErrorMessage}
                  errorField={errorField}
                  setErrorField={setErrorField}
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

      {/* Building Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchBuildingResult.length === 0 ? (
          <div className="text-center text-sm col-span-full">No Buildings Found</div>
        ) : (
          searchBuildingResult.map((building) => (
            <div
              key={building.id}
              className="card shadow-lg border border-gray-200 hover:shadow-xl p-4 cursor-pointer"
            >
              <img
                src={building.image || "https://via.placeholder.com/150"}
                alt={building.name}
                className="h-40 w-full object-cover mb-4 rounded"
              />
              <h2 className="text-lg font-bold mb-2">{building.name}</h2>
              <div className="text-sm">
                {building.rooms.map((rooms, floorIndex) => (
                  <div key={floorIndex}>
                    Floor {floorIndex + 1}: {rooms.length} Rooms
                  </div>
                ))}
              </div>
              {editable && (
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    className="btn btn-xs btn-ghost text-blue-500"
                    onClick={() => handleEdit(building)}
                  >
                    <RiEdit2Fill size={20} />
                  </button>
                  <button
                    className="btn btn-xs btn-ghost text-red-500"
                    onClick={() => deleteModal(building.id)}
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
      <dialog id="edit_building_modal" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <div className="p-4">

            <h3 className="text-xl font-bold text-center mb-4">Edit Building</h3>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Building Name:</label>
                <input
                  type="text"
                  className={`input input-bordered w-full ${errorField === "buildingName" ? "border-red-500" : ""
                    }`}
                  value={editBuildingName}
                  onChange={(e) => setEditBuildingName(e.target.value)}
                  ref={inputBuildingNameRef}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of Floors:</label>
                <input
                  type="number"
                  className={`input input-bordered w-full ${errorField === "floors" ? "border-red-500" : ""
                    }`}
                  value={editNumberOfFloors}
                  onChange={(e) => setEditNumberOfFloors(Math.max(1, Number(e.target.value)))}
                  min={1}
                />
              </div>
            </div>

            <hr className='my-5'></hr>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: editNumberOfFloors }, (_, floorIndex) => (
                <div
                  key={floorIndex}
                  className="border rounded-lg p-3 bg-gray-50 shadow-sm"
                >
                  <h4 className="text-sm font-semibold mb-2">Floor {floorIndex + 1}:</h4>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Number of Rooms:</label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={editNumberOfRooms[floorIndex] || 0}
                      onChange={(e) => handleNumberOfRoomsChange(floorIndex, e.target.value)}
                      min={0}
                    />
                  </div>

                  <div
                    className="overflow-y-auto max-h-28 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {Array.from({ length: editNumberOfRooms[floorIndex] || 0 }, (_, roomIndex) => (
                      <input
                        key={roomIndex}
                        type="text"
                        className="input input-sm input-bordered w-full mb-2"
                        placeholder={`Room ${roomIndex + 1}`}
                        value={editRoomNames[floorIndex]?.[roomIndex] || ""}
                        onChange={(e) =>
                          handleRoomNameChange(floorIndex, roomIndex, e.target.value)
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <hr className='my-5'></hr>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Building Image:</label>
                  <label className="form-control w-full">
                    <input
                      type="file"
                      accept="image/*"
                      className={`file-input file-input-bordered w-full ${errorField === "buildingImage" ? "border-red-500" : ""}`}
                      onChange={handleImageUpload}
                    />
                  </label>
                  {editPreviewImage && (
                    <div>
                      <img
                        src={editPreviewImage}
                        alt="Preview"
                        className="mt-4 h-40 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nearby Buildings:</label>
                  <NearbyBuildingDropdown
                        availableBuildings={availableBuildings}
                        nearbyBuildings={editNearbyBuildings}
                        setNearbyBuildings={setEditNearbyBuildings}
                        currentBuildingId={editBuildingID}
                      />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {editNearbyBuildings.length > 0 &&
                    editNearbyBuildings.map((id, index) => {
                      const building = availableBuildings.find((b) => b.id === id);
                      return (
                        building && (
                          <span
                            key={`${building.id}-${index}`}
                            className="badge badge-primary gap-2 cursor-pointer"
                            onClick={() => handleBadgeRemove(building.id)}
                          >
                            {building.name}
                          </span>
                        )
                      );
                    })}
                </div>

              </div>

            </div>

            <hr className='my-5'></hr>

            {errorMessage && (
              <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
            )}

            <div className="flex justify-center gap-4">
              <button className="btn btn-secondary" onClick={handleCancelBuildingEditClick}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveBuildingEditClick}>
                Update Building
              </button>
            </div>
          </div>
          <div className="modal-action">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => document.getElementById("edit_building_modal").close()}
            >
              ✕
            </button>
          </div>
        </div>
      </dialog>

      {/* Delete Confirmation Modal */}
      <dialog id="delete_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirm Delete</h3>
          <p>Are you sure you want to delete this building?</p>
          <div className="modal-action">
            <button className="btn btn-error" id="delete_button">
              Delete
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => document.getElementById("delete_modal").close()}
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default RoomListContainer;