import React from "react";
import "./style/ManagementDashboard.css";
import { NavLink, Outlet } from "react-router-dom";

const ManagementDashboard = () => {
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Management Dashboard</h1>
      <h2>Welcome to the dashboard. Choose a tab to get started.</h2>
      <div className="tab-switcher">
        <NavLink
          to="suppliers"
          className={({ isActive }) =>
            `tab-link ${isActive ? "active-tab" : ""}`
          }
        >
          Suppliers
        </NavLink>

        <NavLink
          to="clients"
          className={({ isActive }) =>
            `tab-link ${isActive ? "active-tab" : ""}`
          }
        >
          Clients
        </NavLink>
        <NavLink
          to="warehouses"
          className={({ isActive }) =>
            `tab-link ${isActive ? "active-tab" : ""}`
          }
        >
          Warehouses
        </NavLink>
        <NavLink
          to="carriers"
          className={({ isActive }) =>
            `tab-link ${isActive ? "active-tab" : ""}`
          }
        >
          Carriers
        </NavLink>
      </div>
      <div className="tab-content">
        <Outlet />
      </div>
    </div>
  );
};

export default ManagementDashboard;
