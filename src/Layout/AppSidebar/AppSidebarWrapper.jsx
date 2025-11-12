import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import AppSidebar from ".";


const AppSidebarWrapper = (props) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  const shouldShowSidebar =
    !loading && currentUser && !location.pathname.startsWith("/login");

  return shouldShowSidebar ? <AppSidebar {...props} /> : null;
};

export default AppSidebarWrapper;