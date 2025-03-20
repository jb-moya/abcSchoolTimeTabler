import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useState, useEffect } from 'react';
import { setAuthUserUid, clearAuthUserUid } from '../utils/localStorageUtils';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('user', user);
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const uid = user.uid;
                setAuthUserUid(uid);
            } else {
                clearAuthUserUid();
            }

            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
};

export default useAuth;
