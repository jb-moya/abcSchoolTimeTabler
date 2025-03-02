import { useState } from 'react';
import { firestore } from '../firebase/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const useSearchTimetable = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const search = async (searchTerms = [], searchType) => {
        if (searchTerms.length === 0) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('🚀 ~ CALLING search ~ searchTerms:', searchTerms);

            const timetablesRef = collection(firestore, 'timetables');
            const q = query(timetablesRef, where('n', 'array-contains-any', searchTerms), where('t', '==', searchType));

            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                console.log(doc.id, ' => ', doc.data());
            });

            console.log(
                '🚀 ~ search ~ documents:',
                querySnapshot.docs.map((doc) => doc.data())
            );

            return querySnapshot.docs.map((doc) => {
                return { id: doc.id, ...doc.data() };
            });
        } catch (err) {
            setError(err);
            console.error('Error fetching documents:', err);
        } finally {
            setLoading(false);
        }
    };

    return { search, loading, error };
};

export default useSearchTimetable;
