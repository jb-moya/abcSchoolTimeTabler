import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, firestore } from '../firebase/firebase';
import { toast } from 'sonner';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';

const initialState = {
    user: null,
    status: 'idle', // idle, loading, success, authenticating, failed
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

        console.log('🚀 ~ loginUser ~ userCredential:', userCredential);
    } catch (error) {
        return rejectWithValue(error.message); // Handle errors and return the error message
    }
});

export const signUpWithEmailAndPassword = createAsyncThunk(
    'user/signUpWithEmailAndPassword',
    async (credentials, { rejectWithValue }) => {
        try {
            const { name, email, schoolName, password, confirmPassword } = credentials;

            if (!name || !email || !password) {
                return rejectWithValue('Please fill all the fields');
            }

            if (password !== confirmPassword) {
                return rejectWithValue('Passwords do not match');
            }

            const usersRef = collection(firestore, 'users');

            const q = query(usersRef, where('username', '==', name));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return rejectWithValue('name already exists');
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            if (userCredential) {
                const userDoc = {
                    uid: userCredential.user.uid,
                    email: email,
                    name: name,
                    profilePicURL: '',
                    schoolName: schoolName,
                    created: new Date(),
                };

                await setDoc(doc(firestore, 'users', userCredential.user.uid), userDoc);

                localStorage.setItem('user-info', JSON.stringify(userDoc));
            }

            // return userCredential.user;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const logoutUser = createAsyncThunk('user/logoutUser', async (_, { rejectWithValue }) => {
    try {
        console.log('Logging out...');
        await signOut(auth)
            .then(() => {
                toast.success('Logged out successfully');
            })
            .catch((error) => {
                // toast.error(`Error logging out ${error.message}`);
                throw error;
            });
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

            // Login
            .addCase(loginUser.pending, (state) => {
                toast('Logging in...');
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                toast.success('Logged in successfully');
                state.status = 'success';
                state.user = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload;
            })

            // Sign Up
            .addCase(signUpWithEmailAndPassword.pending, (state) => {
                toast('Signing up...');
                state.status = 'loading';
                state.error = null;
            })
            .addCase(signUpWithEmailAndPassword.fulfilled, (state, action) => {
                toast.success('Signed up successfully');
                state.status = 'success';
                state.user = action.payload;
            })
            .addCase(signUpWithEmailAndPassword.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload;
            })

            // Log out
            .addCase(logoutUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.status = 'idle';
                state.user = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.error;
            });
    },
});

export default userSlice.reducer;
