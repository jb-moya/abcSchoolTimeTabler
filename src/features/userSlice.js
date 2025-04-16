import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'sonner';
import { login, signup, logout } from '../firebase/userService';

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
};

export const loginUser = createAsyncThunk('user/loginUser', async (credentials, { rejectWithValue }) => {
    try {
        const userData = await login(credentials);
        return userData;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const signUpWithEmailAndPassword = createAsyncThunk(
    'user/signUpWithEmailAndPassword',
    async (credentials, { rejectWithValue }) => {
        try {
            const userData = await signup(credentials);
            return userData;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const logoutUser = createAsyncThunk('user/logoutUser', async (_, { rejectWithValue }) => {
    try {
        await logout();
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const userSlice = createSlice({
    name: 'user',
    initialState: initialState,
    reducers: {
        setUser: (state, action) => {
            console.log('xxxxxxxxxxxxxxxxxxxx x x x x x    x', action.payload);
            state.user = action.payload;
            state.status = 'success';
            state.isAuthenticated = true;
        },
        clearError: (state) => {
            state.error = null;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearUser: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        },
        setLoading: (state, action) => {
            console.log('🚀 ~ setLoading ~ action:', action.payload);
            state.loading = action.payload;
            console.log('🚀 ~ setLoading ~ action:', action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                toast.success('Logged in successfully');
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload);
            })
            .addCase(signUpWithEmailAndPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signUpWithEmailAndPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                toast.success('Account created successfully');
            })
            .addCase(signUpWithEmailAndPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload);
            })
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                toast.success('Logged out successfully');
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload);
            });
    },
});

export const { setUser, clearError, setError, clearUser, setLoading } = userSlice.actions;
export default userSlice.reducer;
