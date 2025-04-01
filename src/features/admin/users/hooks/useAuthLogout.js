import { signOut } from 'firebase/auth';
import { auth } from '../../../../firebase/firebase';
import { toast } from 'sonner';

export const useAuthLogout = () => {
    const logout = async () => {
        try {
            await signOut(auth);
            toast.success('Logged out successfully');
        } catch (error) {
            throw error;
        }
    };

    return { logout };
};
