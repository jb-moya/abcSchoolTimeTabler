import { firestore } from '../../firebase/firebase';
import { doc, deleteDoc } from "firebase/firestore";


export async function deleteDocument(collectionName, docId) {

    try {
        const docRef = doc(firestore, collectionName, String(docId));
        await deleteDoc(docRef);
        console.log("Document deleted successfully!");
    } catch (error) {
        console.error("Error deleting document: ", error);
        throw error;
    }
    
}