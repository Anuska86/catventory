import React, { useState } from "react";
import "./style/Dashboard.css";
import Orders from "./Orders";
import Billing from "./Billing";
import UserKPI from "./UserKPI";
import WarehouseStatus from "./WarehouseStatus";
import RejectedOrders from "./RejectedOrders";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <button
          className={`nav-button ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
        <button
          className={`nav-button ${activeTab === "billing" ? "active" : ""}`}
          onClick={() => setActiveTab("billing")}
        >
          Billing
        </button>
        {/*
        <button
          className={`nav-button ${activeTab === "user-kpi" ? "active" : ""}`}
          onClick={() => setActiveTab("user-kpi")}
        >
          User Tracking
        </button>
        */}
        <button
          className={`nav-button ${
            activeTab === "warehouse-status" ? "active" : ""
          }`}
          onClick={() => setActiveTab("warehouse-status")}
        >
          Warehouse Status
        </button>
        <button
          className={`nav-button ${
            activeTab === "rejected-orders" ? "active" : ""
          }`}
          onClick={() => setActiveTab("rejected-orders")}
        >
          Rejected Orders
        </button>
      </nav>

      {activeTab === "orders" && <Orders />}
      {activeTab === "billing" && <Billing />}
      {activeTab === "user-kpi" && <UserKPI />}
      {activeTab === "warehouse-status" && <WarehouseStatus />}
      {activeTab === "rejected-orders" && <RejectedOrders />}
    </div>
  );
};

export default Dashboard;
