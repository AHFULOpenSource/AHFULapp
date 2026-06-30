import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import "./siteStyles.css";
import { TOS } from "./TOS.jsx";

export function Navbar({ minHeight, isOpen = false, onNavClick = null }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const [showTOS, setShowTOS] = useState(false);

  const handleNavClick = () => {
    if (onNavClick) {
      onNavClick();
    }
  };

  return (
    <nav className={`sidebar ${isOpen ? "open" : "closed"}`} style={{ minHeight }}>

      {(!isAuthenticated || !user.email_verified) ? (
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
            ⭐ My Favorites
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
            to="/ExploreWorkout"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={handleNavClick}
          >
            My Workouts
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
            Social Workouts
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

      { (user?.roles?.includes("Admin") && user?.email_verified == true) && (<a
        href="http://localhost:5000/api/APIDocs"
        target="_blank"
        rel="noreferrer"
        onClick={handleNavClick}>
        API Documentation
      </a>)}
    </nav>
  );
}
