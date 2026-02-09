import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// La configuración de tu proyecto de Firebase.
// Es crucial usar variables de entorno para las credenciales.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Inicializa la app de Firebase con la configuración.
const app = initializeApp(firebaseConfig);

// Inicializa los servicios que vayas a usar y los exporta.
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Exporta las instancias de los servicios.
export { app, auth, db, storage };
