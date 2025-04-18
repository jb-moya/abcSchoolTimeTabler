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

            const normalizedScheds = action.payload.as.map((sched) => ({
                name: sched.n,
                subject: sched.su,
                duration: sched.d,
                frequency: sched.f,
                shown: sched.sh,
            }))

            const mappedObj = {
                id,
                teacher: action.payload.t,
                program: action.payload.p,
                section: action.payload.s,
                subjects: action.payload.ss,
                fixedDays: action.payload.fd,
                fixedPositions: action.payload.fp,
                year: action.payload.y,
                shift: action.payload.sh,
                startTime: action.payload.st,
                endTime: action.payload.et,
                modality: action.payload.m,
                additionalScheds: normalizedScheds,
                roomDetails: action.payload.rd,
            };

            state.sections[id] = mappedObj;
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
