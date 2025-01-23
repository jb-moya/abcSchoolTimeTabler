import { auth, firestore } from '../firebase/firebase';
import { toast } from 'sonner';
import { collection, doc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { getAuthUserUid } from '../utils/localStorageUtils';

const convertMapValuesToArray = (map) => {
    for (let [key, value] of map) {
        if (value instanceof Map) {
            // Convert the nested Map to an array of key-value pairs
            map.set(key, Array.from(value));
        }
    }
};

const deepCloneMap = (map) => {
    const newMap = new Map();

    map.forEach((value, key) => {
        // If the value is a Map, clone it recursively
        if (value instanceof Map) {
            newMap.set(key, deepCloneMap(value)); // Recursively clone nested Map
        } else if (value instanceof Object) {
            // If the value is an object, create a shallow clone of the object
            newMap.set(key, { ...value });
        } else {
            // If it's neither an object nor a Map, just copy the value
            newMap.set(key, value);
        }
    });

    return newMap;
};

export const deployTimetable = async (timetables) => {
    const uid = getAuthUserUid();

    const copyTimetables = deepCloneMap(timetables);

    // console.log('🚀 ~ deployTimetable ~ timetables:', timetables);

    // console.log('🚀 ~ C O P Y  ~ timetables:', copyTimetables);

    convertMapValuesToArray(copyTimetables);

    console.log('🚀 ~ N E W deployTimetable ~ timetables:', copyTimetables);

    console.log('🚀 ~ N E W deployTimetable ~ timetables:', JSON.stringify(Array.from(copyTimetables)));


    const schedules = [];

    copyTimetables.forEach((value, key) => {
        console.log(`${key}: ${value}`);

        // value.forEach((day, index) => {
        //     console.log(`Day ${index + 1}: ${day}`);
        // });

        const arraySchedule = JSON.stringify(Array.from(value));

        // const schedule = {
        //     name: key,
        //     schedule: arraySchedule,
        //     createdBy: uid,
        // };

        schedules.push(arraySchedule);
    });

    // const batch = writeBatch(firestore);

    // const scheduleCollectionRef = collection(firestore, 'schedules');

    // schedules.forEach((schedule) => {
    //     batch.set(doc(scheduleCollectionRef), schedule);
    // });

    // try {
    //     await batch.commit();
    //     toast.success('Timetable deployed successfully');
    // } catch (error) {
    //     console.error('Error deploying timetable:', error);
    // }

    console.log('🚀 ~ deployTimetable ~ schedules:', schedules);

    // const stringifiedTi

    console.log(JSON.stringify(schedules));

    let parsedSchedules = JSON.parse(JSON.stringify(schedules));

    console.log('🚀 ~ deployTimetable ~ parsedSchedules:', parsedSchedules);


    let parsedTimetable;

    parsedSchedules.forEach((schedule) => {
        parsedTimetable = JSON.parse(schedule);
    });

    console.log('🚀 ~ deployTimetable ~ parsedTimetable:', parsedTimetable);
};
