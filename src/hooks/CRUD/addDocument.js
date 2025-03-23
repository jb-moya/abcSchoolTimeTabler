import { collection, getDocs, addDoc } from "firebase/firestore";
import { firestore } from '../../firebase/firebase';

/**
 * Adds a new document to a specified Firestore collection
 * @param {string} collectionName - The name of the collection to add to
 * @param {object} entryData - The data to add as a new document
 * @returns {Promise<string>} - The ID of the newly created document
 */

export async function addDocument(collectionName, entryData) {
    try {
        const collectionRef = collection(firestore, collectionName);

        // Fetch all documents to determine the highest existing custom_id
        const snapshot = await getDocs(collectionRef);
        let highestId = 0;

        snapshot.forEach((docSnap) => {
            const docData = docSnap.data();
            if (docData.custom_id && Number.isInteger(docData.custom_id)) {
                highestId = Math.max(highestId, docData.custom_id);
            }
        });

        const newId = highestId + 1; // Assign the next sequential ID

        // Add document with the generated custom_id
        const docRef = await addDoc(collectionRef, { ...entryData, custom_id: newId });

        console.log("Document added with custom_id:", newId);
        return docRef.id;

    } catch (error) {
        console.error("Error adding document:", error);
        throw error;
    }
}