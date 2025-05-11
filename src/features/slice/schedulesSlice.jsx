import { createSlice } from '@reduxjs/toolkit';

const schedules = createSlice({
    name: 'schedules',
    initialState: {
        schedules: {},
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const { id } = action.payload;

            const mappedObj = {
                id,
                data: action.payload.d,
                name: action.payload.n,
                status: action.payload.s,
                programsSched: action.payload.p,
                buildingsSched: action.payload.b,
                sectionsSched: action.payload.sc,
                teachersSched: action.payload.t,
                ranksSched: action.payload.r,
                departmentsSched: action.payload.dp,
                subjectsSched: action.payload.sb,
            };

            state.schedules[id] = mappedObj;
        },
        remove: (state, action) => {
            delete state.schedules[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = schedules.actions;
export default schedules.reducer;
