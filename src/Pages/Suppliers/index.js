import React from "react";

import { Routes, Route } from "react-router-dom";

import ManagementDashboard from "./ManagementDashboard";
import AddSupplier from "./AddSupplier/AddSupplier";
import SuppliersList from "./SuppliersList/SuppliersList";
import AddClient from "./Clients/AddClients/AddClient";
import ClientsList from "./Clients/ClientsList/ClientsList";
import SuppliersDashboard from "./SuppliersDashboard";
import ClientsDashboard from "./ClientsDashboard";

const ManagementSuppliers = () => (
  <Routes>
    <Route path="/" element={<ManagementDashboard />}>
      <Route
        index
        element={
          <div className="dashboard-home">
            <p>
              Please select a tab above to begin managing suppliers or clients.
            </p>
          </div>
        }
      />
      <Route path="suppliers" element={<SuppliersDashboard />}>
        <Route path="add-supplier" element={<AddSupplier />} />
        <Route path="list-of-suppliers" element={<SuppliersList />} />
      </Route>
      <Route path="clients" element={<ClientsDashboard />}>
        <Route path="add-client" element={<AddClient />} />
        <Route path="list-of-clients" element={<ClientsList />} />
      </Route>
    </Route>
  </Routes>
);

export default ManagementSuppliers;
