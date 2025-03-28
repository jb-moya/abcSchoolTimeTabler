import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { toast } from 'sonner';
import useAuth from '../app/useAuth';

function useDeployTimetables() {
    const [isLoading, setIsLoading] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const { user, loading: userLoading } = useAuth();

    const itemsCollection = collection(firestore, 'timetables'); // Reference the collection

    const handleDeployTimetables = async (timetables) => {
        setIsLoading(true);

        if (userLoading) {
            return;
        }

        try {
            const schedules = [];

            timetables.forEach((value, key) => {
                console.log(`${key}: ${value}`);
                console.log(value);

                const obj = {
                    n: value[0].split(' '),
                    a: JSON.stringify([value.slice(0, 2)]),
                    t: value[2],
                    u: user.uid,
                };

                // console.log(obj);

                schedules.push(obj);
            });

            console.log('vv');
            console.log(schedules);
            setRemaining(schedules.length);

            for (const item of schedules) {
                await addDoc(itemsCollection, item);
                setRemaining((prevRemaining) => prevRemaining - 1);
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
