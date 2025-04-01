import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { auth, secondAuth, firestore } from '../../../../firebase/firebase';

export const useAuthSignup = () => {
    const signup = async (credentials) => {
        const { email, schoolName, password, confirmPassword, permissions, role, newUserNotAutoLogin } = credentials;

        if (!email || !password) {
            throw new Error('Sign up failed. Please fill all the fields');
        }

        if (password !== confirmPassword) {
            throw new Error('Sign up failed. Passwords do not match');
        }

        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error('Sign up failed. email already exists');
        }

        const authInstance = newUserNotAutoLogin ? secondAuth : auth;
        const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);

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
    };

    return { signup };
};
