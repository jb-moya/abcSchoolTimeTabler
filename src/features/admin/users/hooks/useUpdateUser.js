import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../../../../firebase/firebase';

export const useEditUser = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const editUser = async (userId, newData) => {
        setLoading(true);
        setError(null);
        try {
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, newData);
            setLoading(false);
            console.log("ffffffff")
        } catch (err) {
            setError(err);
            setLoading(false);
        }
    };

    return { editUser, loading, error };
};
