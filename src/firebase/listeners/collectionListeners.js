import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
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
        
        const unsubscribeFunctions = collections.map(({ collectionPath, addAction, updateAction, removeAction, setLoading }) => {
            const q = query(collection(firestore, collectionPath));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    
                    const docData = {
                        id: parseInt(change.doc.id, 10),
                        ...change.doc.data(),
                    };
                    
                    console.log("🚀 ~ snapshot.docChanges ~ change:", change)
                    console.log("🚀 ~ unsubscribeFunctions ~ collectionPath:", collectionPath)
                    console.log("🚀 ~ snapshot.docChanges ~ docData:", docData)

                    if (change.type === 'added') {
                        console.log('Added document: ', collectionPath, docData);
                        dispatch(addAction(docData));
                    } else if (change.type === 'modified') {
                        dispatch(updateAction(docData));
                    } else if (change.type === 'removed') {
                        dispatch(removeAction(docData.id));
                    }
                });

                console.log('GGG'); 
                dispatch(setLoading(false));
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
    }, [collections, dispatch, user]);
};

export default useFirestoreCollectionListeners;
