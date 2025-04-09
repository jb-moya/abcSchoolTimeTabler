import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';

const timetableConfigurationSlice = createSlice({
    name: 'ranks',
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
        upsertTimetableConfiguration: (state, action) => {
            const { id, ...data } = action.payload;
            state.configurations[id] = data;
        },
        removeTimetableConfiguration: (state, action) => {
            delete state.configurations[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
    // extraReducers: (builder) => {
    //     builder
    //         .addCase(subscribeToRanks.pending, (state) => {
    //             state.loading = true;
    //             state.error = null;
    //         })
    //         .addCase(subscribeToRanks.rejected, (state, action) => {
    //             state.loading = false;
    //             state.error = action.error.message;
    //         });
    // },
});

export const { upsertTimetableConfiguration, removeTimetableConfiguration, setLoading } = timetableConfigurationSlice.actions;
export default timetableConfigurationSlice.reducer;
