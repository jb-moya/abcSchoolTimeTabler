import { firestore } from '../../firebase/firebase';
import { doc, deleteDoc } from "firebase/firestore";

// import { fetchDocuments } from './retrieveDocuments';

export async function deleteDocument (collectionName, docId) {

    // const { documents: subjectDocs, loading1, error1 } = fetchDocuments('subjects');
    // const { documents: programDocs, loading2, error2 } = fetchDocuments('programs');

    try {

        const docRef = doc(firestore, collectionName, docId);

        await deleteDoc(docRef);

        console.log("Document deleted successfully!");

    } catch (error) {

        console.error("Error deleting document: ", error);
        throw error;
        
    }

};
