import { useState, useCallback } from 'react';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { toast } from 'sonner';

export function useAddDocument() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Adds a new document to a specified Firestore collection
     * @param {object} entryData - The data to add as a new document
     * @param {string} collectionName - The name of the collection to add to
     * @param {string} collectionAbbreviation - The abbreviation of the collection
     * @param {string} userName - The name of the user who is adding the document
     * @param {string} itemName - The name of the item being added
     */
    const addDocument = useCallback(
        async ({ entryData, collectionName = '', collectionAbbreviation = '-', userName = '', itemName = '' }) => {
            setLoading(true);
            setError(null);

            try {
                const counterRef = doc(firestore, `counters/${collectionName}Counter`);
                const collectionRef = collection(firestore, collectionName);
                const logCollectionRef = collection(firestore, 'logs');
                let newId;

                await runTransaction(firestore, async (transaction) => {
                    const counterSnap = await transaction.get(counterRef);

                    if (!counterSnap.exists()) {
                        newId = 1;
                        transaction.set(counterRef, { highest_custom_id: newId });
                    } else {
                        const currentId = counterSnap.data().highest_custom_id;
                        newId = currentId + 1;
                        transaction.update(counterRef, { highest_custom_id: newId });
                    }

                    const newDocRef = doc(collectionRef, newId.toString());
                    transaction.set(newDocRef, entryData);

                    const newLogDocRef = doc(logCollectionRef);
                    transaction.set(newLogDocRef, {
                        d: `${collectionAbbreviation}-a`,
                        i: itemName,
                        u: userName,
                        t: serverTimestamp(),
                    });
                });

                return newId;
            } catch (err) {
                console.error(err);
                setError(err);
                toast.error(`Error adding ${collectionName}: ${err.message}`);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { addDocument, loading, error };
}