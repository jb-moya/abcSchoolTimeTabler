import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../../firebase/firebase';
import { getUserData } from '../../../../firebase/userService';

export const useAuthLogin = () => {
    const login = async (credentials) => {
        const { email, password } = credentials;

        if (!email || !password) {
            throw new Error('Missing email or password');
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userData = await getUserData(user.uid);

        return {
            uid: user.uid,
            email: user.email,
            profilePicURL: user.photoURL,
            ...userData,
        };
    };

    return { login };
};
