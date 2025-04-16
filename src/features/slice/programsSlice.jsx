import { createSlice } from '@reduxjs/toolkit';

const programs = createSlice({
    name: 'programs',
    initialState: {
        programs: {},
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const { id } = action.payload;
            state.programs[id] = action.payload;
        },
        remove: (state, action) => {
            delete state.programs[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = programs.actions;
export default programs.reducer;
