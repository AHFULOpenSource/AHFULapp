import "./Settings.css";
import "../Stylesheets/Themes/Lightmode.css";
import "../Stylesheets/Themes/Darkmode.css";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DropdownRow, ActionRow } from "./SettingsHook.jsx";
import { updateSetting, setSettings } from "./SettingsSlice.jsx";
import { updateUserSettings } from "./QueryFunctionsAuth.js";

export function Settings() {
  const dispatch = useDispatch();
  const answers = useSelector((state) => state.setting);
  const user = useSelector((state)  => state.auth.user);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

const update = (key, val) => {
  dispatch(updateSetting({ key, value: val }));
  
  // Auto-save theme changes immediately to backend
  if (key === "theme" && user && user._id) {
    updateUserSettings(user._id, { 
      theme: val === "dark" ? "dark" : "light" 
    }).catch(err => console.error("Failed to save theme:", err));
  }
};

  useEffect(() => {
    if (answers.theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [answers.theme]);

  const handleSave = () => {
    if (!user || !user._id) return;

    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      theme: answers.theme === "dark" ? "dark" : "light",
      units: answers.units.toLowerCase(),
      goals: answers.goals.toLowerCase().replace(" ", "_"),
      shameLevel: answers.shame === "Off" ? "low" : "medium",
      availableEquipment: answers.equipment
        .toLowerCase()
        .replace(" ", "_"),
      gender: answers.gender || "",
      pronouns: answers.pronouns || "",
      dateOfBirth: answers.dateOfBirth || "",
      locations: answers.locations || [],
      tutorialComplete: answers.tutorialComplete ?? false,
    };

    updateUserSettings(user._id, payload)
      .then(() => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      })
      .catch((err) => {
        console.error("Failed to save settings:", err);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-content">
          <h2>Personal Settings</h2>

          <DropdownRow
            label="Theme"
            options={["light", "dark"]}
            value={answers.theme}
            onChange={(v) => update("theme", v)}
          />

          <DropdownRow
            label="Goals"
            options={["Lose Fat", "Build Muscle", "Maintain"]}
            value={answers.goals}
            onChange={(v) => update("goals", v)}
          />

          <DropdownRow
            label="Shame Level"
            options={["Off", "On"]}
            value={answers.shame}
            onChange={(v) => update("shame", v)}
          />

          <DropdownRow
            label="Units"
            options={["Imperial", "Metric"]}
            value={answers.units}
            onChange={(v) => update("units", v)}
          />          
          
          <DropdownRow
            label="Timezone"
            options={["PST", "MST", "CST", "EST"]}
            value={answers.timezone}
            onChange={(v) => update("timezone", v)}
          />

          <div className="setting-row">
            <span className="setting-label">Gender</span>
            <div className="setting-control">
              <input
                type="text"
                value={answers.gender || ""}
                onChange={(e) => update("gender", e.target.value)}
                placeholder="Enter gender"
                className="setting-input"
              />
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Pronouns</span>
            <div className="setting-control">
              <input
                type="text"
                value={answers.pronouns || ""}
                onChange={(e) => update("pronouns", e.target.value)}
                placeholder="e.g. they/them"
                className="setting-input"
              />
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Date of Birth</span>
            <div className="setting-control">
              <input
                type="date"
                value={answers.dateOfBirth || ""}
                onChange={(e) =>
                  update("dateOfBirth", e.target.value)
                }
                className="setting-input"
              />
            </div>
          </div>

          <h2>Workout Settings</h2>

          <DropdownRow
            label="Available Equipment"
            options={["None", "Basic", "Full Gym"]}
            value={answers.equipment}
            onChange={(v) => update("equipment", v)}
          />

          <h2>Account Settings</h2>

          <ActionRow label="Download Workout Data" buttonText="Download" />
          <ActionRow label="Export Progress" buttonText="Export" />
          <ActionRow label="Delete Account" buttonText="Delete" />

          <div className="settings-save-section">
            <button
              className="settings-save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>

            {saveSuccess && (
              <span className="save-success">Settings saved!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}