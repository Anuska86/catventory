import React, { Fragment } from "react";
import { Routes, Route } from "react-router-dom";

import CreatePurchaseComponent from "./CreatePurchase/CreatePurchase";
import PurchaseOverviewComponent from "./PurchaseOverview/PurchaseOverview";
import PurchaseInvoicesComponent from "./PurchaseInvoices/PurchaseInvoices";
import PurchaseForecastComponent from "./Forecast/Forecast";

const Elements = () => (
  <Fragment>
    <Routes>
      <Route path="create-purchase" element={<CreatePurchaseComponent />} />
      <Route path="overview" element={<PurchaseOverviewComponent />} />
      <Route path="invoices" element={<PurchaseInvoicesComponent />} />
      <Route path="forecast" element={<PurchaseForecastComponent />} />
    </Routes>
  </Fragment>
);

export default Elements;
