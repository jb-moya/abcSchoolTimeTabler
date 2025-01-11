import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, firestore } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

const initialState = {
    user: null,
    loading: false, // idle, loading, success
    error: null,
};

export const loginUser = createAsyncThunk('user/loginUser', async (credentials, { rejectWithValue }) => {
    try {
        const email = credentials.email;
        const password = credentials.password;

        if (!email || !password) {
            toast.error('Please fill all the fields');
            return;
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        return rejectWithValue(error.message); // Handle errors and return the error message
    }
});

export const logoutUser = createAsyncThunk('user/logoutUser', async (_, { rejectWithValue }) => {
    try {
        await signOut();
    } catch (error) {
        return rejectWithValue(error.message); // Handle errors during logout
    }
});

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = 'loading';
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = 'success';
                state.user = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = 'idle';
                state.error = action.error.message;
            })
            .addCase(logoutUser.pending, (state) => {
                state.loading = 'loading';
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = 'idle';
                state.user = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = 'idle';
                state.error = action.error.message;
            });
    },
});

export default userSlice.reducer;
