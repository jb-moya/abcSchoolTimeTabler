import { collection, query, limit, startAfter, getDocs } from 'firebase/firestore';
import { firestore } from './firebase';

export const getLogsQuery = async ({lastVisible, limitItems}) => {
    let q = query(collection(firestore, 'logs'), limit(limitItems));

    if (lastVisible) {
        q = query(q, startAfter(lastVisible));
    }

    return await getDocs(q);
};
