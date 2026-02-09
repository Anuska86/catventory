import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../utils/firebase";
import "./style/UserProfile.css";
import ProfileSettings from "./ProfileSettings";

import {
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  Nav,
  NavItem,
  NavLink,
  Button,
} from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown } from "@fortawesome/free-solid-svg-icons";
import LogoutButton from "../../../assets/components/loginSession/LogoutButton";

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const userRef = doc(db, "users", userId);

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUser({
            uid: userSnap.id,
            userId: userSnap.id,
            name: data.displayName || data.name || "Unknown User",
            position: data.role || data.position || "Staff",

            avatarUrl:
              data.photoURL ||
              "https://www.freepik.com/free-vector/redhaired-woman-with-braid_356306545.htm",
            // Ensure settings exists even if missing in Firestore
            settings: data.settings || { notifications: { email: false } },
            ...data,
          });
        } else {
          console.warn("No user found for ID:", userId);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [userId]);

  if (!userId) return <p>No user ID provided.</p>;
  if (loading) return <p>Loading profile...</p>;
  if (!user) return <p>User not found.</p>;

  const handleChange = (field, value) => {
    setUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingsChange = (field, value) => {
    setUser((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, user);
    setEditing(false);
  };

  return showSettings ? (
    <ProfileSettings
      user={user}
      onChange={handleChange}
      onSettingsChange={handleSettingsChange}
      onSave={handleSave}
      onClose={() => setShowSettings(false)}
    />
  ) : (
    <UncontrolledButtonDropdown>
      <DropdownToggle color="link" className="p-0 user-profile-toggle">
        <img src={user.avatarUrl} alt="Avatar" />
        <FontAwesomeIcon className="icon" icon={faAngleDown} />
      </DropdownToggle>

      <DropdownMenu className="user-profile-dropdown">
        <div className="user-profile-header">
          <div className="widget-heading">{user.name}</div>
          <div className="widget-subheading">{user.position}</div>
        </div>

        <Nav vertical className="user-profile-nav">
          <NavItem className="nav-item-header">Activity</NavItem>
          {user?.settings?.notifications?.email && (
            <NavItem>
              <NavLink href="#">Email Alerts</NavLink>
            </NavItem>
          )}
          <NavItem>
            <NavLink href="#">Chat</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="#">Recover Password</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="#" onClick={() => setShowSettings(true)}>
              Settings
            </NavLink>
          </NavItem>
        </Nav>

        <Nav vertical>
          <NavItem className="nav-item-divider" />
          <NavItem className="nav-item-btn text-center">
            <div className="user-profile-actions">
              <Button className="btn-wide" color="primary">
                Open Messages
              </Button>
            </div>
          </NavItem>
        </Nav>

        <div className="user-profile-logout">
          <LogoutButton />
        </div>
      </DropdownMenu>
    </UncontrolledButtonDropdown>
  );
};

export default UserProfile;
