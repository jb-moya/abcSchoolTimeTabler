import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    editEntityFromDB,
    STORE_NAMES,
} from "../indexedDB";

const initialState = {
    buildings: {}, // Change from array to object
    status: "idle",
    error: null,
};

export const fetchBuildings = createAsyncThunk(
    "building/fetchBuildings",
    async () => {
        const buildings= await getAllEntitiesFromDB(STORE_NAMES.BUILDINGS);
        return buildings;
    }
);

export const addBuilding = createAsyncThunk(
    "building/addBuilding",
    async (building, { dispatch }) => {
        const key = await addEntityToDB(STORE_NAMES.BUILDINGS, building);
        dispatch(buildingSlice.actions.addBuildingSync({ ...building, id: key }));
    }
);

export const editBuilding = createAsyncThunk(
    "building/editBuilding",
    async ({ buildingId, updatedBuilding }, { dispatch }) => {
        await editEntityFromDB(STORE_NAMES.BUILDINGS, buildingId, updatedBuilding);
        dispatch(
            buildingSlice.actions.editBuildingSync({
                id: buildingId,
                ...updatedBuilding,
            })
        );
    }
);

export const removeBuilding = createAsyncThunk(
    "building/removeBuilding",
    async (buildingId, { dispatch, rejectWithValue }) => {
        try {
            const success = await removeEntityFromDB(
                STORE_NAMES.BUILDINGS,
                buildingId
            );
            if (success) {
                dispatch(buildingSlice.actions.removeBuildingSync(buildingId));
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const buildingSlice = createSlice({
    name: "building",
    initialState,
    reducers: {
        addBuildingSync: (state, action) => {
            const building = action.payload;
            state.buildings[building.id] = building;
        },
        editBuildingSync: (state, action) => {
            const updatedBuilding = action.payload;
            state.buildings[updatedBuilding.id] = {
                ...state.buildings[updatedBuilding.id],
                ...updatedBuilding,
            };
        },
        removeBuildingBuildingSync: (state, action) => {
            const buildingId = action.payload;
            delete state.buildings[buildingId];
        },
        setStatusIdle: (state) => {
            state.status = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBuildings.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchBuildings.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.buildings = action.payload;
            })
            .addCase(fetchBuildings.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export const { addBuildingSync, editBuildingSync, removeBuildingSync, setStatusIdle: setBuildingStatusIdle } =
buildingSlice.actions;

export default buildingSlice.reducer;
