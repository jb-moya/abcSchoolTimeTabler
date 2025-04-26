import { useState } from 'react';
import { collection, setDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import chunkArray from '../utils/chunkArray';

function useOverwriteCollection() {
    const [isLoading, setIsLoading] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const { loading: userLoading } = useSelector((state) => state.user);

    const batchLimit = 500;

    const handleDeployTimetables = async ({ collections = [] }) => {
        if (userLoading) {
            return;
        }

        setIsLoading(true);

        try {
            for (const collectionToOverwrite of collections) {
                const itemsCollection = collection(firestore, collectionToOverwrite.name);

                const existingDocs = await getDocs(itemsCollection);
                const deleteChunks = chunkArray(existingDocs.docs, batchLimit);

                for (const chunk of deleteChunks) {
                    const batch = writeBatch(firestore);
                    chunk.forEach((docSnap) => batch.delete(docSnap.ref));
                    await batch.commit();
                }

                setRemaining(collectionToOverwrite.entries.length);

                const addChunks =
                    Array.isArray(collectionToOverwrite?.entries) && collectionToOverwrite.entries.length > 0
                        ? chunkArray(collectionToOverwrite.entries, batchLimit)
                        : [];

                if (collectionToOverwrite.name === 'counters') {
                    continue;
                }

                let counter = 1;
                const counterRef = doc(firestore, `counters/${collectionToOverwrite.name}Counter`);

                for (const chunk of addChunks) {
                    const batch = writeBatch(firestore);
                    chunk.forEach((item) => {
                        const newDocRef = collectionToOverwrite?.toCount
                            ? doc(itemsCollection, counter.toString()) // use custom ID
                            : doc(itemsCollection); // auto-generated ID

                        counter += 1;
                        batch.set(newDocRef, item);
                    });

                    await batch.commit();
                }

                if (collectionToOverwrite?.toCount) {
                    await setDoc(counterRef, { highest_custom_id: counter - 1 });
                }
            }

            toast.success('Timetables deployed successfully');
        } catch (error) {
            setIsLoading(false);
            console.error('Error overwriting entries:', error);
            toast.error('Error overwriting entries: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { handleDeployTimetables, isLoading, remaining };
}

export default useOverwriteCollection;
