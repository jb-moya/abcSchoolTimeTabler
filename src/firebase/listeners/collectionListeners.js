import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useSelector } from 'react-redux';

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

        const unsubscribeFunctions = collections.map(
            ({ queryBuilder, addAction, updateAction, removeAction, transform, setLoading }) => {
                const q = queryBuilder;

                const unsubscribe = onSnapshot(q, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        let docData = {
                            id: parseInt(change.doc.id, 10),
                            ...change.doc.data(),
                        };

                        if (typeof transform === 'function') {
                            docData = transform(docData);
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
                });

                return unsubscribe;
            }
        );

        return () => {
            unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
            collections.forEach(({ setLoading }) => {
                dispatch(setLoading(false));
            });
        };
    }, [collections, dispatch, user]);
};

export default useFirestoreCollectionListeners;
