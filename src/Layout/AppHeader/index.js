import React, { Fragment } from "react";
import "./Components/style/indexAppHeader.css";

import cx from "classnames";

import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";

import { connect } from "react-redux";

import { CSSTransition, TransitionGroup } from "../../utils/TransitionWrapper";

import HeaderLogo from "../AppLogo";

import SearchBoxWrapper from "./Components/SearchBoxWrapper";
import UserBoxWrapper from "./Components/UserBoxWrapper";

const Header = ({
  headerBackgroundColor,
  enableMobileMenuSmall,
  enableHeaderShadow,
}) => {
  const { currentUser, loading } = useAuth();

  const location = useLocation();

  const isLoginPage = location.pathname.startsWith("/login");
  const isLoggedIn = !loading && currentUser && !isLoginPage;

  return (
    <Fragment>
      {isLoggedIn ? (
        <TransitionGroup>
          <CSSTransition
            component="div"
            className={cx("app-header", headerBackgroundColor, {
              "header-shadow": enableHeaderShadow,
            })}
            appear={true}
            timeout={1500}
            enter={false}
            exit={false}
          >
            <HeaderLogo
              className={isLoggedIn ? "logo-left" : "logo-centered"}
            />

            <div
              className={cx("app-header__content", {
                "header-mobile-open": enableMobileMenuSmall,
              })}
            >
              <div className="app-header-right">
                <UserBoxWrapper userId="user_001" />
              </div>
            </div>
          </CSSTransition>
        </TransitionGroup>
      ) : (
        <div className="guest-header-bar">
          <div className="guest-header-content">
            <HeaderLogo />
            <div>
              <div className="guest-header-message">
                Welcome to <span className="brand-name">Catventory</span>
              </div>
              <div className="guest-header-tagline">
                Your gateway to smarter trading.
              </div>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  enableHeaderShadow: state.ThemeOptions.enableHeaderShadow,
  closedSmallerSidebar: state.ThemeOptions.closedSmallerSidebar,
  headerBackgroundColor: state.ThemeOptions.headerBackgroundColor,
  enableMobileMenuSmall: state.ThemeOptions.enableMobileMenuSmall,
});

const mapDispatchToProps = (dispatch) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
