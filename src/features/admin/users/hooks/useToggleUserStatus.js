import { useState } from 'react';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const useToggleAllowedStatus = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const toggleStatus = async (userId, isActive) => {
        setLoading(true);
        setError(null);

        try {
            const db = getFirestore();

            if (!userId) throw new Error('User is not authenticated');

            const ref = doc(db, 'activeUsers', userId);

            if (isActive) {
                await setDoc(ref, { allowed: true });
            } else {
                await deleteDoc(ref);
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return { toggleStatus, loading, error };
};
