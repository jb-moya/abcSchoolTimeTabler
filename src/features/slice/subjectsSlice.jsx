import { createSlice } from '@reduxjs/toolkit';

const subjects = createSlice({
    name: 'subjects',
    initialState: {
        subjects: {},
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const { id } = action.payload;
            state.subjects[id] = action.payload;
        },
        remove: (state, action) => {
            delete state.subjects[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = subjects.actions;
export default subjects.reducer;
