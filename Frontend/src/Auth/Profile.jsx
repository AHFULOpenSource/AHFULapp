import "./Profile.css";
import "../siteStyles.css";

import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { HandleAHFULSignOut } from "./HandleAHFULLogout.js";
import { setSettings, settingsInitialState } from "./SettingsSlice.jsx";
import {registerService} from "../firebase.js";
import { updateUserSettings } from "./QueryFunctions-Auth.js";
import { useNavigate } from "react-router-dom";
import { HandleAHFULPasswordReset } from "./HandleAHFULPasswordReset.js";
import { GetFirebaseUser } from "./GetFirebaseUser.js";

export function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);

  const { user, loading: authLoading } = GetFirebaseUser();
  const emailVerified = user?.emailVerified;

  // prefer settings slice bio so it persists across refreshes
  const settingsBio = useSelector((state) => state.setting?.user_bio);
  const userId = useSelector((state) => state.setting.user_id);


  useEffect(() => {
    setBio(settingsBio);
  }, [ settingsBio]);

  const handleSaveBio = async () => {
    try {
      await updateUserSettings(userId, { user_bio: bio });
      // mirror into Redux so the UI (and refresh) will show the new bio
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
    } else {
      console.error("User ID not available");
    }
  };

  return (
  <div className="page-layout">
    <div className="left-column" />
    <div className="center-column">
      <div className="profile-card">
        <div className="profile-title">
          <h1>Profile</h1>
        </div>
    
      {/* Profile Picture */}
      <div className="profile-picture-section">
        <img
          className="profile-picture"
          src={user?.photoURL || "https://ui-avatars.com/api/?name=AH&background=c3cfe2&color=333&size=150"}
          alt={`${user?.name || "User"}'s profile`}
          referrerPolicy="no-referrer"
        />
        <h2 className="profile-name">{user?.name || "User"}</h2>
        <p className="profile-email">{user?.email || ""}</p>
      </div>

      {emailVerified && (
        <>
          {/* Bio Section */}
          <div className="profile-bio-section">
            <div className="profile-bio-header">
              <h3>Bio</h3>
              <button
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

          {/* Notifications */}
          <div className="profile-notifications-section">
            <button className="profile-page-btn" onClick={handleEnableNotifications}>
              Enable Push Notifications
            </button>
            <br />
            <br />
            <button className="profile-page-btn" onClick={() => navigate("/ExploreFriends")}>
              Explore Friends
            </button>
          </div>
        </>
      )}

      <div className="profile-actions-section">
        <button
          className="profile-page-btn"
          onClick={() => HandleAHFULPasswordReset(UserData.email)}
        >
          Reset Password
        </button>
      </div>

      {/* Logout */}
      <div className="profile-logout-section">
        <button
          className="profile-logout-btn"
          id="logout-btn"
          onClick={() => {
            HandleAHFULSignOut();
            dispatch(setSettings(settingsInitialState));
          }}
        >
          Logout
        </button>
      </div>

      {/* Settings Bottom-right button */}
      {emailVerified && (
      <div className="profile-settings-wrapper">
        <button
          className={`profile-settings-trigger ${open ? "active" : ""}`}
          onClick={() => navigate("/Settings")}
        >
          ⚙️
        </button>
      </div>
      )}

      </div>
    </div>
    <div className="right-column" />
  </div>
  );
}
