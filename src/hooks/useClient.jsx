import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";

export const useClient = (clientId) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    const fetchClient = async () => {
      try {
        console.log("Fetching client for ID:", clientId);

        const q = query(collection(db, "clients"), where("id", "==", clientId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          console.log("Client data found:", docData);
          setClient(docData);
        } else {
          console.log("No client document found for ID:", clientId);
          setClient(null);
        }
      } catch (error) {
        console.error("Error fetching client:", error);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  return { client, loading };
};
