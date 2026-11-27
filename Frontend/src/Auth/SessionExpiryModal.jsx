import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuthStatus, selectSessionExpiresAt } from "./AuthSlice.js";
import {
  extendSession,
  handleSessionExpired,
  SESSION_WARNING_LEAD_SECONDS,
} from "./SessionManager.js";
import { HandleAHFULSignOut } from "./HandleAHFULLogout.js";
import "./Auth.css";

function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function SessionExpiryModal() {
  const authStatus = useSelector(selectAuthStatus);
  const expiresAt = useSelector(selectSessionExpiresAt);

  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [extendError, setExtendError] = useState("");

  useEffect(() => {
    if (authStatus !== "authenticated" || typeof expiresAt !== "number" || expiresAt <= 0) {
      setIsWarningOpen(false);
      setSecondsLeft(null);
      setExtendError("");
      return;
    }

    let warningTimerId = null;
    let countdownIntervalId = null;

    const evaluateSessionClock = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const remaining = expiresAt - nowSec;

      if (remaining <= 0) {
        setIsWarningOpen(false);
        setSecondsLeft(0);
        handleSessionExpired("Your session expired due to inactivity. Please sign in again.");
        return;
      }

      if (remaining <= SESSION_WARNING_LEAD_SECONDS) {
        setSecondsLeft(remaining);
        setIsWarningOpen(true);
      } else {
        setIsWarningOpen(false);
        setSecondsLeft(null);
        setExtendError("");
      }
    };

    const scheduleTimers = () => {
      if (warningTimerId) clearTimeout(warningTimerId);
      if (countdownIntervalId) clearInterval(countdownIntervalId);

      const nowSec = Math.floor(Date.now() / 1000);
      const remaining = expiresAt - nowSec;

      if (remaining <= 0) {
        evaluateSessionClock();
        return;
      }

      if (remaining <= SESSION_WARNING_LEAD_SECONDS) {
        evaluateSessionClock();
        countdownIntervalId = setInterval(evaluateSessionClock, 1000);
      } else {
        setIsWarningOpen(false);
        setSecondsLeft(null);
        const msUntilWarning = (remaining - SESSION_WARNING_LEAD_SECONDS) * 1000;
        warningTimerId = setTimeout(() => {
          evaluateSessionClock();
          countdownIntervalId = setInterval(evaluateSessionClock, 1000);
        }, msUntilWarning);
      }
    };

    scheduleTimers();

    const handleResumeCheck = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        scheduleTimers();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleResumeCheck);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleResumeCheck);
    }

    return () => {
      if (warningTimerId) clearTimeout(warningTimerId);
      if (countdownIntervalId) clearInterval(countdownIntervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleResumeCheck);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleResumeCheck);
      }
    };
  }, [authStatus, expiresAt]);

  if (!isWarningOpen || authStatus !== "authenticated") {
    return null;
  }

  const handleStayLoggedIn = async () => {
    setIsExtending(true);
    setExtendError("");
    try {
      await extendSession();
      setIsWarningOpen(false);
    } catch (err) {
      console.error("Failed to extend session:", err);
      setExtendError("Unable to extend your session. Please sign in again.");
      await handleSessionExpired("Unable to refresh your session. Please sign in again.");
    } finally {
      setIsExtending(false);
    }
  };

  const handleManualLogout = async () => {
    setIsWarningOpen(false);
    await HandleAHFULSignOut();
  };

  return (
    <div className="session-expiry-backdrop" role="dialog" aria-modal="true" aria-labelledby="session-expiry-title">
      <div className="session-expiry-modal">
        <h2 id="session-expiry-title">Are you still there?</h2>
        <p className="session-expiry-message">
          Your session is about to expire due to inactivity. You will be signed out in{" "}
          <span className="session-expiry-countdown">{formatCountdown(secondsLeft ?? 0)}</span>.
        </p>
        {extendError && <p className="session-expiry-error">{extendError}</p>}
        <div className="session-expiry-actions">
          <button
            type="button"
            className="session-expiry-stay-btn"
            onClick={handleStayLoggedIn}
            disabled={isExtending}
          >
            {isExtending ? "Extending..." : "I am still here"}
          </button>
          <button
            type="button"
            className="session-expiry-logout-btn"
            onClick={handleManualLogout}
            disabled={isExtending}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
