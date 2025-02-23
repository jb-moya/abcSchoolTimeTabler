import { auth, firestore } from '../firebase/firebase';
import { toast } from 'sonner';
import { collection, doc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { getAuthUserUid } from '../utils/localStorageUtils';

export const deployTimetable = async (timetables) => {
    const schedules = [];

    timetables.forEach((value, key) => {
        console.log(`${key}: ${value}`);
        console.log(value);

        const obj = {
            n: value[0].split(' '),
            a: value[1],
            t: value[2],
        }

        // console.log(obj);
        
        schedules.push(obj);
    });

    console.log("vv");
    console.log(schedules);

    
};
