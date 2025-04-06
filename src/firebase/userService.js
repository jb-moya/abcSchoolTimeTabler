import { toast } from 'sonner';
import { firestore } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';  

export const getUserData = async (uid) => {
    try {
        const userRef = doc(firestore, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        let userData = userSnap.data();

        // Convert Firestore Timestamps to ISO Date strings
        if (userData.created instanceof Timestamp) {
            userData.created = userData.created.toDate().toISOString();
        }

        return userData;
    } catch (error) {
        toast.error(error.message || 'Failed to fetch user data');
        throw error; // 🔥 Re-throw the error so the caller can handle it
    }
};