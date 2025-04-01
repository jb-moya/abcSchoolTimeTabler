import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { toast } from 'sonner';

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
    try {
        const usersRef = collection(firestore, 'users');
        const querySnapshot = await getDocs(usersRef);
        // Convert array to object with IDs as keys
        const usersData = querySnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = {
                id: doc.id,
                ...doc.data(),
            };
            return acc;
        }, {});
        return usersData;
    } catch (error) {
        toast.error('Error fetching users: ' + error.message);
        throw error;
    }
});

const initialState = {
    users: {},
    loading: false,
    error: null,
};

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        editUser: (state, action) => {
            state.users[action.payload.id] = action.payload;
        },
        addUser: (state, action) => {
            state.users[action.payload.id] = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

// Selectors
export const selectAllUsers = (state) => Object.values(state.users.users);
export const selectUserById = (state, userId) => state.users.users[userId];

export const { clearError, addUser, editUser } = usersSlice.actions;
export default usersSlice.reducer;
