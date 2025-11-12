import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// Fetch all notifications (for now, no filter)
export const fetchNotifications = async () => {
  const snapshot = await getDocs(collection(db, "notifications"));

  const data = snapshot.docs.map((doc) => {
    const docData = { id: doc.id, ...doc.data() };

    return docData;
  });

  return data;
};

export const fetchSingleNotification = async () => {
  const ref = doc(db, "notifications", "DORQ0ULyULYQ4R0bnOuL");
  const snapshot = await getDoc(ref);
};

// Mark a notification as solved
export const markAsSolved = async (id) => {
  const ref = doc(db, "notifications", id);
  await updateDoc(ref, { solved: true });
};

/*
//Test Notifications

export const seedRealNotifications = async () => {
  const notifications = [
    {
      description: "Stock below minimums",
      importance: "Critical",
      solved: false,
      date: new Date("2025-08-07T07:31:54"),
    },
    {
      description: "New order arrived",
      importance: "Moderate",
      solved: true,
      date: new Date("2025-08-05T12:37:20"),
    },
    {
      description: "Payment date passed",
      importance: "Moderate",
      solved: false,
      date: new Date("2025-08-07T09:36:40"),
    },
  ];

  for (const n of notifications) {
    await addDoc(collection(db, "notifications"), n);
    console.log(`Added: ${n.description}`);
  }
};


*/
export const deleteTestNotifications = async () => {
  const snapshot = await getDocs(collection(db, "notifications"));
  const testDocs = snapshot.docs.filter(
    (doc) => doc.data().description === "Test notification"
  );

  for (const docRef of testDocs) {
    await deleteDoc(doc(db, "notifications", docRef.id));
  }
};
