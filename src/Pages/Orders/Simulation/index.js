import React, { useState } from "react";
import Simulation from "./Selections";
import Executions from "./Executions";
import "../style/Dashboard.css";

const SimulationDashboard = () => {
  const [activeTab, setActiveTab] = useState("selections");

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <button
          className={`nav-button ${activeTab === "selections" ? "active" : ""}`}
          onClick={() => setActiveTab("selections")}
        >
          Selections
        </button>
                <button
          className={`nav-button ${activeTab === "executions" ? "active" : ""}`}
          onClick={() => setActiveTab("executions")}
        >
          Executions
        </button>
      </nav>

      {activeTab === "selections" && <Simulation />}
      {activeTab === "executions" && <Executions />}
    </div>
  );
};

export default SimulationDashboard;
