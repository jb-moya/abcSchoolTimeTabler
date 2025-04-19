import { useState } from 'react';
import { addDoc, collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import chunkArray from '../utils/chunkArray';

function useDeployTimetables() {
    const [isLoading, setIsLoading] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const { user, loading: userLoading } = useSelector((state) => state.user);

    const itemsCollection = collection(firestore, 'timetables');
    const batchLimit = 500;

    const handleDeployTimetables = async (timetables) => {
        if (userLoading) {
            return;
        }

        setIsLoading(true);

        try {
            // 1. Delete existing timetables
            const existingDocs = await getDocs(itemsCollection);
            const deleteChunks = chunkArray(existingDocs.docs, batchLimit);

            for (const chunk of deleteChunks) {
                const batch = writeBatch(firestore);
                chunk.forEach((docSnap) => batch.delete(docSnap.ref));
                await batch.commit();
            }

            // 2. Prepare new timetable data
            const schedules = [];
            timetables.forEach((value, key) => {
                console.log(`${key}: ${value}`);
                console.log(value);

                const obj = {
                    n: value[0].split(' ').map((str) => str.toLowerCase()),
                    a: JSON.stringify([value.slice(0, 2)]),
                    t: value[2],
                    u: user.uid,
                    m: value[3],
                    sa: value[4],
                    sr: value[5],
                    tr: value[6],
                    td: value[7],
                };

                schedules.push(obj);
            });

            const addChunks = chunkArray(schedules, batchLimit);

            // console.log('vv');
            // console.log(schedules);
            setRemaining(schedules.length);

            for (const chunk of addChunks) {
                const batch = writeBatch(firestore);
                chunk.forEach((item) => {
                    const newDocRef = doc(itemsCollection);
                    batch.set(newDocRef, item);
                });
                await batch.commit();
            }

            toast.success('Timetables deployed successfully');
        } catch (error) {
            setIsLoading(false);
            console.error('Error deploying timetables:', error);
            toast.error('Error deploying timetables');
        } finally {
            setIsLoading(false);
        }
    };

    return { handleDeployTimetables, isLoading, remaining };
}

export default useDeployTimetables;
