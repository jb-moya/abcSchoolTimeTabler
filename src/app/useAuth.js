import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useEffect } from 'react';
import { getUserData } from '../firebase/userService';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from '../features/userSlice';
import { toast } from 'sonner';

import { signOut } from 'firebase/auth';

const useAuth = () => {
    const dispatch = useDispatch();

    const handleAuthStateChange = async (user) => {
        if (user) { 
            console.log('User is signed in');
            await handleUserLoggedIn(user);
        } else {
            console.log('User is signed out');
            dispatch(clearUser());
        }

        // dispatch(setLoading(false));
    };

    const handleUserLoggedIn = async (user) => {
        try {
            const userData = await getUserData(user.uid);
            console.log("🚀 ~ handleUserLoggedIn ~ user:", user)
            console.log("🚀 ~ handleUserLoggedIn ~ userData:", userData)
            dispatch(setUser(userData));
        } catch (error) {
            handleUserSignOut(error);
        }
    };

    const handleUserSignOut = async (error) => {
        console.error('Error fetching user data:', error);
        toast.error('User data not found. Signing out...');
        // dispatch(setError(error.message));
        await signOut(auth);
        dispatch(clearUser());
    };

    useEffect(() => {
        // dispatch(setLoading(true));
        const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

        return () => {
            unsubscribe();
        };
    }, [dispatch]);
};

export default useAuth;
