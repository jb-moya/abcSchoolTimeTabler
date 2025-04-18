
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

            const normalizedScheds = action.payload.at.map((sched) => ({
                name: sched.n,
                subject: sched.su,
                duration: sched.d,
                frequency: sched.f,
                shown: sched.sh,
                time: sched.t,
            }))

            const mappedObj = {
                id,
                teacher: action.payload.t,
                rank: action.payload.r,
                department: action.payload.d,
                subjects: action.payload.s,
                yearLevels: action.payload.y,
                additionalTeacherScheds: normalizedScheds,
            };

            state.teachers[id] = mappedObj;
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
