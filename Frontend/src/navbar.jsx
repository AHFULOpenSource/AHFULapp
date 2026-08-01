import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import "./siteStyles.css";
import { TOS } from "./TOS.jsx";
import { auth } from "./firebase.js";
import { GetFirebaseUser } from "./Auth/GetFirebaseUser.js";

export function Navbar({ minHeight, isOpen = false, onNavClick = null }) {
  const { user, loading: authLoading } = GetFirebaseUser();
  const emailVerified = user?.emailVerified;
  const [showTOS, setShowTOS] = useState(false);

  const handleNavClick = () => {
    if (onNavClick) {
      onNavClick();
    }
  };

  return (
    <nav className={`sidebar ${isOpen ? "open" : "closed"}`} style={{ minHeight }}>

      {( !emailVerified) ? (
        <>
          <NavLink
            to="/NotVerified"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Verify Email
          </NavLink>

          <button
            to="/TOS"
            onClick={() => setShowTOS(true)}
          >
            Terms of Service
          </button>
        </>

      ):(

        <>

          <NavLink
            to="/Dashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Dashboard Home
          </NavLink>

          <NavLink
            to="/Favorites"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Favorites Hub
          </NavLink>

          <NavLink
            to="/AIChat"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            AI Chat
          </NavLink>

          <NavLink
            to="/WorkoutLogger"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Log a Workout
          </NavLink>

          <NavLink
            to="/FoodLog"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Log Food
          </NavLink>

          <NavLink
            to="/MeasurementLogger"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Log a Measurement 
          </NavLink>

          <NavLink
            to="/HistoryPRs"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            History & PRs
          </NavLink>

          <NavLink
            to="/Templates"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            My Templates
          </NavLink>

          <NavLink
            to="/ExploreTasks"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            My Tasks
          </NavLink>

          <NavLink
            to="/SocialWorkouts"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Social Wall
          </NavLink>

          <NavLink
            to="/Map"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            Gym's & Map
          </NavLink>

          <button
            to="/TOS"
            onClick={() => setShowTOS(true)}
          >
            Terms of Service
          </button>
        </>
        )}

      <TOS isOpen={showTOS} onClose={() => setShowTOS(false)} />

      {/* { (user?.roles?.includes("Admin") && user?.email_verified == true) && (<a
        href="http://localhost:5000/api/APIDocs"
        target="_blank"
        rel="noreferrer"
        onClick={handleNavClick}>
        API Documentation
      </a>)} */}
    </nav>
  );
}
