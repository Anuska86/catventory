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

  // Inside UserBoxWrapper.jsx
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const db = getFirestore();
        // If we have a specific ID (like user_001), use it;
        // otherwise use the logged-in user's UID
        const targetId = userId || (isLoggedIn ? currentUser.uid : null);

        if (targetId) {
          const userRef = doc(db, "users", targetId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setDisplayUser({ ...userSnap.data(), userId: userSnap.id });
          } else {
            // Fallback to Auth Info if Firestore doc is missing
            console.warn(
              `User document ${targetId} not found in Firestore. Using Auth fallback.`,
            );
            setDisplayUser({
              userId: currentUser?.uid || "guest",
              email: currentUser?.email || "No email",
              displayName: currentUser?.displayName || "Guest User",
              role: "viewer",
            });
          }
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
