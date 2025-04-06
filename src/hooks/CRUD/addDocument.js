import { doc, runTransaction, collection } from "firebase/firestore";
import { firestore } from '../../firebase/firebase';

/**
 * Adds a new document to a specified Firestore collection
 * @param {string} collectionName - The name of the collection to add to
 * @param {object} entryData - The data to add as a new document
 * @returns {Promise<string>} - The ID of the newly created document
 */

export async function addDocument(collectionName, entryData) {
    try {
        const counterRef = doc(firestore, `counters/${collectionName}Counter`);
        const collectionRef = collection(firestore, collectionName);
        let newId;

        // Run transaction to safely increment the counter for this collection
        await runTransaction(firestore, async (transaction) => {
            const counterSnap = await transaction.get(counterRef);

            if (!counterSnap.exists()) {
                // If no counter exists for this collection, create one starting at 1
                transaction.set(counterRef, { highest_custom_id: 1 });
                newId = 1;
            } else {
                const currentId = counterSnap.data().highest_custom_id;
                newId = currentId + 1;
                transaction.update(counterRef, { highest_custom_id: newId });
            }
        });

        // Add the new document using newId as the document ID (but without storing custom_id inside)
        const newDocRef = doc(collectionRef, newId.toString()); // Use ID as document name
        await runTransaction(firestore, async (transaction) => {
            transaction.set(newDocRef, entryData); // Store only the entryData
        });

        console.log(`Document added to ${collectionName} with ID:`, newId);
        return newId;

    } catch (error) {
        console.error("Error adding document:", error);
        throw error;
    }
}