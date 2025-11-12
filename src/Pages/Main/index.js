import React, { Fragment } from "react";
import "./style/indexMain.css";
import { useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { connect } from "react-redux";
import cx from "classnames";

import { useResizeDetector } from "react-resize-detector";

import AppMain from "../../Layout/AppMain";
import AppHeader from "../../Layout/AppHeader";
import AppSidebarWrapper from "../../Layout/AppSidebar/AppSidebarWrapper";
import AppSidebar from "../../Layout/AppSidebar";
import AppFooter from "../../Layout/AppFooter";
import ThemeOptions from "../../Layout/ThemeOptions";

const Main = (props) => {
  // Note: closedSmallerSidebar state removed as it was unused

  const auth = useAuth();
  const isLoggedIn = !!auth?.currentUser;
  const location = useLocation();

  const {
    colorScheme,
    enableFixedHeader,
    enableFixedSidebar,
    enableFixedFooter,
    enableClosedSidebar,
    enableMobileMenu,
    enablePageTabsAlt,
  } = props;

  const { width, ref } = useResizeDetector();
  const isLoginRoute = location.pathname === "/login";

  return (
    <Fragment>
      <div ref={ref}>
        <div
          className={cx("app-container app-theme-" + colorScheme, {
            "fixed-header": enableFixedHeader,
            "fixed-sidebar": enableFixedSidebar || width < 992,
            "fixed-footer": enableFixedFooter,
            "closed-sidebar": enableClosedSidebar || width < 992,
            "closed-sidebar-mobile": width < 992,
            "sidebar-mobile-open": enableMobileMenu,
            "body-tabs-shadow-btn": enablePageTabsAlt,
          })}
        >
          {isLoginRoute ? (
            <>
              <AppHeader /> {/* 👈 Add this */}
              <div className="login-fullscreen">
                <AppMain />
              </div>
            </>
          ) : isLoggedIn ? (
            <>
              <AppHeader />
              <div className="app-main">
                <AppSidebarWrapper />
                <div className="app-main__outer">
                  <div className="app-main__inner">
                    <AppMain />
                  </div>
                  <AppFooter />
                </div>
              </div>
            </>
          ) : (
            <div className="login-fullscreen">
              <AppMain />
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProp = (state) => ({
  colorScheme: state.ThemeOptions.colorScheme,
  enableFixedHeader: state.ThemeOptions.enableFixedHeader,
  enableMobileMenu: state.ThemeOptions.enableMobileMenu,
  enableFixedFooter: state.ThemeOptions.enableFixedFooter,
  enableFixedSidebar: state.ThemeOptions.enableFixedSidebar,
  enableClosedSidebar: state.ThemeOptions.enableClosedSidebar,
  enablePageTabsAlt: state.ThemeOptions.enablePageTabsAlt,
});

export default connect(mapStateToProp)(Main);
