import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./style/ClientsDashboard.css";

const ClientsDashboard = () => {
  return (
    <div className="clients-dashboard">
      <h2 className="manage-clients-title">Manage Clients</h2>
      <h3>
        Choose whether you want to add a new client or view and modify existing
        ones.
      </h3>
      <div className="sub-tab-switcher">
        <NavLink
          to="add-client"
          className={({ isActive }) => `sub-tab ${isActive ? "active" : ""}`}
        >
          ➕ Add New Client
        </NavLink>
        <NavLink
          to="list-of-clients"
          className={({ isActive }) => `sub-tab ${isActive ? "active" : ""}`}
        >
          📋 Client List
        </NavLink>
      </div>
      <div className="sub-tab-content">
        <Outlet />
      </div>
    </div>
  );
};

export default ClientsDashboard;
