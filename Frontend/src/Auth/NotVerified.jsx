import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams} from "react-router-dom";
import { useState, useEffect } from "react";
import { GetFirebaseUser } from "./GetFirebaseUser.js";

export function NotVerified() {
  // ----- Verification STATE MANAGEMENT ---------------------------------------------------------------------------
  //Redux Site Wide Auth State
  const handleVerifyEmail = async () => {
    //TODO: implement Firebase Logic to send verification email
  };

// ----- Verification Page HTML ---------------------------------------------------------------------------
  return (
    <div className="not-verified-page">
        <h1>AHFUL App Email Verification Page</h1>   
        <h2>Your email is not verified</h2>   
        <h2>Click the button below to send a verification email</h2>
        <p>After you receive the email click the link in it and log out and log back in to access all features.</p>

        {/* Manually verify user email*/}
          <div className="profile-email-verify-section">
            <button
              className="profile-email-verify-btn"
              onClick={handleVerifyEmail}
            >
              Verify Email
            </button>
          </div>
    </div>
  );
}
