import { createSlice } from '@reduxjs/toolkit';

const sections = createSlice({
    name: 'sections',
    initialState: {
        sections: {},
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const { id } = action.payload;
            state.sections[id] = action.payload;
        },
        remove: (state, action) => {
            delete state.sections[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = sections.actions;
export default sections.reducer;
