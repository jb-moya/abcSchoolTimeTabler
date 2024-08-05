import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    STORE_NAMES,
} from "../indexedDB";

const initialState = {
    sections: {}, // Change from array to object
    status: "idle",
    error: null,
};

export const fetchSections = createAsyncThunk(
    "section/fetchSections",
    async () => {
        const sections = await getAllEntitiesFromDB(STORE_NAMES.SECTIONS);
        return sections;
    }
);

export const addSection = createAsyncThunk(
    "section/addSection",
    async (section, { dispatch }) => {
        const key = await addEntityToDB(
            STORE_NAMES.SECTIONS,
            section,
            "section"
        );
        dispatch(sectionSlice.actions.addSectionSync({ section, id: key }));
    }
);

export const removeSection = createAsyncThunk(
    "section/removeSection",
    async (sectionId, { dispatch }) => {
        await removeEntityFromDB(STORE_NAMES.SECTIONS, sectionId);
        dispatch(sectionSlice.actions.removeSectionSync(sectionId));
    }
);

export const sectionSlice = createSlice({
    name: "section",
    initialState,
    reducers: {
        addSectionSync: (state, action) => {
            const section = action.payload;
            state.sections[section.id] = section;
        },

        removeSectionSync: (state, action) => {
            const { sectionName, subject } = action.payload;
            if (!state.sections[sectionName]) {
                state.sections[sectionName] = [];
            }
            state.sections[sectionName].push(subject);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSections.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchSections.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.sections = action.payload;
            })
            .addCase(fetchSections.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export const { addSectionSync, removeSectionSync } = sectionSlice.actions;

export default sectionSlice.reducer;
