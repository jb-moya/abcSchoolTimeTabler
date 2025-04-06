import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';

// Custom hook for real-time Firestore data
export function fetchDocuments(collectionName) {
    const [documents, setDocuments] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const collectionRef = collection(firestore, collectionName);

        // Set up real-time listener
        const unsubscribe = onSnapshot(
            collectionRef,
            (snapshot) => {
                const docsObject = snapshot.docs.reduce((acc, doc) => {
                    const docData = doc.data();
                    
                    // Convert Firestore string ID to integer
                    const docId = parseInt(doc.id, 10);

                    if (!isNaN(docId)) { // Ensure it's a valid number
                        acc[docId] = { ...docData, id: docId }; // Store int ID in attributes
                    } else {
                        console.warn(`Skipping document with non-numeric ID: ${doc.id}`);
                    }

                    return acc;
                }, {});

                setDocuments(docsObject);
                setLoading(false);
            },
            (err) => {
                console.error("Error listening to collection: ", err);
                setError(err.message);
                setLoading(false);
            }
        );

        // Clean up listener on unmount
        return () => unsubscribe();
    }, [collectionName]);

    return { documents, loading, error };
}