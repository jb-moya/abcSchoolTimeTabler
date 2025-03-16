import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    editEntityFromDB,
    STORE_NAMES,
} from "../indexedDB";

const initialState = {
    schedules: {},
    status: "idle",
    error: null,
};

// Thunks for asynchronous operations
export const fetchScheds = createAsyncThunk(
    "sched/fetchScheds",
    async () => {
        const scheds = await getAllEntitiesFromDB(STORE_NAMES.SCHEDULES);
        return scheds;
    }
);

export const addSched = createAsyncThunk(
    "sched/addSched",
    async (sched, { dispatch }) => {
        const key = await addEntityToDB(STORE_NAMES.SCHEDULES, sched);
        dispatch(schedulesSlice.actions.addSchedSync({ ...sched, id: key }));
    }
);

export const editSched = createAsyncThunk(
    "sched/editSched",
    async ({ schedId, updatedSched }, { dispatch }) => {
        await editEntityFromDB(STORE_NAMES.SCHEDULES, schedId, updatedSched);
        dispatch(
            schedulesSlice.actions.editSchedSync({
                id: schedId,
                ...updatedSched,
            })
        );
    }
);

export const removeSched = createAsyncThunk(
    "sched/removeSched",
    async (schedId, { dispatch, rejectWithValue }) => {
        try {
            const success = await removeEntityFromDB(
                STORE_NAMES.SCHEDULES,
                schedId
            );
            if (success) {
                dispatch(schedulesSlice.actions.removeSchedSync(schedId));
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const schedulesSlice = createSlice({
    name: "schedule",
    initialState,
    reducers: {
        addSchedSync: (state, action) => {
            const sched = action.payload;
            state.schedules[sched.id] = sched;
        },
        editSchedSync: (state, action) => {
            const updatedSched = action.payload;
            state.schedules[updatedSched.id] = {
                ...state.schedules[updatedSched.id],
                ...updatedSched,
            };
        },
        removeSchedSync: (state, action) => {
            const schedId = action.payload;
            delete state.schedules[schedId];
        },
        setStatusIdle: (state) => {
            state.status = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchScheds.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchScheds.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.schedules = action.payload;
            })
            .addCase(fetchScheds.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

// Action creators are generated for each case reducer function
export const { addSchedSync, editSchedSync, removeSchedSync, setStatusIdle: setSchedStatusIdle } =
    schedulesSlice.actions;

export default schedulesSlice.reducer;
