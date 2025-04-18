import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { toast } from 'sonner';
import { signup } from '../../../firebase/userService';
import formatFirebaseDate from '../../../utils/formatDate';

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
    try {
        const usersRef = collection(firestore, 'users');
        const querySnapshot = await getDocs(usersRef);
        const usersData = querySnapshot.docs.reduce((acc, doc) => {
            const data = doc.data();

            acc[doc.id] = {
                id: doc.id,
                ...data,
                created: formatFirebaseDate(data.created?.toDate?.() || null),
            };
            return acc;
        }, {});
        return usersData;
    } catch (error) {
        toast.error('Error fetching users: ' + error.message);
        throw error;
    }
});

export const createUser = createAsyncThunk('user/createUser', async (credentials, { rejectWithValue }) => {
    try {
        const userData = await signup(credentials);
        console.log('🚀 ~ userData:', userData);
        return userData;
    } catch (error) {
        return rejectWithValue(error.message);
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
            })
            .addCase(createUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false;
                state.users = { ...state.users, [action.payload.uid]: action.payload };
                toast.success('User created successfully!');
            })
            .addCase(createUser.rejected, (state, action) => {
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
