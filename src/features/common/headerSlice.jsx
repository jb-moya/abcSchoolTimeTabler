import { createSlice } from '@reduxjs/toolkit';
import { increment } from 'firebase/firestore';

export const headerSlice = createSlice({
    name: 'header',
    initialState: {
        pageTitle: 'Home', // current page title state management
        noOfNotifications: 0, // no of unread notifications
        newNotificationMessage: '', // message of notification to be shown
        newNotificationStatus: 1, // to check the notification type -  success/ error/ info
    },
    reducers: {
        resetNoOfNotifications: (state) => {
            state.noOfNotifications = 0;
        },

        incrementNoOfNotifications: (state, action) => {
            state.noOfNotifications = state.noOfNotifications + 1;
        },

        setPageTitle: (state, action) => {
            state.pageTitle = action.payload.title;
        },

        removeNotificationMessage: (state, action) => {
            state.newNotificationMessage = '';
        },

        showNotification: (state, action) => {
            state.newNotificationMessage = action.payload.message;
            state.newNotificationStatus = action.payload.status;
        },
    },
});

export const { setPageTitle, removeNotificationMessage, showNotification, incrementNoOfNotifications, resetNoOfNotifications } =
    headerSlice.actions;

export default headerSlice.reducer;
