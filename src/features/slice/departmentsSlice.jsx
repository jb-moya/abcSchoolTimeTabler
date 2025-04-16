import { createSlice } from '@reduxjs/toolkit';

const departments = createSlice({
    name: 'departments',
    initialState: {
        departments: {},
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const { id } = action.payload;
            state.departments[id] = action.payload;
        },
        remove: (state, action) => {
            delete state.departments[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = departments.actions;
export default departments.reducer;
