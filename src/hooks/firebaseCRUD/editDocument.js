import { doc, addDoc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { toast } from 'sonner';

/**
 * Adds a new document to a specified Firestore collection
 * @param {string} docId - The data to edit
 * @param {object} entryData - The data to apply to the document
 * @param {string} collectionName - The name of the collection to edit to
 * @param {string} collectionAbbreviation - The abbreviation of the collection
 * @param {string} userName - The name of the user who is editing the document
 * @param {string} itemName - The name of the item being edited
 */
export async function editDocument({
    docId,
    entryData,
    collectionName = '',
    collectionAbbreviation = '-',
    userName = '',
    itemName = '',
}) {
    try {
        const docRef = doc(firestore, collectionName, String(docId));
        const logCollectionRef = collection(firestore, 'logs');

        await runTransaction(firestore, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) {
                throw new Error('Document does not exist!');
            }

            transaction.update(docRef, entryData);

            await addDoc(logCollectionRef, {
                d: `${collectionAbbreviation}-e`,
                i: itemName,
                u: userName,
                t: serverTimestamp(),
            });
        });

        console.log('Document edited successfully!');
    } catch (error) {
        toast.error(`Error editing ${collectionName}: ${error.message}`);
        throw error;
    }
}
