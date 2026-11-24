import React, { useState, useEffect } from "react";
import { getFriendsForCurrentUser } from "../SocialWall/socialApi.js";
import { auth } from "../firebase.js";

export function ShareWorkoutModal({ workout, onClose }) {
  const [email, setEmail] = useState("");
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingFriends(true);
      try {
        const res = await getFriendsForCurrentUser();
        if (!mounted) return;
        if (res?.success && res?.data) {
          const list = Array.isArray(res.data)
            ? res.data
            : res.data.data || [];
          const myEmail = (auth.currentUser?.email || "").toLowerCase();
          const parsed = list
            .map((f) => {
              const u1 = (f.User1Email || "").trim();
              const u2 = (f.User2Email || "").trim();
              const friendEmail = u1.toLowerCase() === myEmail ? u2 : u1;
              return {
                id: f._id || friendEmail,
                email: friendEmail,
              };
            })
            .filter((f) => f.email);
          setFriends(parsed);
        }
      } catch (err) {
        console.error("Failed to load friends in ShareWorkoutModal:", err);
      } finally {
        if (mounted) setLoadingFriends(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!workout) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus({ type: "error", message: "Please select a friend to share with." });
      return;
    }

    setSharing(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("https://api.ahful.app/api/AHFULsocial/shared-workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workout_id: workout._id,
          to_user_email: email.trim().toLowerCase(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to share workout.");
      }

      setStatus({ type: "success", message: `Workout shared with ${email}!` });
      setEmail("");
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Share workout error:", err);
      setStatus({ type: "error", message: err.message || "Failed to share workout." });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share Workout</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="share-modal-subtitle">
          Share <strong>"{workout.title || "Workout"}"</strong> with an added friend so they can view and log it.
        </p>

        <form onSubmit={handleShare} className="share-modal-form">
          {loadingFriends ? (
            <div className="share-friends-loading">Loading your friends list…</div>
          ) : friends.length > 0 ? (
            <div className="form-group">
              <label className="share-input-label" htmlFor="friend-select">
                Select Friend:
              </label>
              <select
                id="friend-select"
                className="share-friend-select share-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sharing}
                autoFocus
              >
                <option value="">-- Choose a friend --</option>
                {friends.map((f) => (
                  <option key={f.id} value={f.email}>
                    {f.email}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="share-no-friends-notice">
              <p>You haven't added any friends yet.</p>
              <p className="share-no-friends-sub">
                Connect with friends on the Explore Friends page to share workouts with them!
              </p>
            </div>
          )}

          {status.message && (
            <div className={`share-status-message ${status.type}`}>
              {status.message}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={sharing}
            >
              Cancel
            </button>
            {friends.length > 0 && (
              <button
                type="submit"
                className="btn btn-primary share-submit-btn"
                disabled={sharing || !email.trim()}
              >
                {sharing ? "Sharing..." : "Send Workout"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShareWorkoutModal;
