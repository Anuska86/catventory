import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FormGroup, Label, Input, Button } from "reactstrap";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import "./style/ManageNotifications.css";

const ManageNotifications = () => {
  const location = useLocation();
  const userId = location.state?.userId;

  const [levels, setLevels] = useState({
    critical: true,
    high: true,
    moderate: false,
    low: false,
  });

  useEffect(() => {
    console.log("Fetching preferences for userId:", userId);

    const fetchPreferences = async () => {
      if (!userId || typeof userId !== "string") {
        console.error("Invalid userId:", userId);
        return;
      }

      const db = getFirestore();
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const prefs = userSnap.data()?.settings?.notifications?.levels;
        console.log("User data:", userSnap.data());
        console.log("Notification levels:", prefs);

        if (prefs && typeof prefs === "object" && !Array.isArray(prefs)) {
          setLevels(prefs);
        } else {
          console.warn("Invalid levels format, using defaults");
          setLevels({
            critical: true,
            high: true,
            moderate: false,
            low: false,
          });
        }
      } else {
        console.warn("No user found, using default preferences");
        setLevels({
          critical: true,
          high: true,
          moderate: false,
          low: false,
        });
      }
    };

    fetchPreferences();
  }, [userId]);

  if (!userId) {
    return <p className="text-danger">Error: User ID not provided.</p>;
  }

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setLevels((prev) => ({ ...prev, [name]: checked }));
  };

  const savePreferences = async () => {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      "settings.notifications.levels": levels,
    });
    toast.success("Preferences saved!");
  };

  //Select Notifications
  const selectAll = () => {
    setLevels({ critical: true, high: true, moderate: true, low: true });
  };

  const clearAll = () => {
    setLevels({ critical: false, high: false, moderate: false, low: false });
  };

  return (
    <div className="notifications-page">
      <h2>Manage Notifications</h2>
      <FormGroup check>
        <Label check>
          <Input
            type="checkbox"
            name="critical"
            checked={levels.critical}
            onChange={handleChange}
          />
          Critical
        </Label>
        <small className="text-muted d-block ms-4">
          Security breaches, system failures
        </small>
      </FormGroup>
      <FormGroup check>
        <Label check>
          <Input
            type="checkbox"
            name="high"
            checked={levels.high}
            onChange={handleChange}
          />
          High
        </Label>
        <small className="text-muted d-block ms-4">
          System updates, performance warnings
        </small>
      </FormGroup>
      <FormGroup check>
        <Label check>
          <Input
            type="checkbox"
            name="moderate"
            checked={levels.moderate}
            onChange={handleChange}
          />
          Moderate
        </Label>
        <small className="text-muted d-block ms-4">
          Informational updates, tips
        </small>
      </FormGroup>
      <FormGroup check>
        <Label check>
          <Input
            type="checkbox"
            name="low"
            checked={levels.low}
            onChange={handleChange}
          />
          Low
        </Label>
        <small className="text-muted d-block ms-4">
          invoice pending approval
        </small>
      </FormGroup>

      <div className="notifications-divider"></div>

      <div className="d-flex gap-2 mt-2">
        <Button color="success" size="sm" onClick={selectAll}>
          Select All
        </Button>
        <Button color="danger" size="sm" onClick={clearAll}>
          Clear All
        </Button>
      </div>
      <div className="notifications-divider"></div>

      <button
        className="notifications-preferences-save-btn"
        onClick={savePreferences}
      >
        Save Preferences
      </button>
    </div>
  );
};

export default ManageNotifications;
