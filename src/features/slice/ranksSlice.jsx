import { createSlice } from '@reduxjs/toolkit';

const ranks = createSlice({
    name: 'ranks',
    initialState: {
        ranks: {},
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const { id } = action.payload;
            state.ranks[id] = action.payload;
        },
        remove: (state, action) => {
            delete state.ranks[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = ranks.actions;
export default ranks.reducer;
