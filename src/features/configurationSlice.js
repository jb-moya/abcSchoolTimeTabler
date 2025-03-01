import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    maxTeacherLoad: 0,
    minTeacherLoad: 0,
};

const configurationSlice = createSlice({
    name: 'configuration',
    initialState,
    reducers: {
        setMaxTeacherLoad: (state, action) => {
            state.maxTeacherLoad = action.payload;
        },
        setMinTeacherLoad: (state, action) => {
            state.minTeacherLoad = action.payload;
        },
    },
});

export const { setMaxTeacherLoad, setMinTeacherLoad } = configurationSlice.actions;
export default configurationSlice.reducer;
