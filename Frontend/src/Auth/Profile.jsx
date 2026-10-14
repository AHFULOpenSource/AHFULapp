import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Profile.css";
import "../siteStyles.css";
import { DropdownRow, ActionRow } from "./SettingsHook.jsx";
import { updateSetting, setSettings } from "./SettingsSlice.jsx";
import { updateUserSettings } from "./QueryFunctions-Auth.js";
import { HandleAHFULPasswordReset } from "./HandleAHFULPasswordReset.js";
import { GetFirebaseUser } from "./GetFirebaseUser.js";
import { registerService } from "../firebase.js";

export function Profile() {
  const dispatch = useDispatch();
  const answers = useSelector((state) => state.setting);
  const userId = useSelector((state) => state.setting?.user_id);
  const settingsBio = useSelector((state) => state.setting?.user_bio);

  const { user, loading: authLoading } = GetFirebaseUser();
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("");

  useEffect(() => {
    setBio(settingsBio || "");
  }, [settingsBio]);

  useEffect(() => {
    if (answers.theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [answers.theme]);

  const getBackendSettingsPayload = (key, val) => {
    switch (key) {
      case "theme":
        return { theme: val === "dark" ? "dark" : "light" };
      case "goals":
        return { goals: String(val).toLowerCase().replace(/ /g, "_") };
      case "shame":
        return { shame: val, shameLevel: String(val).toLowerCase() };
      case "units":
        return { units: String(val).toLowerCase() };
      case "timezone":
        return { timezone: val };
      case "equipment":
        return { equipment: val, availableEquipment: String(val).toLowerCase().replace(/ /g, "_") };
      case "gender":
        return { gender: val };
      case "pronouns":
        return { pronouns: val };
      case "dateOfBirth":
        return { dateOfBirth: val };
      default:
        return { [key]: val };
    }
  };

  const update = (key, val) => {
    dispatch(updateSetting({ key, value: val }));

    // Auto-save setting changes immediately to backend
    if (userId) {
      const payload = getBackendSettingsPayload(key, val);
      updateUserSettings(userId, payload).catch((err) =>
        console.error(`Failed to auto-save ${key}:`, err)
      );
    }
  };

  const handleSaveBio = async () => {
    try {
      await updateUserSettings(userId, { user_bio: bio });
      dispatch(setSettings({ user_bio: bio }));
      setIsEditingBio(false);
    } catch (err) {
      console.error("Failed to save bio:", err);
      alert("Failed to save bio. Please try again.");
    }
  };

  const handleEnableNotifications = () => {
    if (userId) {
      registerService(userId);
      setNotificationStatus("Push notifications registered.");
      setTimeout(() => setNotificationStatus(""), 60000);
    } else {
      console.error("User ID not available");
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-title">
          <h1>Profile & Settings</h1>
        </div>

        {/* Profile Picture & User Info */}
        <div className="profile-picture-section">
          <img
            className="profile-picture"
            src={
              user?.photoURL ||
              "https://ui-avatars.com/api/?name=AH&background=c3cfe2&color=333&size=150"
            }
            alt={`${user?.displayName || "AHFUL Athlete"}'s profile`}
            referrerPolicy="no-referrer"
          />
          <h2 className="profile-name">{user?.displayName || "AHFUL Athlete"}</h2>
          <p className="profile-email">{user?.email || ""}</p>
        </div>

        {/* Bio Section */}
        <div className="profile-bio-section">
          <div className="profile-bio-header">
            <h3>Bio</h3>
            <button
              type="button"
              className="profile-edit-btn"
              onClick={() => {
                if (isEditingBio) handleSaveBio();
                else setIsEditingBio(true);
              }}
            >
              {isEditingBio ? "Save" : "Edit"}
            </button>
          </div>
          {isEditingBio ? (
            <textarea
              className="profile-bio-input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={300}
            />
          ) : (
            <p className="profile-bio-text">
              {bio || "No Bio Yet. Click Edit to Add One!"}
            </p>
          )}
        </div>

        {/* Personal Settings */}
        <div className="profile-section-heading">
          <h2>Personal Settings</h2>
        </div>

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
          options={["Off", "Light", "Intense", "Brutal"]}
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
              onChange={(e) => dispatch(updateSetting({ key: "gender", value: e.target.value }))}
              onBlur={(e) => update("gender", e.target.value)}
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
              onChange={(e) => dispatch(updateSetting({ key: "pronouns", value: e.target.value }))}
              onBlur={(e) => update("pronouns", e.target.value)}
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
              onChange={(e) => update("dateOfBirth", e.target.value)}
              className="setting-input"
            />
          </div>
        </div>

        {/* Workout Settings */}
        <div className="profile-section-heading">
          <h2>Workout Settings</h2>
        </div>

        <DropdownRow
          label="Available Equipment"
          options={["Bodyweight Only", "Dumbbells", "Bands", "Full Gym"]}
          value={answers.equipment}
          onChange={(v) => update("equipment", v)}
        />

        {/* Account Settings */}
        <div className="profile-section-heading">
          <h2>Account Settings</h2>
        </div>

        <ActionRow
          label="Push Notifications"
          buttonText="Enable"
          onClick={handleEnableNotifications}
        />

        <ActionRow
          label="Password"
          buttonText="Reset Password"
          onClick={() => {
            if (user?.email) {
              HandleAHFULPasswordReset(user.email);
              alert("Password reset email sent to " + user.email);
            }
          }}
        />

        <ActionRow
          label="Download Workout Data"
          buttonText="Download"
          onClick={() => alert("UNDER CONSTRUCTION: Alerting Workout data download request initiated.")}
        />
        <ActionRow
          label="Export Progress"
          buttonText="Export"
          onClick={() => alert("UNDER CONSTRUCTION: Alerting Progress export initiated.")}
        />
        <ActionRow
          label="Delete Account"
          buttonText="Delete"
          onClick={() => alert("UNDER CONSTRUCTION: Alerting Account deletion requires confirmation.")}
        />

        {notificationStatus && (
          <p className="save-success" style={{ marginTop: 12, textAlign: "right" }}>
            {notificationStatus}
          </p>
        )}
      </div>
    </div>
  );
}
