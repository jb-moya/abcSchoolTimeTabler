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
import { filterObject } from '@utils/filterObject';
import escapeRegExp from '@utils/escapeRegExp';
import { toast } from "sonner";
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
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

  const handleRoomNameChange = (floorIndex, roomIndex, value) => {
    const updatedRoomNames = [...roomNames];
    updatedRoomNames[floorIndex][roomIndex] = value;
    setRoomNames(updatedRoomNames);
  };

  const handleNumberOfRoomsChange = (floorIndex, value) => {
    const count = Math.max(0, Number(value));
    const updatedNumberOfRooms = [...numberOfRooms];

    updatedNumberOfRooms[floorIndex] = count;
    setNumberOfRooms(updatedNumberOfRooms);

    const updatedRoomNames = [...roomNames];
    updatedRoomNames[floorIndex] = Array.from(
      { length: count },
      (_, i) => updatedRoomNames[floorIndex]?.[i] || ""
    );
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

  // const handleNearbyBuildingSelect = (e) => {
  //   const selectedId = e.target.value;
  //   if (!selectedId) return;

  //   if (nearbyBuildings.some((b) => b.id === selectedId)) {
  //     toast.error("Building already selected!");
  //     return;
  //   }

  //   if (nearbyBuildings.length >= 3) {
  //     setErrorMessage("You can select up to 3 nearby buildings");
  //     setErrorField("nearbyBuildings");
  //     return;
  //   }

  //   const selectedBuilding = availableBuildings.find(
  //     (building) => building.id === selectedId
  //   );

  //   if (selectedBuilding) {
  //     setNearbyBuildings([...nearbyBuildings, selectedBuilding]);
  //     setErrorMessage("");
  //     setErrorField("");
  //   }
  // };

  const handleBadgeRemove = (buildingId) => {
    setNearbyBuildings((prev) => prev.filter((b) => b.id !== buildingId));
  };

  const handleReset = () => {
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

  const handleAddBuilding = () => {
    if (!buildingName.trim()) {
      setErrorMessage("Building name cannot be empty");
      setErrorField("buildingName");
      return;
    }
    if (
      roomNames.some(
        (floorRooms) =>
          floorRooms.length === 0 || floorRooms.some((room) => !room.trim())
      )
    ) {
      setErrorMessage("Room names cannot be empty");
      setErrorField("roomNames");
      return;
    }
    // if (nearbyBuildings.length === 0) {
    //   setErrorMessage("Please select at least one nearby building");
    //   setErrorField("nearbyBuildings");
    //   return;
    // }
    if (!buildingImage) {
      setErrorMessage("Please upload a building image");
      setErrorField("buildingImage");
      return;
    }

    const buildingData = {
      name: buildingName,
      floors: numberOfFloors,
      rooms: roomNames,
      image: buildingImage, // Base64 string
      nearbyBuildings: nearbyBuildings.map((b) => b.id),
    };

    dispatch(addBuilding(buildingData));

    toast.success("Building added successfully!");

    handleReset();
    close();
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
                min={0}
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
            type="file"
            accept="image/*"
            className={`file-input file-input-bordered w-full ${errorField === "buildingImage" ? "border-red-500" : ""}`}
            onChange={handleImageUpload}
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
        availableBuildings={availableBuildings}
        nearbyBuildings={nearbyBuildings}
        setNearbyBuildings={setNearbyBuildings}
      />
    </div>
    <div className="flex flex-wrap gap-2 mt-3">
      {nearbyBuildings.map((building) => (
        <span
          key={building.id}
          className="badge badge-primary gap-2 cursor-pointer"
          onClick={() => handleBadgeRemove(building.id)}
        >
          {building.name}
        </span>
      ))}
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

  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState("");

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
        setSearchBuildingResult((prevResults) => prevResults.filter((building) => building.id !== id));
        document.getElementById("delete_modal").close();
        // toast.success("Building deleted successfully.");
      })
      .catch((error) => {
        console.error("Error deleting building:", error);
        toast.error("Failed to delete building.");
      });
  };
  

  const handleEdit = (building) => {
    console.log("Building" , building);

    setEditBuildingName(building.name);
    setEditNumberOfFloors(building.floors);

    setEditNumberOfRooms(building.rooms.map((roomGroup) => roomGroup.length));
    setEditRoomNames(building.rooms.map((roomGroup) => [...roomGroup]));

    // setEditNumberOfRooms(building.rooms);

    // setEditRoomNames(building.roomNames);
    setEditBuildingImage(building.image);
    setEditPreviewImage(building.image);
    setEditNearbyBuildings(building.nearbyBuildings);
  };

  useEffect(() => {
    console.log("Name: ", editBuildingName);
    console.log("Floors: ", editNumberOfFloors);
    console.log("Rooms: ", editNumberOfRooms);
    console.log("Room Names: ", editRoomNames);
    console.log("Building Images: ", editBuildingImage);
    console.log("Nearby Buildings: ", editNearbyBuildings);
    console.log("Preview Image:", editPreviewImage);

  }, [editBuildingName, editNumberOfFloors, editNumberOfRooms, editRoomNames, editBuildingImage, editNearbyBuildings ,editPreviewImage ])

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
      {/* {editBuildingId && (
        <dialog id="edit_building_modal" className="modal">
          <div className="modal-box w-11/12 max-w-5xl">
            <AddBuildingContainer
              close={() => document.getElementById("edit_building_modal").close()}
              buildingId={editBuildingId}
              editMode
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              errorField={errorField}
              setErrorField={setErrorField}
            />
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
      )} */}

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