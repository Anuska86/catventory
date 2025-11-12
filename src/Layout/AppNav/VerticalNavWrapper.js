import React, { Fragment, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { connect } from "react-redux";
import { setEnableMobileMenu } from "../../reducers/ThemeOptions";
import { useAuth } from "../../context/AuthContext";
import {
  UpgradeNav,
  MainNav,
  ComponentsNav,
  FormsNav,
  WidgetsNav,
  ChartsNav,
  ETLNav,
  SuppliersNav,
  UtilsNav,
  StockNav,
  OperationsNav,
} from "./NavItems";

const SubMenu = ({ item, toggleMobileSidebar }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const location = useLocation();

  const toggleSubMenu = (e) => {
    if (!item.to || item.content) {
      e.preventDefault();
      e.stopPropagation();
      setIsSubMenuOpen(!isSubMenuOpen);
    } else if (item.to && !item.external) {
      toggleMobileSidebar();
    }
  };

  const hasSubmenu = item.content && item.content.length > 0;

  // Determine if the parent or any child is active
  const isActive =
    location.pathname === item.to ||
    (hasSubmenu &&
      item.content.some((child) => child.to === location.pathname));

  React.useEffect(() => {
    setIsSubMenuOpen(isActive);
  }, [isActive]);

  const LinkComponent = item.external ? "a" : Link;
  const linkProps = item.external
    ? { href: item.to, target: "_blank", rel: "noopener noreferrer" }
    : { to: item.to || "#" };

  return (
    <li className={`metismenu-item ${isActive ? "active" : ""}`}>
      <LinkComponent
        {...linkProps}
        className={`metismenu-link ${isActive ? "active" : ""}`}
        onClick={toggleSubMenu}
        title={item.note || undefined}
      >
        <i className={`metismenu-icon ${item.icon}`} />
        {item.label}
        {hasSubmenu && (
          <i
            className={`metismenu-state-icon pe-7s-angle-${
              isSubMenuOpen ? "up" : "down"
            }`}
          />
        )}
      </LinkComponent>
      {hasSubmenu && (
        <ul className={`metismenu-container ${isSubMenuOpen ? "visible" : ""}`}>
          {item.content.map((child, i) => (
            <SubMenu
              key={i}
              item={child}
              toggleMobileSidebar={toggleMobileSidebar}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const Nav = ({ enableMobileMenu, setEnableMobileMenu }) => {
  const location = useLocation();
  const { currentUser, loading } = useAuth();

  if (loading || !currentUser || location.pathname.startsWith("/login")) {
    return null;
  }

  const toggleMobileSidebar = () => {
    if (enableMobileMenu) {
      setEnableMobileMenu(false);
    }
  };

  const renderMenu = (items) =>
    items.map((item, i) => (
      <SubMenu key={i} item={item} toggleMobileSidebar={toggleMobileSidebar} />
    ));

  return (
    <Fragment>
      <div className="vertical-nav-menu">
        <h5 className="app-sidebar__heading">Overview</h5>
        <ul className="metismenu-container">{renderMenu(MainNav)}</ul>

        <h5 className="app-sidebar__heading">Supplier & Client Panel</h5>
        <ul className="metismenu-container">{renderMenu(SuppliersNav)}</ul>

        <h5 className="app-sidebar__heading">Operations</h5>
        <ul className="metismenu-container">{renderMenu(OperationsNav)}</ul>

        <h5 className="app-sidebar__heading">Stock</h5>
        <ul className="metismenu-container">{renderMenu(StockNav)}</ul>

        <h5 className="app-sidebar__heading">Utils</h5>
        <ul className="metismenu-container">{renderMenu(UtilsNav)}</ul>
        {/*
        <h5 className="app-sidebar__heading">UI Components</h5>
        <ul className="metismenu-container">{renderMenu(ComponentsNav)}</ul>

        <h5 className="app-sidebar__heading">Dashboard Widgets</h5>
        <ul className="metismenu-container">{renderMenu(WidgetsNav)}</ul>

        <h5 className="app-sidebar__heading">Forms</h5>
        <ul className="metismenu-container">{renderMenu(FormsNav)}</ul>

        <h5 className="app-sidebar__heading">Charts</h5>
        <ul className="metismenu-container">{renderMenu(ChartsNav)}</ul>
*/}
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  enableMobileMenu: state.ThemeOptions.enableMobileMenu,
});

const mapDispatchToProps = (dispatch) => ({
  setEnableMobileMenu: (enable) => dispatch(setEnableMobileMenu(enable)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Nav);
