import React, { Fragment } from "react";
import { Routes, Route } from "react-router-dom";

import BackOrderComponent from "./BackOrder";
import AddOrder from "./AddOrder";
import SimulationDashboard from "./Simulation";
import OrderDetailsPage from "./OrderDetails/OrderDetailsPage";
import OrderSummary from "./OrderDetails/OrderSummary";
import PricingTableComponent from "./Pricing/PricingTableComponent";

const Elements = () => (
  <Fragment>
    <Routes>
      <Route path="backorder" element={<BackOrderComponent />} />
      <Route path="rfq-table" element={<PricingTableComponent />} />
      <Route path="add-order" element={<AddOrder />} />
      <Route path="simulation" element={<SimulationDashboard />} />
      <Route path="invoices" element={<OrderSummary />} />

      <Route path=":scp" element={<OrderDetailsPage />} />
    </Routes>
  </Fragment>
);

export default Elements;
