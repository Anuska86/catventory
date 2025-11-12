import React, { useContext, createContext } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const auth = useAuth();
 

  if (!auth) return <div>Error: Auth context is undefined</div>;

  const { currentUser, loading } = auth;

  if (loading) {
    return <div>Loading...</div>;
  }

  return currentUser ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
