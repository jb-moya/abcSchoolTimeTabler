import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    editEntityFromDB,
    STORE_NAMES,
} from "../indexedDB";

const initialState = {
    departments: {}, // Change from array to object
    status: "idle",
    error: null,
};

export const fetchDepartments = createAsyncThunk(
    "department/fetchDepartments",
    async () => {
        const departments = await getAllEntitiesFromDB(STORE_NAMES.DEPARTMENTS);
        return departments;
    }
);

export const addDepartment = createAsyncThunk(
    "department/addDepartment",
    async (department, { dispatch }) => {
        const key = await addEntityToDB(STORE_NAMES.DEPARTMENTS, department);
        dispatch(departmentSlice.actions.addDepartmentSync({ ...department, id: key }));
    }
);

export const editDepartment = createAsyncThunk(
    "department/editDepartment",
    async ({ departmentId, updatedDepartment }, { dispatch }) => {
        await editEntityFromDB(STORE_NAMES.DEPARTMENTS, departmentId, updatedDepartment);
        dispatch(
            departmentSlice.actions.editDepartmentSync({
                id: departmentId,
                ...updatedDepartment,
            })
        );
    }
);

export const removeDepartment = createAsyncThunk(
    "department/removeDepartment",
    async (departmentId, { dispatch, rejectWithValue }) => {
        try {
            const success = await removeEntityFromDB(
                STORE_NAMES.DEPARTMENTS,
                departmentId
            );
            if (success) {
                dispatch(departmentSlice.actions.removeDepartmentSync(departmentId));
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const departmentSlice = createSlice({
    name: "department",
    initialState,
    reducers: {
        addDepartmentSync: (state, action) => {
            const department = action.payload;
            state.departments[department.id] = department;
        },
        editDepartmentSync: (state, action) => {
            const updatedDepartment = action.payload;
            state.departments[updatedDepartment.id] = {
                ...state.departments[updatedDepartment.id],
                ...updatedDepartment,
            };
        },
        removeDepartmentSync: (state, action) => {
            const departmentId = action.payload;
            delete state.departments[departmentId];
        },
        setStatusIdle: (state) => {
            state.status = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDepartments.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchDepartments.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.departments = action.payload;
            })
            .addCase(fetchDepartments.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export const { addDepartmentSync, editDepartmentSync, removeDepartmentSync, setStatusIdle: setDepartmentStatusIdle } =
    departmentSlice.actions;

export default departmentSlice.reducer;
