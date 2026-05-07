import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../ExploreWorkouts/ExploreWorkouts.css";
import "../siteStyles.css";

// SocialWorkouts - mock social page that resembles ExploreWorkouts
// Left: Shared workouts list
// Right: Wall posts (friends' shared posts) + a small shared-workout summary area

export function SocialWorkouts() {
  const user = useSelector((s) => s.auth.user);
  const [sharedWorkouts, setSharedWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [wallPosts, setWallPosts] = useState([]);

  const getUserId = () => {
    if (user?._id) return user._id;
    try {
      const stored = JSON.parse(localStorage.getItem("user_data"));
      return stored?._id || null;
    } catch {
      return null;
    }
  };

  const userId = getUserId();

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    const d = new Date(ts * 1000);
    return d.toLocaleString();
  };

  const calculateDuration = (s, e) => {
    if (!s || !e) return "N/A";
    const dur = e - s;
    const m = Math.floor(dur / 60);
    const sec = dur % 60;
    return m === 0 ? `${sec}s` : `${m}m ${sec}s`;
  };

  // Try fetching shared workouts from backend, fall back to mock data
  const fetchShared = async () => {
    setLoading(true);
    setError(null);
    try {
      // Attempt a sensible endpoint; if your backend differs update this URL
      const res = await fetch(`http://localhost:5000/api/AHFULworkouts/shared`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        // fallback to mock
        setSharedWorkouts(mockSharedWorkouts());
      } else {
        setSharedWorkouts(data);
      }
    } catch (err) {
      console.warn("fetchShared failed, using mock data:", err);
      setError(String(err));
      setSharedWorkouts(mockSharedWorkouts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShared();
    // load mock wall posts
    setWallPosts(mockWallPosts());
  }, [userId]);

  function mockSharedWorkouts() {
    return [
      {
        _id: "sw1",
        title: "Full Body Strength",
        startTime: Math.floor(Date.now() / 1000) - 86400 * 2,
        endTime: Math.floor(Date.now() / 1000) - 86400 * 2 + 3600,
        gymId: null,
        instructions: "Partner circuit with supersets",
        sharedBy: { name: "Alex" },
      },
      {
        _id: "sw2",
        title: "Morning Run",
        startTime: Math.floor(Date.now() / 1000) - 86400 * 5,
        endTime: Math.floor(Date.now() / 1000) - 86400 * 5 + 1800,
        gymId: null,
        instructions: "Easy 5k with intervals",
        sharedBy: { name: "Morgan" },
      },
    ];
  }

  function mockWallPosts() {
    return [
      {
        id: "p1",
        author: "Taylor",
        ts: Math.floor(Date.now() / 1000) - 3600,
        text: "Hit a new PR on deadlift today — 315 lbs!🔥",
        workoutRef: "sw1",
      },
      {
        id: "p2",
        author: "Jordan",
        ts: Math.floor(Date.now() / 1000) - 86400,
        text: "Shared my 5k time — feeling great.",
        workoutRef: "sw2",
      },
    ];
  }

  return (
    <div className="explore-root">
      <header className="explore-header">
        <h1>Social — Shared Workouts & Wall</h1>
        <div className="header-controls">
          <button onClick={fetchShared} disabled={loading} className="refresh-btn">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <div className="explore-content">
        <div className="explore-left">
          {error && <div className="explore-error">Failed to load shared workouts (showing mock data)</div>}

          {!error && sharedWorkouts.length === 0 && (
            <div className="explore-empty">No shared workouts yet. When friends share workouts they'll appear here.</div>
          )}

          <div className="exercise-list">
            {sharedWorkouts.map((w, idx) => (
              <div
                key={w._id || idx}
                className="exercise-item"
                onClick={() => setSelectedWorkout(w)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedWorkout(w);
                }}
              >
                <div className="exercise-main">
                  <div className="exercise-name">{w.title || "Untitled Workout"}</div>
                  <div className="exercise-meta">
                    {w.startTime && <span>Start: {new Date(w.startTime * 1000).toLocaleDateString()}</span>}
                    {w.endTime && <span> • Duration: {calculateDuration(w.startTime, w.endTime)}</span>}
                    {w.sharedBy && w.sharedBy.name && <span> • Shared by: {w.sharedBy.name}</span>}
                  </div>
                </div>
                {w.instructions && <div className="exercise-instructions">{w.instructions}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="explore-right">
          {/* Wall Section */}
          <div className="wh-chart-section" style={{ marginBottom: 16 }}>
            <div className="wh-chart-heading">Wall</div>
            {wallPosts.length === 0 ? (
              <div className="wh-status">No posts yet. Your friends' posts will show up here.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {wallPosts.map((p) => (
                  <article key={p.id} style={{ background: "var(--color-surface)", padding: 12, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{p.author}</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{formatDate(p.ts)}</span>
                    </div>
                    <p style={{ marginTop: 8 }}>{p.text}</p>
                    {p.workoutRef && (
                      <button
                        className="retry-btn"
                        onClick={() => {
                          // try to find workout and open modal
                          const found = sharedWorkouts.find((sw) => sw._id === p.workoutRef);
                          if (found) setSelectedWorkout(found);
                        }}
                      >
                        View Workout
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for workout detail */}
      {selectedWorkout && (
        <div className="workout-modal-overlay" onClick={() => setSelectedWorkout(null)}>
          <div className="workout-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="workout-modal-header">
              <h2>{selectedWorkout.title || "Untitled Workout"}</h2>
              <button className="workout-modal-close" onClick={() => setSelectedWorkout(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="workout-modal-body">
              {selectedWorkout.startTime && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Start Time</label>
                  <p className="workout-detail-value">{formatDate(selectedWorkout.startTime)}</p>
                </div>
              )}
              {selectedWorkout.endTime && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">End Time</label>
                  <p className="workout-detail-value">{formatDate(selectedWorkout.endTime)}</p>
                </div>
              )}
              {selectedWorkout.startTime && selectedWorkout.endTime && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Duration</label>
                  <p className="workout-detail-value">{calculateDuration(selectedWorkout.startTime, selectedWorkout.endTime)}</p>
                </div>
              )}

              {selectedWorkout.instructions && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Notes</label>
                  <p className="workout-detail-value">{selectedWorkout.instructions}</p>
                </div>
              )}

              {selectedWorkout.sharedBy && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Shared By</label>
                  <p className="workout-detail-value">{selectedWorkout.sharedBy.name}</p>
                </div>
              )}
            </div>
            <div className="workout-modal-actions">
              <button className="workout-modal-btn workout-modal-btn-close" onClick={() => setSelectedWorkout(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialWorkouts;
