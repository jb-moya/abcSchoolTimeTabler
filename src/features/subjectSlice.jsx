import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    STORE_NAMES,
} from "../indexedDB";
// import { toast } from "sonner";

const initialState = {
    subjects: {}, // Change from array to object
    status: "idle",
    error: null,
};

// Thunks for asynchronous operations
export const fetchSubjects = createAsyncThunk(
    "subject/fetchSubjects",
    async () => {
        const subjects = await getAllEntitiesFromDB(STORE_NAMES.SUBJECTS);
        return subjects;
    }
);

export const addSubject = createAsyncThunk(
    "subject/addSubject",
    async (subject, { dispatch }) => {
        const key = await addEntityToDB(
            STORE_NAMES.SUBJECTS,
            subject,
            "subject"
        );
        dispatch(subjectSlice.actions.addSubjectSync({ subject, id: key }));
    }
);

export const removeSubject = createAsyncThunk(
    "subject/removeSubject",
    async (subjectId, { dispatch }) => {
        await removeEntityFromDB(STORE_NAMES.SUBJECTS, subjectId);
        dispatch(subjectSlice.actions.removeSubjectSync(subjectId));
    }
);

export const subjectSlice = createSlice({
    name: "subject",
    initialState,
    reducers: {
        addSubjectSync: (state, action) => {
            const subject = action.payload;
            state.subjects[subject.id] = subject;
        },
        removeSubjectSync: (state, action) => {
            const subjectId = action.payload;
            delete state.subjects[subjectId];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSubjects.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchSubjects.fulfilled, (state, action) => {
                state.status = "succeeded";
                console.log("action.payload", action.payload);
                state.subjects = action.payload;
            })
            .addCase(fetchSubjects.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export const { addSubjectSync, removeSubjectSync } = subjectSlice.actions;

export default subjectSlice.reducer;
