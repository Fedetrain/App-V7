// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";


// Configurazione del progetto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAoeVM4luCHr8Irz-_K1E1aOLQP-2iV858",
    authDomain: "appuntamentiv2.firebaseapp.com",
    projectId: "appuntamentiv2",
    storageBucket: "appuntamentiv2.appspot.com",
    messagingSenderId: "175265749386",
    appId: "1:175265749386:web:ae0cd78f912a9dc9041073",
    measurementId: "G-8239522FZR"
  };

// Inizializzare Firebase
const app = initializeApp(firebaseConfig);

// Inizializzare Firebase Auth e Firestore
const auth = getAuth(app);
const messaging = getMessaging(app);
const db = getFirestore(app);


export { auth, db , firebaseConfig,messaging};
