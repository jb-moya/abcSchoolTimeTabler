import { doc, updateDoc } from "firebase/firestore";
import { firestore } from '../../firebase/firebase';

/**
 * Adds a new document to a specified Firestore collection
 * @param {string} collectionName - The name of the collection to add to
 * @param {object} entryData - The data to add as a new document
 */

export async function editDocument(collectionName, docId, entryData) {

    try {
        const docRef = doc(firestore, collectionName, String(docId));
        await updateDoc(docRef, entryData);
        console.log("Document edited successfully!");
    } catch (error) {
        console.error("Error editing document: ", error);
        throw error;
    }
    
}