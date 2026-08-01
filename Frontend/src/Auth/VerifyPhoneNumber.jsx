import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export function VerifyPhoneNumber() {
  // ----- Verification STATE MANAGEMENT ---------------------------------------------------------------------------
  //Redux Site Wide Auth State
  const dispatch = useDispatch();
  const navigate = useNavigate();

// ----- Verification Page HTML ---------------------------------------------------------------------------
  return (
    <div className="phone-verification-page">
      <div className="verification-card">
        <div className="verification-title">
          <h1>Phone Number Verification</h1>
        </div>
        <div>
          <h3>
            Your phone number was successfully verified! You can leave this page or proceed to login
          </h3>
          <a href="/Login" className="primary-cta">Log In</a>
        </div>
      </div>
    </div>
  );
}
