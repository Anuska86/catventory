import React, { Fragment } from "react";
import { Routes, Route } from "react-router-dom";
import ConfigurationComponent from "./Configuration";

const Elements = () => (
  <Fragment>
    <Routes>
      <Route path="configuration" element={<ConfigurationComponent />} />
    </Routes>
  </Fragment>
);

export default Elements;
