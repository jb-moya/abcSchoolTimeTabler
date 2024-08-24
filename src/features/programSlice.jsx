import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    editEntityFromDB,
    STORE_NAMES,
} from "../indexedDB";

const initialState = {
    programs: {}, // Change from array to object
    status: "idle",
    error: null,
};

export const fetchPrograms = createAsyncThunk(
    "program/fetchPrograms",
    async () => {
        const programs = await getAllEntitiesFromDB(STORE_NAMES.PROGRAMS);
        return programs;
    }
);

export const addProgram = createAsyncThunk(
    "program/addProgram",
    async (program, { dispatch }) => {
        const key = await addEntityToDB(STORE_NAMES.PROGRAMS, program);
        dispatch(programSlice.actions.addProgramSync({ ...program, id: key }));
    }
);

export const editProgram = createAsyncThunk(
    "program/editProgram",
    async ({ programId, updatedProgram }, { dispatch }) => {
        await editEntityFromDB(STORE_NAMES.PROGRAMS, programId, updatedProgram);
        dispatch(
            programSlice.actions.editProgramSync({
                id: programId,
                ...updatedProgram,
            })
        );
    }
);

export const removeProgram = createAsyncThunk(
    "program/removeProgram",
    async (programId, { dispatch }) => {
        await removeEntityFromDB(STORE_NAMES.PROGRAMS, programId);
        dispatch(programSlice.actions.removeProgramSync(programId));
    }
);

export const programSlice = createSlice({
    name: "program",
    initialState,
    reducers: {
        addProgramSync: (state, action) => {
            const program = action.payload;
            state.programs[program.id] = program;
        },
        editProgramSync: (state, action) => {
            const updatedProgram = action.payload;
            state.programs[updatedProgram.id] = {
                ...state.programs[updatedProgram.id],
                ...updatedProgram,
            };
        },
        removeProgramSync: (state, action) => {
            const programId = action.payload;
            delete state.programs[programId];
        },
        setStatusIdle: (state) => {
            state.status = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPrograms.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchPrograms.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.programs = action.payload;
            })
            .addCase(fetchPrograms.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export const { addProgramSync, editProgramSync, removeProgramSync, setStatusIdle: setProgramStatusIdle } =
    programSlice.actions;

export default programSlice.reducer;
