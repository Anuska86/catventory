import React, { Fragment } from "react";
import NotificationCard from "../../../Pages/Notifications/NotificationCard";
import "./style/UserBox.css";
import "../../../Pages/Notifications/NotificationCard.css";

import UserProfile from "../../../Pages/UserPages/UserProfile/UserProfile";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import SearchBox from "./SearchBox";

import { FaBell } from "react-icons/fa";

import {
  Popover,
  PopoverHeader,
  PopoverBody,
  Badge,
  ListGroup,
  ListGroupItem,
} from "reactstrap";

import PerfectScrollbar from "react-perfect-scrollbar";

import {
  DropdownToggle,
  DropdownMenu,
  Nav,
  Col,
  Row,
  Button,
  NavItem,
  NavLink,
  UncontrolledTooltip,
  UncontrolledButtonDropdown,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
} from "reactstrap";

import { toast, Bounce } from "react-toastify";

import { faAngleDown } from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "react-toastify/dist/ReactToastify.css";

import { Link, useLocation } from "react-router-dom";
import LogoutButton from "../../../assets/components/loginSession/LogoutButton";

import {
  fetchNotifications,
  markAsSolved,
  seedRealNotifications,
  deleteTestNotifications,
} from "../../../utils/notificationService";

class UserBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false,
      notifications: [],
      popoverOpen: false,
      unsolvedNotifications: [],
      selectedNotification: null,
      modalOpen: false,
      userId: null,
    };
  }

  //Close unsolved notifications
  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("mousedown", this.handleOutsideClick);
    this.loadNotifications();

    const auth = getAuth();
    this.unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setState({ userId: user.uid });
      }
    });
  }

  //deleteTestNotifications();

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("mousedown", this.handleOutsideClick);
  }

  handleOutsideClick = (event) => {
    const trigger = document.getElementById("NotifBell");
    const popover = document.querySelector(".popover");

    if (
      this.state.popoverOpen &&
      trigger &&
      !trigger.contains(event.target) &&
      popover &&
      !popover.contains(event.target)
    ) {
      this.setState({ popoverOpen: false });
    }
  };

  handleKeyDown = (e) => {
    if (e.key === "Escape") {
      this.setState({ popoverOpen: false });
    }
  };

  loadNotifications = async () => {
    const notifications = await fetchNotifications();
    this.setState({
      notifications,
      unsolvedNotifications: notifications.filter((n) => !n.solved),
    });
  };

  togglePopover = () => {
    this.setState((prev) => ({ popoverOpen: !prev.popoverOpen }));
  };

  notify2 = () =>
    (this.toastId = toast(
      "You don't have any new items in your calendar for today! Go out and play!",
      {
        transition: Bounce,
        closeButton: true,
        autoClose: 5000,
        position: "bottom-center",
        type: "success",
      }
    ));

  openNotificationDetail = (notification) => {
    this.setState({ selectedNotification: notification });
  };

  openModal = (notification) => {
    this.setState({
      selectedNotification: notification,
      modalOpen: true,
      popoverOpen: false,
    });
  };

  closeModal = () => {
    this.setState({
      selectedNotification: null,
      modalOpen: false,
    });
  };

  //SOLVED ALERT
  handleSolve = async (id) => {
    console.log("Solving notification:", id);
    await markAsSolved(id);
    this.setState({ solveMessage: "✅ The alert is solved." });

    setTimeout(() => {
      this.setState({ solveMessage: null });
    }, 3000);

    this.loadNotifications();
  };

  //USER

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    const { userId } = this.state;

    const levels = this.props.user?.settings?.notifications?.levels;
    const filteredNotifications = this.state.unsolvedNotifications.filter(
      (n) => {
        const importance = n.importance?.toLowerCase();
        if (!levels) return true;
        return importance && levels[importance] === true;
      }
    );

    return (
      <Fragment>
        {/* SEARCH ICON */}
        <div>
          <SearchBox />
        </div>
        {/* NOTIFICATION BELL */}
        <div className="widget-content-right header-user-info ms-3 d-none d-md-block">
          <Button
            id="NotifBell"
            color="link"
            onClick={this.togglePopover}
            className="position-relative"
          >
            <FaBell size={20} />
            {this.state.notifications.filter((n) => !n.solved).length > 0 && (
              <Badge
                color="danger"
                pill
                className="position-absolute top-0 start-100 translate-middle"
              >
                {this.state.notifications.filter((n) => !n.solved).length}
              </Badge>
            )}
          </Button>
          <Popover
            placement="bottom"
            isOpen={this.state.popoverOpen}
            target="NotifBell"
            toggle={this.togglePopover}
            className="custom-popover"
            modifiers={[
              {
                name: "offset",
                options: {
                  offset: [0, 10],
                },
              },
            ]}
          >
            <PopoverHeader className="text-center fw-bold">
              Unsolved Notifications
              <Button
                color="link"
                onClick={() => this.setState({ popoverOpen: false })}
              >
                Close ✖
              </Button>
            </PopoverHeader>

            <PopoverBody>
              {filteredNotifications.length === 0 ? (
                <p className="text-muted px-3 py-2">
                  No unsolved notifications.
                </p>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    data={notification}
                    onViewDetails={() => this.openModal(notification)}
                  />
                ))
              )}

              <div className="text-center mt-3">
                <Link to="/notifications">
                  <Button color="secondary" size="sm">
                    View All Notifications
                  </Button>
                </Link>
              </div>
            </PopoverBody>
          </Popover>
        </div>

        {/* NOTIFICATION DETAILS */}

        {this.state.selectedNotification && (
          <Modal
            isOpen={this.state.modalOpen}
            toggle={this.closeModal}
            size="md"
          >
            <ModalHeader toggle={this.closeModal}>
              Notification Details
            </ModalHeader>
            <ModalBody>
              <p>
                <strong>Description:</strong>{" "}
                {this.state.selectedNotification.description}
              </p>
              <p>
                <span className="notification-meta-label">Importance:</span>{" "}
                {this.state.selectedNotification.importance}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {this.state.selectedNotification.date
                  ? new Date(
                      this.state.selectedNotification.date.seconds * 1000
                    ).toLocaleString()
                  : "No date"}
              </p>

              {/* SOLVED ALERT*/}
              {this.state.solveMessage && (
                <Alert color="success" className="mt-3">
                  {this.state.solveMessage}
                </Alert>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="success"
                onClick={() =>
                  this.handleSolve(this.state.selectedNotification.id)
                }
              >
                <i className="fas fa-check-circle me-1"></i>
                Mark as Solved
              </Button>
              <Button color="secondary" onClick={this.closeModal}>
                <i className="fas fa-times me-1"></i>
                Close
              </Button>
            </ModalFooter>
          </Modal>
        )}

        {/* USER */}
        <div className="header-btn-lg pe-0">
          <div className="widget-content p-0">
            <div className="widget-content-wrapper">
              <div className="widget-content-left">
                <UserProfile userId="user_001" />
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export { UserBox as default };
