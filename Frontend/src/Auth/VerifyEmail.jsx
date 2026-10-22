import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams} from "react-router-dom";
import { useState, useEffect } from "react";

export function VerifyEmail() {
  // ----- Verification STATE MANAGEMENT ---------------------------------------------------------------------------
  //Redux Site Wide Auth State
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [params] = useSearchParams();
  const status = params.get("status");
  const message = params.get("message");


// ----- Verification Page HTML ---------------------------------------------------------------------------
  return (
    <div className="email-verification-page">
      <div className="verification-card">
        {status === "success" ? (
          <>
            <h2>Email verified successfully!</h2>
            <button onClick={() => navigate("/Dashboard")}>
              Continue to Dashboard
            </button>
          </>
        ) : (
          <>
            <h2>Verification failed</h2>
            <p>{message || "Your verification link may be invalid or expired."}</p>
            <button onClick={() => navigate("/Login")}>
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
