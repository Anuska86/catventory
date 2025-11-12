// 🔹 React & Router
import React, { Suspense, lazy, Fragment } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// 🔹 Loaders & Toasts
import Loader from "react-loaders";
import { ToastContainer } from "react-toastify";

// 🔹 Components
import PrivateRoute from "../../assets/components/loginSession/PrivateRoute";

// 🔹 Stock Pages (static imports)
import ProductShowcase from "../../Pages/Stock/Showcase/ProductShowcase";
import ProductEdit from "../../Pages/Stock/Showcase/ProductEdit";
import ListOfProducts from "../../Pages/Stock/ListOfProducts/ListProducts";
import ProductDetails from "../../Pages/Stock/ListOfProducts/ProductDetails";
import AddProduct from "../../Pages/Stock/AddProduct/AddProduct";
import EditSuppliers from "../../Pages/Stock/ListOfProducts/EditSuppliers";
import WarehouseProductDashboard from "../../Pages/Stock/Warehouses/WarehouseProductDashboard";

//🔹 User profile (static imports)
import UserProfile from "../../Pages/UserPages/UserProfile/UserProfile";
import ProfileSettings from "../../Pages/UserPages/UserProfile/ProfileSettings";
import ManageNotifications from "../../Pages/UserPages/UserProfile/ManageNotifications";
import EditProfile from "../../Pages/UserPages/UserProfile/EditProfile";
import LanguageSettings from "../../Pages/UserPages/UserProfile/LanguageSettings";
import NextArrivals from "../../Pages/Stock/Warehouses/NextArrivals";

// 🔹 Lazy-loaded Pages (after all static imports)
const UserTrack = lazy(() => import("../../Pages/Utils/UsersTrack/UserTrack"));
const UserPages = lazy(() => import("../../Pages/UserPages"));
const Applications = lazy(() => import("../../Pages/Applications"));
const Dashboard = lazy(() => import("./../../Pages/Dashboards/Dashboard"));
const Widgets = lazy(() => import("../../Pages/Widgets"));
const ManagementSuppliers = lazy(() => import("../../Pages/Suppliers"));
const Elements = lazy(() => import("../../Pages/Elements"));
const Components = lazy(() => import("../../Pages/Components"));
const Charts = lazy(() => import("../../Pages/Charts"));
const Forms = lazy(() => import("../../Pages/Forms"));
const Tables = lazy(() => import("../../Pages/Tables"));
const Orders = lazy(() => import("../../Pages/Orders"));
const Billing = lazy(() => import("../../Pages/Billing"));
const Purchases = lazy(() => import("../../Pages/Purchases"));
/*
const CreatePurchase = lazy(() =>
  import("../../Pages/Purchases/CreatePurchase/CreatePurchase")
);
*/
const Utils = lazy(() => import("../../Pages/Utils"));
const Stock = lazy(() => import("../../Pages/Stock"));
const Settings = lazy(() => import("../../Pages/Settings"));
const NotificationsPage = lazy(() =>
  import("../../Pages/Notifications/NotificationsPage")
);

