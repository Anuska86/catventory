import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style/ProfileSettings.css";

const ProfileSettings = ({
  user,
  onChange,
  onSettingsChange,
  onSave,
  onClose,
}) => {
  const [editing, setEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("profile");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    onSettingsChange("notifications", {
      ...user.settings.notifications,
      [name]: checked,
    });
  };

  return (
    <div className="profile-settings">
      <h2>Profile Settings</h2>

      <div className="settings-tabs">
        {console.log("ProfileSettings user object:", user)}
        <button
          disabled={!user || !(user.userId || user.uid)}
          onClick={() => {
            const id = user?.userId || user?.uid;
            console.log("Navigating with userId:", id);
            if (!id) {
              alert("User ID is missing!");
              return;
            }
            navigate("/settings/notifications", {
              state: { userId: id },
            });
            onClose();
          }}
        >
          Manage notifications
        </button>
        <button
          disabled={!user || !(user.userId || user.uid)}
          onClick={() => {
            const id = user?.userId || user?.uid;
            console.log("Navigating to language settings with userId:", id);
            if (!id) {
              alert("User ID is missing!");
              return;
            }
            navigate("/settings/language", {
              state: { userId: id },
            });
            onClose();
          }}
        >
          Manage language
        </button>
      </div>

      <div className="button-group">
        <button onClick={onClose}>Back</button>
      </div>
    </div>
  );
};

export default ProfileSettings;
