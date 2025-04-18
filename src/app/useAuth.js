import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useEffect } from 'react';
import { getUserData } from '../firebase/userService';
import { useDispatch } from 'react-redux';
import { setUser, clearUser, setLoading } from '../features/userSlice';
import { toast } from 'sonner';

import { signOut } from 'firebase/auth';

const useAuth = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('User is signed in', user.uid);
                try {
                    const userData = await getUserData(user.uid);
                    console.log('🚀 ~ handleUserLoggedIn ~ user:', user);
                    console.log('🚀 ~ handleUserLoggedIn ~ userData:', userData);
                    dispatch(setUser(userData));
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    toast.error('User data not found. Signing out...');
                    await signOut(auth);
                    dispatch(clearUser());
                }
            } else {
                console.log('User is signed out');
                dispatch(clearUser());
            }

            dispatch(setLoading(false));
        });
        return () => {
            unsubscribe();
        };
    }, [dispatch]);
};

export default useAuth;
