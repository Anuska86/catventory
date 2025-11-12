import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";

export const useOrderDetails = (scp) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scp) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const q = query(collection(db, "orders"), where("scp", "==", scp));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setOrder(docData);
        } else {
          console.log("No such order found with ID:", scp);
          setOrder(null);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [scp]);

  return { order, loading };
};
