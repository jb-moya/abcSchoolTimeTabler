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

            const mappedObj = {
                id,
                subject: action.payload.s,
                classDuration: action.payload.cd,
                weeklyMinutes: action.payload.wm,
            };

            state.subjects[id] = mappedObj;
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
