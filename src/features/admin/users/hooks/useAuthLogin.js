import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../../firebase/firebase';
import { getUserData } from '../../../../firebase/userService';
import { firestore } from '../../../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export const useAuthLogin = () => {
    const login = async (credentials) => {
        const { email, password } = credentials;

        if (!email || !password) {
            throw new Error('Missing email or password');
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userRef = doc(firestore, 'activeUsers', user.uid);
        console.log("🚀 ~ login ~ user.uid:", user.uid)
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await signOut(auth);
            throw new Error('User is not authorized to log in. It is inactive');
        }

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
