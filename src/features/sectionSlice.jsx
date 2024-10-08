import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    editEntityFromDB,
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
        const key = await addEntityToDB(STORE_NAMES.SECTIONS, section);
        dispatch(sectionSlice.actions.addSectionSync({ ...section, id: key }));
    }
);

export const editSection = createAsyncThunk(
    "section/editSection",
    async ({ sectionId, updatedSection }, { dispatch }) => {
        await editEntityFromDB(STORE_NAMES.SECTIONS, sectionId, updatedSection);
        dispatch(
            sectionSlice.actions.editSectionSync({
                id: sectionId,
                ...updatedSection,
            })
        );
    }
);

export const removeSection = createAsyncThunk(
    "section/removeSection",
    async (sectionId, { dispatch, rejectWithValue }) => {
        try {
            const success = await removeEntityFromDB(
                STORE_NAMES.SECTIONS,
                sectionId
            );
            if (success) {
                dispatch(sectionSlice.actions.removeSectionSync(sectionId));
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
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
        editSectionSync: (state, action) => {
            const updatedSection = action.payload;
            state.sections[updatedSection.id] = {
                ...state.sections[updatedSection.id],
                ...updatedSection,
            };
        },
        removeSectionSync: (state, action) => {
            const sectionId = action.payload;
            delete state.sections[sectionId];
        },
        setStatusIdle: (state) => {
            state.status = "idle";
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

export const { addSectionSync, editSectionSync, removeSectionSync, setStatusIdle: setSectionStatusIdle } =
    sectionSlice.actions;

export default sectionSlice.reducer;
