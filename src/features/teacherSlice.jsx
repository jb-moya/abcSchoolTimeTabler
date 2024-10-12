import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    editEntityFromDB,
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

export const editTeacher = createAsyncThunk(
    "teacher/editTeacher",
    async ({ teacherId, updatedTeacher }, { dispatch }) => {
        await editEntityFromDB(STORE_NAMES.TEACHERS, teacherId, updatedTeacher);
        dispatch(
            teacherSlice.actions.editTeacherSync({
                id: teacherId,
                ...updatedTeacher,
            })
        );
    }
);

export const removeTeacher = createAsyncThunk(
    "teacher/removeTeacher",
    async (teacherId, { dispatch, rejectWithValue }) => {
        try {
            const success = await removeEntityFromDB(
                STORE_NAMES.TEACHERS,
                teacherId
            );
            if (success) {
                dispatch(teacherSlice.actions.removeTeacherSync(teacherId));
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
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
        editTeacherSync: (state, action) => {
            const updatedTeacher = action.payload;
            state.teachers[updatedTeacher.id] = {
                ...state.teachers[updatedTeacher.id],
                ...updatedTeacher,
            };
        },
        removeTeacherSync: (state, action) => {
            const teacherId = action.payload;
            delete state.teachers[teacherId];
        },
        setStatusIdle: (state) => {
            state.status = "idle";
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
export const { addTeacherSync, editTeacherSync, removeTeacherSync, setStatusIdle: setTeacherStatusIdle } =
    teacherSlice.actions;

export default teacherSlice.reducer;
