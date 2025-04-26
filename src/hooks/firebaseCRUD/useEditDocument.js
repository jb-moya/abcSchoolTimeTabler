import { useState, useCallback } from 'react';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { toast } from 'sonner';

export function useEditDocument() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Adds a new document to a specified Firestore collection
     * @param {string} docId - The data to edit
     * @param {object} entryData - The data to apply to the document
     * @param {string} collectionName - The name of the collection to edit to
     * @param {string} collectionAbbreviation - The abbreviation of the collection
     * @param {string} userName - The name of the user who is editing the document
     * @param {string} itemName - The name of the item being edited
     */
    const editDocument = useCallback(
        async ({ docId, entryData, collectionName = '', collectionAbbreviation = '-', userName = '', itemName = '' }) => {
            setLoading(true);
            setError(null);

            try {
                const docRef = doc(firestore, collectionName, String(docId));
                const logCollectionRef = collection(firestore, 'logs');

                await runTransaction(firestore, async (transaction) => {
                    const docSnap = await transaction.get(docRef);
                    if (!docSnap.exists()) {
                        throw new Error('Document does not exist!');
                    }

                    transaction.update(docRef, entryData);

                    const newLogDocRef = doc(logCollectionRef);
                    transaction.set(newLogDocRef, {
                        d: `${collectionAbbreviation}-e`,
                        i: itemName,
                        u: userName,
                        t: serverTimestamp(),
                    });
                });

                console.log('Document edited successfully!');
            } catch (err) {
                console.error(err);
                setError(err);
                toast.error(`Error editing ${collectionName}: ${err.message}`);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { editDocument, loading, error };
}
