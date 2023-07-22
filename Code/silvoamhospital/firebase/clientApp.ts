import firebase, { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDdQxek0MV9iqLK5T3LG3GSNn2PT85Lpmk",
    authDomain: "silvoamhospital-f3cd3.firebaseapp.com",
    projectId: "silvoamhospital-f3cd3",
    storageBucket: "silvoamhospital-f3cd3.appspot.com",
    messagingSenderId: "188342945588",
    appId: "1:188342945588:web:0dd79e5e83c13ea8dcc761"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;