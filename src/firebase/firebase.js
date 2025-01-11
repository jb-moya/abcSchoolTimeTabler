import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyA3ksqG2XCewOxbl1VRkzgDo0g1MtCK6lU",
    authDomain: "school-timetable-generat-6367f.firebaseapp.com",
    projectId: "school-timetable-generat-6367f",
    storageBucket: "school-timetable-generat-6367f.firebasestorage.app",
    messagingSenderId: "507897079726",
    appId: "1:507897079726:web:68af3c1d4bd802687aca3f",
    measurementId: "G-QYDRRZZMKB",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };