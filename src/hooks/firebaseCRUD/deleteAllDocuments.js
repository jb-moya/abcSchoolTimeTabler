import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { firestore } from '../../firebase/firebase';

const collectionsToDelete = ["subjects", "programs", "sections", "ranks", "teachers", "departments", "buildings", "counters"];

export async function deleteAllCollections() {

    for (const collectionName of collectionsToDelete) {
        const querySnapshot = await getDocs(collection(firestore, collectionName));

        const deletePromises = querySnapshot.docs.map((document) => 
            deleteDoc(doc(firestore, collectionName, document.id))
        );

        await Promise.all(deletePromises);
    }

    console.log("All specified collections are empty. Proceeding with next steps...");

}

