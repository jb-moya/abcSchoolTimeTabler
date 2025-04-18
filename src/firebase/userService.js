import { Timestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {} from './firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, setDoc, doc } from 'firebase/firestore';
import { auth, secondAuth, firestore } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const getUserData = async (uid) => {
    const userRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error('User not found');
    }

    let userData = userSnap.data();

    if (userData.created instanceof Timestamp) {
        userData.created = userData.created.toDate().toISOString();
    }

    return userData;
};

export const login = async (credentials) => {
    const { email, password } = credentials;

    if (!email || !password) {
        throw new Error('Missing email or password');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(firestore, 'activeUsers', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('User is not authorized to log in. It is inactive');
    }

    try {
        const userData = await getUserData(user.uid);
        return {
            uid: user.uid,
            email: user.email,
            profilePicURL: user.photoURL,
            ...userData,
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw new Error('Failed to fetch user data. The user may not exist in the database.');
    }
};

export const signup = async (credentials) => {
    const { email, schoolName, username, password, confirmPassword, permissions, role, status, newUserNotAutoLogin } =
        credentials;

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

    if (newUserNotAutoLogin) {
        await authInstance.signOut();
    }

    if (userCredential) {
        const userDoc = {
            uid: userCredential.user.uid,
            email: email,
            username: username,
            profilePicURL: '',
            permissions: permissions,
            role: role,
            status: status,
            created: new Date(),
        };

        await setDoc(doc(usersRef, userCredential.user.uid), userDoc);

        if (!newUserNotAutoLogin) {
            localStorage.setItem('user-info', JSON.stringify(userDoc));
        }

        return userDoc;
    }

    return null;
};

export const logout = async () => {
    await signOut(auth);
};
