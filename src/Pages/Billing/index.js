import React, { Fragment } from "react";
import { Routes, Route } from "react-router-dom";

import Status from "./Status";
import AddBillingComponent from "./AddBilling";

const Elements = () => (
  <Fragment>
    <Routes>
      <Route path="add-billing" element={<AddBillingComponent />} />
      <Route path="status" element={<Status />} />
    </Routes>
  </Fragment>
);

export default Elements;
