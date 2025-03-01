import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useState, useEffect } from 'react';
import { setAuthUserUid, clearAuthUserUid } from '../utils/localStorageUtils';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /*  Getting token value stored in localstorage, if token is not present we will open login page 
    for all internal dashboard routes  */
    // const TOKEN = localStorage.getItem('token');
    // const PUBLIC_ROUTES = ['login', 'forgot-password', 'register', 'documentation', 'search'];

    // const isPublicPage = PUBLIC_ROUTES.some((r) => window.location.href.includes(r));

    useEffect(() => {
        console.log('user', user);
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const uid = user.uid;
                // ...
                setAuthUserUid(uid);
            } else {
                // Clear UID from localStorage on sign-out
                clearAuthUserUid();
                // console.log('Cleared UID from localStorage.');
            }

            setUser(user);
            setLoading(false);
        });

        // Cleanup on unmount
        return () => unsubscribe();
    }, []);

    return { user, loading };

    // if (!TOKEN && !isPublicPage) {
    //     window.location.href = '/search';
    //     return;
    // } else {
    //     axios.defaults.headers.common['Authorization'] = `Bearer ${TOKEN}`;

    //     axios.interceptors.request.use(
    //         function (config) {
    //             // UPDATE: Add this code to show global loading indicator
    //             document.body.classList.add('loading-indicator');
    //             return config;
    //         },
    //         function (error) {
    //             return Promise.reject(error);
    //         }
    //     );

    //     axios.interceptors.response.use(
    //         function (response) {
    //             // UPDATE: Add this code to hide global loading indicator
    //             document.body.classList.remove('loading-indicator');
    //             return response;
    //         },
    //         function (error) {
    //             document.body.classList.remove('loading-indicator');
    //             return Promise.reject(error);
    //         }
    //     );
    //     return TOKEN;
    // }
};

export default useAuth;
