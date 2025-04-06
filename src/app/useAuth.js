import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useState, useEffect } from 'react';
import { setAuthUserUid, clearAuthUserUid } from '../utils/localStorageUtils';
import { getUserData } from '../firebase/userService';
import { useDispatch } from 'react-redux';
import { setUser as setUserRedux } from '../features/userSlice';
const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const dispatch = useDispatch();

    useEffect(() => {
        console.log('user', user);
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const uid = user.uid;
                const userData = await getUserData(uid);
                dispatch(setUserRedux(userData));
                setAuthUserUid(uid);
                setUser({ ...user, ...userData });
            } else {
                setUser(null);
                clearAuthUserUid();
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
};

export default useAuth;
