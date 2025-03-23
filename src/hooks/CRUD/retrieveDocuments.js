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
                    const customId = docData.custom_id;
        
                    if (customId !== undefined) { // Ensure custom_id exists
                        acc[customId] = { ...docData, id: doc.id }; // Store Firestore id inside
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