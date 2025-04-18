import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'sonner';
import { getLogsQuery } from '../../firebase/getUserLogsQuery';
import { formatLog } from '../../utils/formatLogs';

export const fetchLogs = createAsyncThunk('logs/fetchLogs', async ({ lastVisible, limitItems }) => {
    const querySnapshot = await getLogsQuery({ lastVisible: lastVisible, limitItems: limitItems });
    const logs = [];
    let lastDoc = null;

    querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
        lastDoc = doc;
    });

    return { logs, lastVisible: lastDoc };
});

const logs = createSlice({
    name: 'userLogs',
    initialState: {
        logs: [],
        newLogsCount: 0,
        lastVisible: null,
        total: 0,
        loading: true,
        error: null,
    },
    reducers: {
        resetLogs(state) {
            state.logs = [];
            state.lastVisible = null;
        },

        resetNewLogsCount: (state) => {
            state.newLogsCount = 0;
        },

        upsert: (state, action) => {
            const newLog = formatLog(action.payload);

            toast.success(`${newLog.username} ${newLog.operationName} ${newLog.item} in ${newLog.collectionName}`, {
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
    extraReducers: (builder) => {
        builder
            .addCase(fetchLogs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchLogs.fulfilled, (state, action) => {
                const formattedLogs = action.payload.logs.map(formatLog);
                state.logs.push(...formattedLogs);
                state.lastVisible = action.payload.lastVisible;
                state.loading = false;
            })
            .addCase(fetchLogs.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const { upsert, remove, setLoading, resetNewLogsCount, resetLogs } = logs.actions;
export default logs.reducer;
