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

            const normalizedScheds = action.payload.ar.map((sched) => ({
                name: sched.n,
                subject: sched.su,
                duration: sched.d,
                frequency: sched.f,
                shown: sched.sh,
                time: sched.t,
            }))

            const mappedObj = {
                id,
                rank: action.payload.r,
                additionalRankScheds: normalizedScheds,
            };

            state.ranks[id] = mappedObj;
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
