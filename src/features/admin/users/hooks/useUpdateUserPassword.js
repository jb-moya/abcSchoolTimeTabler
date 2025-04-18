import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../../../firebase/firebase';

export const useEditUserPassword = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const editUserPassword = async (newPassword, confirmNewPassword) => {
        setLoading(true);
        setError(null);

        try {
            console.log('updating xxxxx');

            if (newPassword !== confirmNewPassword) {
                console.log('Passwords do not match');
                throw new Error('Passwords do not match');
            }

            const user = auth.currentUser;

            await updatePassword(user, newPassword);

            setLoading(false);
        } catch (err) {
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    return { editUserPassword, loading, error };
};
