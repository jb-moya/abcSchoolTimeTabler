import { createSlice } from '@reduxjs/toolkit';

const buildings = createSlice({
    name: 'buildings',
    initialState: {
        buildings: {},
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const parsedData = JSON.parse(action.payload.data);
            
            const { id } = action.payload;
            state.buildings[id] = { ...parsedData, id };
        },
        remove: (state, action) => {
            delete state.buildings[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = buildings.actions;
export default buildings.reducer;
