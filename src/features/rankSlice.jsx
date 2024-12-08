import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    editEntityFromDB,
    STORE_NAMES,
} from "../indexedDB";

const initialState = {
    ranks: {}, // Change from array to object
    status: "idle",
    error: null,
};

// Thunks for asynchronous operations
export const fetchRanks = createAsyncThunk(
    "rank/fetchRanks",
    async () => {
        const ranks = await getAllEntitiesFromDB(STORE_NAMES.RANKS);
        return ranks;
    }
);

export const addRank = createAsyncThunk(
    "rank/addRank",
    async (rank, { dispatch }) => {
        const key = await addEntityToDB(STORE_NAMES.RANKS, rank);
        dispatch(rankSlice.actions.addRankSync({ ...rank, id: key }));
    }
);

export const editRank = createAsyncThunk(
    "rank/editRank",
    async ({ rankId, updatedRank }, { dispatch }) => {
        await editEntityFromDB(STORE_NAMES.RANKS, rankId, updatedRank);
        dispatch(
            rankSlice.actions.editRankSync({
                id: rankId,
                ...updatedRank,
            })
        );
    }
);

export const removeRank = createAsyncThunk(
    "rank/removeRank",
    async (rankId, { dispatch, rejectWithValue }) => {
        try {
            const success = await removeEntityFromDB(
                STORE_NAMES.RANKSS,
                rankId
            );
            if (success) {
                dispatch(rankSlice.actions.removeRankSync(rankId));
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const rankSlice = createSlice({
    name: "rank",
    initialState,
    reducers: {
        addRankSync: (state, action) => {
            const rank = action.payload;
            state.ranks[rank.id] = rank;
        },
        editRankSync: (state, action) => {
            const updatedRank = action.payload;
            state.ranks[updatedRank.id] = {
                ...state.ranks[updatedRank.id],
                ...updatedRank,
            };
        },
        removeRankSync: (state, action) => {
            const rankId = action.payload;
            delete state.ranks[rankId];
        },
        setStatusIdle: (state) => {
            state.status = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRanks.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchRanks.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.ranks = action.payload;
            })
            .addCase(fetchRanks.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

// Action creators are generated for each case reducer function
export const { addRankSync, editRankSync, removeRankSync, setStatusIdle: setRankStatusIdle } =
    rankSlice.actions;

export default rankSlice.reducer;
