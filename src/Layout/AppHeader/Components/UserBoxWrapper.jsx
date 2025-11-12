import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import UserBox from "./UserBox";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const UserBoxWrapper = ({ userId }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [displayUser, setDisplayUser] = useState(null);

  const isLoggedIn =
    !loading && currentUser && !location.pathname.startsWith("/login");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (userId) {
          const db = getFirestore();
          const userRef = doc(db, "users", userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const enrichedUser = { ...data, userId: userSnap.id };
            setDisplayUser(enrichedUser);
          } else {
            console.warn("Test user not found:", userId);
          }
        } else if (isLoggedIn) {
          const normalizedAuthUser = {
            userId: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "Anonymous",
            createdAt: currentUser.metadata.creationTime,
            lastSignIn: currentUser.metadata.lastSignInTime,
          };
          setDisplayUser(normalizedAuthUser);
        } else {
          console.warn("No userId and not logged in");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [userId, currentUser, isLoggedIn]);

  return displayUser ? (
    <UserBox user={displayUser} />
  ) : (
    <p className="text-muted">Loading user...</p>
  );
};

export default UserBoxWrapper;
