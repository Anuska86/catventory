import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "./style/LanguageSettings.css";

const LanguageSettings = ({ user, onSettingsChange, onBack, onSave }) => {
  const location = useLocation();
  const userId = location.state?.userId;

  const [selectedLanguage, setSelectedLanguage] = useState(
    user?.settings?.language || "en"
  );

  const availableLanguages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
  ];

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleSave = () => {
    onSettingsChange("language", selectedLanguage);
    if (onSave) {
      onSave();
    }
  };

  return (
    <div className="language-settings">
      <h2 className="language-settings-title">Language Preferences</h2>

      <label htmlFor="language-select">Choose your language:</label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={handleLanguageChange}
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>

      <div className="button-group">
        <button onClick={onBack}>Back</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default LanguageSettings;
