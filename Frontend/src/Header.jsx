import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateSetting } from "./Auth/SettingsSlice";
import { updateUserSettings } from "./Auth/QueryFunctionsAuth.js";
import "./siteStyles.css";
import "./Stylesheets/Themes/Lightmode.css";
import "./Stylesheets/Themes/Darkmode.css";

export function Header({ onMenuToggle = null, isMenuOpen = false, onNavClick = null }) {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.setting?.theme || "light");
  const user = useSelector((state) => state.auth.user);

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    dispatch(updateSetting({ key: "theme", value: newTheme }));
    
    if (user && user._id) {
      updateUserSettings(user._id, { 
        theme: newTheme === "dark" ? "dark" : "light" 
      }).catch(err => console.error("Failed to save theme:", err));
    }
  };

  return (
    <div className="header">
      <button
        className={`hamburger-menu ${isMenuOpen ? "active" : ""}`}
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <NavLink to="/Dashboard" className="logo">AHFUL</NavLink>
      <div className="header-right">
        <button
          className="theme-toggle"
          onClick={handleThemeToggle}
          aria-label="Toggle theme"
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <NavLink to="/Profile" className="profile-link" onClick={() => { if (onNavClick) onNavClick(); }}>Profile</NavLink>
      </div>
    </div>
  );
}
