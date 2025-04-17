import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useSelector } from 'react-redux';

const ignoreCollectionOnInitialAddedEvent = ['logs'];

const useFirestoreCollectionListeners = (collections) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.user);

    useEffect(() => {
        if (!user) {
            return;
        }

        collections.forEach(({ setLoading }) => {
            dispatch(setLoading(true));
        });

        const unsubscribeFunctions = collections.map(({ collectionPath, addAction, updateAction, removeAction, setLoading }) => {
            const q = query(collection(firestore, collectionPath));

            let isInitialSnapshot = ignoreCollectionOnInitialAddedEvent.includes(collectionPath);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const docData = {
                        id: parseInt(change.doc.id, 10),
                        ...change.doc.data(),
                    };

                    if (
                        isInitialSnapshot &&
                        change.type === 'added' &&
                        ignoreCollectionOnInitialAddedEvent.includes(collectionPath)
                    ) {
                        // Skip this 'added' event from initial snapshot
                        return;
                    }

                    if (change.type === 'added') {
                        dispatch(addAction(docData));
                    } else if (change.type === 'modified') {
                        dispatch(updateAction(docData));
                    } else if (change.type === 'removed') {
                        dispatch(removeAction(docData.id));
                    }
                });

                dispatch(setLoading(false));
                isInitialSnapshot = false;
            });

            return unsubscribe;
        });

        return () => {
            unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
            collections.forEach(({ setLoading }) => {
                dispatch(setLoading(false));
            });
        };
    }, [collections, dispatch, user]);
};

export default useFirestoreCollectionListeners;
