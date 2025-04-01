import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useAuthLogin } from './admin/users/hooks/useAuthLogin';
import { useAuthSignup } from './admin/users/hooks/useAuthSignup';
import { useAuthLogout } from './admin/users/hooks/useAuthLogout';
import { toast } from 'sonner';

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

export const loginUser = createAsyncThunk('user/loginUser', async (credentials, { rejectWithValue }) => {
    try {
        const { login } = useAuthLogin();
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
            const { signup } = useAuthSignup();
            const userData = await signup(credentials);
            return userData;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const logoutUser = createAsyncThunk('user/logoutUser', async (_, { rejectWithValue }) => {
    try {
        const { logout } = useAuthLogout();
        await logout();
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.status = 'success';
        },
        clearError: (state) => {
            state.error = null;
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

export const { clearError, setUser } = userSlice.actions;
export default userSlice.reducer;
