import { useState } from 'react';
import { AuthErrorCodes, updatePassword } from 'firebase/auth';
import { auth } from '../../../../firebase/firebase';

export const useEditUserPassword = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const editUserPassword = async (newPassword, confirmNewPassword) => {
        setLoading(true);
        setError(null);

        try {
            if (newPassword !== confirmNewPassword) {
                console.log('Passwords do not match');
                throw new Error('Passwords do not match');
            }

            const user = auth.currentUser;

            await updatePassword(user, newPassword);

            setLoading(false);
        } catch (err) {
            if (err.code === AuthErrorCodes.CREDENTIAL_TOO_OLD_LOGIN_AGAIN) {
                setError("Please sign in again to change your password — it's been over 5 minutes since your last login.");
            } else {
                setError(err.message || 'An error occurred');
            }

            setLoading(false);

            throw err;
        }
    };

    return { editUserPassword, loading, error };
};