const AppMain = () => {
  return (
    <Fragment>
      <Routes>
        {/* NO PRIVATE ROUTES */}
        {/* Login */}
        <Route
          path="/login/*"
          element={
            <Suspense fallback={<div>Loading login page...</div>}>
              <UserPages />
            </Suspense>
          }
        ></Route>

        {/* PRIVATE ROUTES */}

        {/* Components */}
        <Route
          path="/components/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Components examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Components examples. This wouldn't happen in a
                          real live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Components />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Forms */}
        <Route
          path="/forms/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Forms examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Forms examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Forms />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Settings examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Forms examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Settings />
              </Suspense>
            </PrivateRoute>
          }
        />

        <Route
          path="/settings/edit-profile"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse" />
                      </div>
                      <h6 className="mt-3">
                        Loading Edit Profile...
                        <small>
                          This is just a demo, so everything loads at once.
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <EditProfile />
              </Suspense>
            </PrivateRoute>
          }
        />

        <Route
          path="/settings/notifications"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse" />
                      </div>
                      <h6 className="mt-3">
                        Loading Notifications...
                        <small>
                          This is just a demo, so everything loads at once.
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <ManageNotifications />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/language"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse" />
                      </div>
                      <h6 className="mt-3">
                        Language Settings
                        <small>
                          This is just a demo, so everything loads at once.
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <LanguageSettings />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Charts */}
        <Route
          path="/charts/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-rotate" />
                      </div>
                      <h6 className="mt-3">
                        Please wait while we load all the Charts examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Charts examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Charts />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Tables */}
        <Route
          path="/tables/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Tables examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Tables examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Tables />
              </Suspense>
            </PrivateRoute>
          }
        />
        {/* Suppliers */}
        <Route
          path="/management/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Orders examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Tables examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <ManagementSuppliers />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Orders */}
        <Route
          path="/orders/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Orders examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Tables examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Orders />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Billing */}
        <Route
          path="/billing/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Billing examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Tables examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Billing />
              </Suspense>
            </PrivateRoute>
          }
        />
        {/* Purchase */}
        <Route
          path="/purchase/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Purchase examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Tables examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Purchases />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Utils */}
        <Route
          path="/utils/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Utils examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Tables examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Utils />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* User Tracks */}
        <Route
          path="/user-track/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Loading audit trail...
                        <small>
                          Please wait while we fetch user activity logs from the
                          system.
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <UserTrack />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Stock */}
        <Route
          path="/stock/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">
                        Please wait while we load all the Stock examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Tables examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Stock />
              </Suspense>
            </PrivateRoute>
          }
        >
          <Route path="catalog/showcase" element={<ProductShowcase />} />
          <Route path="edit/:id" element={<ProductEdit />} />
          <Route path="list-of-products" element={<ListOfProducts />} />
          <Route path="warehouse/showcase" element={<WarehouseProductDashboard />} />
          <Route path="warehouse/next-arrivals" element={<NextArrivals />} />
          <Route path="details/:id" element={<ProductDetails />} />
          <Route path="edit-suppliers/:id" element={<EditSuppliers />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="*" element={<div>Page not found</div>} />
        </Route>

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-rise" />
                      </div>
                      <h6 className="mt-5">Loading Notifications Page...</h6>
                    </div>
                  </div>
                }
              >
                <NotificationsPage />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Elements */}
        <Route
          path="/elements/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="line-scale" />
                      </div>
                      <h6 className="mt-3">
                        Please wait while we load all the Elements examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Elements examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Elements />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Dashboard Widgets */}
        <Route
          path="/widgets/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse-sync" />
                      </div>
                      <h6 className="mt-3">
                        Please wait while we load all the Dashboard Widgets
                        examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Dashboard Widgets examples. This wouldn't happen
                          in a real live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Widgets />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Pages */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="line-scale-rise" />
                      </div>
                      <h6 className="mt-3">
                        Please wait while we load all the Pages examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Pages examples. This wouldn't happen in a real
                          live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <UserPages />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Applications */}
        <Route
          path="/apps/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-pulse" />
                      </div>
                      <h6 className="mt-3">
                        Please wait while we load all the Applications examples
                        <small>
                          Because this is a demonstration we load at once all
                          the Applications examples. This wouldn't happen in a
                          real live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Applications />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* Dashboards */}
        <Route
          path="/dashboards/*"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <div className="loader-container">
                    <div className="loader-container-inner">
                      <div className="text-center">
                        <Loader type="ball-grid-cy" />
                      </div>
                      <h6 className="mt-3">
                        Please wait while we load all the Dashboards examples
                        <small>
                          Because this is a demonstration, we load at once all
                          the Dashboards examples. This wouldn't happen in a
                          real live app!
                        </small>
                      </h6>
                    </div>
                  </div>
                }
              >
                <Dashboard />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/*<Route path="/" element={<Navigate to="/dashboards/crm" replace />} />*/}

        {/* Default redirect */}

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer />
    </Fragment>
  );
};

export default AppMain;
