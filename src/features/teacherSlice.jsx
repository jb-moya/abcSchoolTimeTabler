import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    STORE_NAMES,
} from "../indexedDB";

const initialState = {
    teachers: {}, // Change from array to object
    status: "idle",
    error: null,
};

// Thunks for asynchronous operations
export const fetchTeachers = createAsyncThunk(
    "teacher/fetchTeachers",
    async () => {
        const teachers = await getAllEntitiesFromDB(STORE_NAMES.TEACHERS);
        return teachers;
    }
);

export const addTeacher = createAsyncThunk(
    "teacher/addTeacher",
    async (teacher, { dispatch }) => {
        const key = await addEntityToDB(STORE_NAMES.TEACHERS, teacher);
        dispatch(teacherSlice.actions.addTeacherSync({ ...teacher, id: key }));
    }
);

export const removeTeacher = createAsyncThunk(
    "teacher/removeTeacher",
    async (teacherId, { dispatch }) => {
        await removeEntityFromDB(STORE_NAMES.TEACHERS, teacherId);
        dispatch(teacherSlice.actions.removeTeacherSync(teacherId));
    }
);

export const teacherSlice = createSlice({
    name: "teacher",
    initialState,
    reducers: {
        addTeacherSync: (state, action) => {
            const teacher = action.payload;
            state.teachers[teacher.id] = teacher;
        },

        removeTeacherSync: (state, action) => {
            const teacherId = action.payload;
            delete state.teachers[teacherId];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTeachers.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchTeachers.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.teachers = action.payload;
            })
            .addCase(fetchTeachers.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

// Action creators are generated for each case reducer function
export const { addTeacherSync, removeTeacherSync } = teacherSlice.actions;

export default teacherSlice.reducer;
