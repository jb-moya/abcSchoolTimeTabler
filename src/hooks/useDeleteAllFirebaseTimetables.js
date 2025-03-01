import { useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { toast } from 'sonner';
import useAuth from '../app/useAuth';

function useDeleteAllFirebaseTimetables() {
    const [isLoading, setIsLoading] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const { loading: userLoading } = useAuth;

    const collectionPath = 'timetables';

    const collectionRef = collection(firestore, collectionPath);

    const handleDeleteAllFirebaseTimetables = async () => {
        setIsLoading(true);

        if (userLoading) {
            return;
        }

        try {
            const querySnapshot = await getDocs(collectionRef);
            const totalDocs = querySnapshot.docs.length;
            setRemaining(totalDocs);

            for (const docSnap of querySnapshot.docs) {
                await deleteDoc(doc(firestore, collectionPath, docSnap.id)); // Delete each document
                setRemaining((prevRemaining) => prevRemaining - 1);
            }
        } catch (error) {
            console.error('Error deleting documents: ', error);
        } finally {
            setIsLoading(false);
            toast.success('All Deployed Timetables Deleted');
        }
    };

    return { handleDeleteAllFirebaseTimetables, isLoading, remaining };
}

export default useDeleteAllFirebaseTimetables;
