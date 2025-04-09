import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const useFirestoreListeners = (collections) => {
    const dispatch = useDispatch();

    useEffect(() => {
        collections.forEach(({ setLoading }) => {
            console.log('hahA');
            dispatch(setLoading(true));
        });

        const unsubscribeFunctions = collections.map(({ collectionPath, addAction, updateAction, removeAction, setLoading }) => {
            const q = query(collection(firestore, collectionPath));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const docData = {
                        id: change.doc.id,
                        ...change.doc.data(),
                    };

                    if (change.type === 'added') {
                        console.log('Added document: ', docData);
                        dispatch(addAction(docData));
                    } else if (change.type === 'modified') {
                        dispatch(updateAction(docData));
                    } else if (change.type === 'removed') {
                        dispatch(removeAction(docData.id));
                    }
                });

                console.log('GGG'); 
                dispatch(setLoading(false)); // TODO: MIGHT CODE SMELLLLLLLLLLL
            });

            return unsubscribe;
        });

        return () => {
            unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
            collections.forEach(({ setLoading }) => {
                console.log('ZZZZZZZZ');
                dispatch(setLoading(false));
            });
        };
    }, [collections, dispatch]);
};

export default useFirestoreListeners;
