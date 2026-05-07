import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import "./siteStyles.css";

function TOSModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="tos-modal" onClick={handleBackdropClick}>
      <div className="tos-modal-content">
        <button className="tos-close" onClick={onClose}>
          ×
        </button>
        <h1>Terms of Service</h1>
        <p className="tos-intro">
          These Terms of Service ("Terms") govern your access to and use of the AHFUL app and related services (the
          "Service"). By accessing or using the Service you agree to be bound by these Terms. If you do not agree to all
          of the terms, then you may not access the Service.
        </p>
        <h2>This website is a UW-Stout Student Group Project for Spring 2026</h2>
        <p>
          The authors of this website are students at the University of Wisconsin-Stout implementing their skills to
          show off the functional secure website they have built over the semester.
        </p>
        <h2>1. Using the Service</h2>
        <p>
          You may use the Service only in compliance with these Terms and all applicable laws. You are responsible for
          any activity that occurs under your account.
        </p>
        <h2>2. Accounts</h2>
        <p>
          Certain features require an account. Keep your account credentials secure. You are responsible for all
          activity on your account. We may suspend or terminate accounts for violation of these Terms.
        </p>
        <h2>3. Content</h2>
        <p>
          You retain ownership of content you submit to the Service. By submitting content you grant the Service a
          limited license to store, display, and transmit that content as necessary to provide the Service.
        </p>
        <h2>4. Prohibited Conduct</h2>
        <p>
          Do not use the Service for illegal activities, harassment, distributing malware, or infringing others'
          rights. We reserve the right to remove content and restrict accounts for violations.
        </p>
        <h2>5. Third-Party Links and Integrations</h2>
        <p>
          The Service may contain links or integrations with third-party services. We are not responsible for
          third-party content or practices. Your interactions with third parties are solely between you and the third
          party.
        </p>
        <h2>6. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE
          DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED.
        </p>
        <h2>7. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH THE SERVICE.
        </p>
        <h2>8. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. If we make material changes we will provide notice. Continued
          use of the Service after changes constitutes acceptance of the updated Terms.
        </p>
        <h2>9. Contact</h2>
        <p>
          If you have questions about these Terms, please contact the app owners or maintainers as described on the
          project repository.
        </p>
        <h2>10. Contract</h2>
        <p>
          The Gemini API Additional Terms of Service and the Google Privacy Policy apply. Prompts and responses may be
          reviewed and used to train Google AI, so don't submit sensitive or personal information. Learn more about data
          use. Google AI models can make mistakes, so double-check responses before relying on, publishing, or otherwise
          using generated content.
        </p>
        <p className="tos-last-updated">Last updated: April 9, 2026</p>
      </div>
    </div>
  );
}

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
            className={({ isActive }) => (isActive ? "active" : "")}
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
            to="/WorkoutLogger"
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
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setShowTOS(true)}
          >
            Terms of Service
          </button>
        </>
        )}

      <TOSModal isOpen={showTOS} onClose={() => setShowTOS(false)} />

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
