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

            const normalizedScheds = {
                7: [],
                8: [],
                9: [],
                10: [],
            };

            [7, 8, 9, 10].forEach((year) => {
                normalizedScheds[year] = action.payload[year].as.map((sched) => ({
                    name: sched.n,
                    subject: sched.su,
                    duration: sched.d,
                    frequency: sched.f,
                    shown: sched.sh,
                }))
            });

            const mappedObj = {
                id,
                program: action.payload.p,
                7: {
                    subjects: action.payload[7].s,
                    fixedDays: action.payload[7].fd,
                    fixedPositions: action.payload[7].fp,
                    shift: action.payload[7].sh,
                    startTime: action.payload[7].st,
                    endTime: action.payload[7].et,
                    additionalScheds: normalizedScheds[7],
                    modality: action.payload[7].m,
                },
                8: {
                    subjects: action.payload[8].s,
                    fixedDays: action.payload[8].fd,
                    fixedPositions: action.payload[8].fp,
                    shift: action.payload[8].sh,
                    startTime: action.payload[8].st,
                    endTime: action.payload[8].et,
                    additionalScheds: normalizedScheds[8],
                    modality: action.payload[8].m,
                },
                9: {
                    subjects: action.payload[9].s,
                    fixedDays: action.payload[9].fd,                                       
                    fixedPositions: action.payload[9].fp,
                    shift: action.payload[9].sh,
                    startTime: action.payload[9].st,
                    endTime: action.payload[9].et,                                        
                    additionalScheds: normalizedScheds[9],
                    modality: action.payload[9].m,
                },
                10: {
                    subjects: action.payload[10].s,
                    fixedDays: action.payload[10].fd,
                    fixedPositions: action.payload[10].fp,
                    shift: action.payload[10].sh,
                    startTime: action.payload[10].st,
                    endTime: action.payload[10].et,
                    additionalScheds: normalizedScheds[10],
                    modality: action.payload[10].m,
                },
            }

            state.programs[id] = mappedObj;
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
