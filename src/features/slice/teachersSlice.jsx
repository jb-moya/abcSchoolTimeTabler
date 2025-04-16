
import { createSlice } from '@reduxjs/toolkit';

const teachers = createSlice({
    name: 'teachers',
    initialState: {
        teachers: {},
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const { id } = action.payload;
            state.teachers[id] = action.payload;
        },
        remove: (state, action) => {
            delete state.teachers[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = teachers.actions;
export default teachers.reducer;
