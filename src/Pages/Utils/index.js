import React, { Fragment } from "react";
import { Routes, Route } from "react-router-dom";

import Currencies from "./Currencies/Currencies";
import UserTrack from "./UsersTrack/UserTrack";
import FleetCost from "./FleetCost";

const Elements = () => (
  <Fragment>
    <Routes>
      <Route path="fleet-cost" element={<FleetCost />} />
    </Routes>
    <Routes>
      <Route path="currencies" element={<Currencies />} />
    </Routes>
    <Routes>
      <Route path="user-track" element={<UserTrack />} />
    </Routes>
  </Fragment>
);

export default Elements;
