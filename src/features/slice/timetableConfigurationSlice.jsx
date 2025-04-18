import { createSlice} from '@reduxjs/toolkit';

const timetableConfigurationSlice = createSlice({
    name: 'timetableConfiguration',
    initialState: {
        configurations: {
            1: {
                defaultNumberOfSchoolDays: 5,
                defaultBreakTimeDuration: 30,
                defaultClassDuration: 40,
                defaultMorningStart: '06:00 AM',
                defaultAfternoonStart: '01:00 PM',
                defaultMinimumTeachingLoad: 1300,
                defaultMaximumTeachingLoad: 1800,
            },
        },
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const { id, ...data } = action.payload;
            state.configurations[id] = data;
        },
        remove: (state, action) => {
            delete state.configurations[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = timetableConfigurationSlice.actions;
export default timetableConfigurationSlice.reducer;
