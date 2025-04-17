import { createSlice } from '@reduxjs/toolkit';
import { ABBREVIATION_COLLECTION, ABBREVIATION_OPERATION } from '../../constants';
import { toast } from 'sonner';
import { increment } from 'firebase/firestore';
const logs = createSlice({
    name: 'notificationUserLogs',
    initialState: {
        logs: [],
        newLogsCount: 0,
        loading: true,
        error: null,
    },
    reducers: {
        resetNewLogsCount: (state) => {
            state.newLogsCount = 0;
        },

        upsert: (state, action) => {
            const { id, ...logData } = action.payload;
            const rawDescriptor = logData?.d ?? '-';
            const split = rawDescriptor.split('-');

            const abbrevCollection = split?.[0] ?? '-';
            const abbrevOperation = split?.[1] ?? '-';

            const collectionName = ABBREVIATION_COLLECTION[abbrevCollection] ?? 'an unknown collection';
            const operationName = ABBREVIATION_OPERATION[abbrevOperation] ?? 'did something on';
            const username = logData?.u ?? 'Unknown User';
            const item = logData?.i ?? 'unknown item';

            const newLog = {
                collectionName: collectionName,
                operation: operationName,
                item: item,
                date: logData.t,
                username: username,
            };

            toast.success(`${username} ${operationName} ${item} in ${collectionName}`, {
                duration: 3000,
                richColors: true,
                position: 'bottom-left',
            });

            state.logs.push(newLog);
            state.newLogsCount = state.newLogsCount + 1;
        },
        remove: (state, action) => {
            delete state.logs[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading, resetNewLogsCount } = logs.actions;
export default logs.reducer;
