import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./style/SuppliersDashboard.css";

const SuppliersDashboard = () => {
  return (
    <div className="suppliers-dashboard">
      <h2 className="manage-suppliers-title">Manage Suppliers</h2>
      <h3>
        Choose whether you want to add a new supplier or view and modify
        existing ones.
      </h3>
      <div className="sub-tab-switcher">
        <NavLink
          to="add-supplier"
          className={({ isActive }) => `sub-tab ${isActive ? "active" : ""}`}
        >
          ➕ Add New Supplier
        </NavLink>
        <NavLink
          to="list-of-suppliers"
          className={({ isActive }) => `sub-tab ${isActive ? "active" : ""}`}
        >
          📋 Suppliers List
        </NavLink>
      </div>
      <div className="sub-tab-content">
        <Outlet />
      </div>
    </div>
  );
};

export default SuppliersDashboard;
