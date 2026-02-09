// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "catventory.firebaseapp.com",
  projectId: "catventory",
  storageBucket: "catventory.firebasestorage.app",
  messagingSenderId: "236549268136",
  appId: "1:236549268136:web:060fee88d79d5c8e1e589d",
  measurementId: "G-4D76BL1XQJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services so you can use them in your Dashboard components
export const db = getFirestore(app);
export const auth = getAuth(app);
