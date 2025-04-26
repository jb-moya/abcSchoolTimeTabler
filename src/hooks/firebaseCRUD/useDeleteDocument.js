import { useState, useCallback } from 'react';
import { firestore } from '../../firebase/firebase';
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export function useDeleteDocument() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Adds a new document to a specified Firestore collection
     * @param {string} docId - The ID of the document to delete
     * @param {string} collectionName - The name of the collection to delete from
     * @param {string} collectionAbbreviation - The abbreviation of the collection
     * @param {string} userName - The name of the user who is deleting the document
     * @param {string} itemName - The name of the item being deleted
     */
    const deleteDocument = useCallback(
        async ({ docId, collectionName = '', collectionAbbreviation = '-', userName = '', itemName = '' }) => {
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

                    transaction.delete(docRef);

                    const newLogDocRef = doc(logCollectionRef);

                    transaction.set(newLogDocRef, {
                        d: `${collectionAbbreviation}-d`,
                        i: itemName,
                        u: userName,
                        t: serverTimestamp(),
                    });
                });

                console.log('Document deleted and log created successfully!');
            } catch (error) {
                console.error(error);
                setError(error);
                toast.error(`Error deleting ${collectionName}: ${error.message}`);
                throw error;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { deleteDocument, loading, error };
}
