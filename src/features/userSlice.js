import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, firestore, secondAuth } from '../firebase/firebase';
import { toast } from 'sonner';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDocs, getDoc, query, setDoc, where } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';  

const initialState = {
    user: null,
    status: 'idle', // idle, loading, success, authenticating, failed
    error: null,
};

export const loginUser = createAsyncThunk('user/loginUser', async (credentials, { rejectWithValue }) => {
    try {
        const { email, password } = credentials;

        if (!email || !password) {
            //toast.error('Please fill all the fields');
            return rejectWithValue('Missing email or password');
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const user = userCredential.user;

        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return rejectWithValue('User data not found in Firestore'); // Prevent login if Firestore data is missing
        }

        let userData = userSnap.data();

        // Convert Firestore Timestamps to Date strings
        if (userData.created instanceof Timestamp) {
            userData.created = userData.created.toDate().toISOString(); // Convert to ISO string
        }

        console.log('🚀 ~ loginUser ~ userData:', userData);

        // Return serializable data
        return {
            uid: user.uid,
            email: user.email,
            profilePicURL: user.photoURL,
            ...userData, // Merged Firestore data
        };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const signUpWithEmailAndPassword = createAsyncThunk(
    'user/signUpWithEmailAndPassword',
    async (credentials, { rejectWithValue }) => {
        try {
            const { email, schoolName, password, confirmPassword, permissions, role, newUserNotAutoLogin } = credentials;

            if (!email || !password) {
                return rejectWithValue('Sign up failed. Please fill all the fields');
            }

            if (password !== confirmPassword) {
                return rejectWithValue('Sign up failed. Passwords do not match');
            }

            const usersRef = collection(firestore, 'users');

            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                console.log("HAHA");
                return rejectWithValue('Sign up failed. email already exists');
            }

            let userCredential;
            if (newUserNotAutoLogin) {
                userCredential = await createUserWithEmailAndPassword(secondAuth, email, password);
            } else {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            }

            console.log("🚀 ~ userCredential:", userCredential)

            if (userCredential) {
                const userDoc = {
                    uid: userCredential.user.uid,
                    email: email,
                    profilePicURL: '',
                    permissions: permissions,
                    role: role,
                    created: new Date(),
                };

                await setDoc(doc(usersRef, userCredential.user.uid), userDoc);

                localStorage.setItem('user-info', JSON.stringify(userDoc));
                return userDoc;
            }

            return null;
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
                console.log('successfully. payload here? :', action.payload);
                state.status = 'success';
                state.error = null;
                state.user = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'error';
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
                state.error = null;
                // state.user = // action.payload; // no info this time...
            })
            .addCase(signUpWithEmailAndPassword.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.payload;
            })

            // Log out
            .addCase(logoutUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.status = 'idle';
                // state.user = null;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error;
            });
    },
});

export default userSlice.reducer;
