import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// La configuración de tu proyecto de Firebase.
// Es crucial usar variables de entorno para las credenciales.
const firebaseConfig = {
  apiKey: "AIzaSyD5LF2YkQyHY6Jxooo38Ux_kwFQxsx9fxI",
  authDomain: "tradeflow-98696.firebaseapp.com",
  projectId: "tradeflow-98696",
  storageBucket: "tradeflow-98696.firebasestorage.app",
  messagingSenderId: "100606286232",
  appId: "1:100606286232:web:2971e6224504fcd0b633ed",
  //meassurementId: "tradeflow-98696"
  measurementId: "G-XXXXXXXXXX",
};

// Inicializa la app de Firebase con la configuración.
const app = initializeApp(firebaseConfig);

// Inicializa los servicios que vayas a usar y los exporta.
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Exporta las instancias de los servicios.
export { app, auth, db, storage };
