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

            const mappedObj = {
                id,
                name: action.payload.n,
                head: action.payload.h,
            };

            state.departments[id] = mappedObj;
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
