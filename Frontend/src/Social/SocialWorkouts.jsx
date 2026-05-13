import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../ExploreWorkouts/ExploreWorkouts.css";
import "../siteStyles.css";

// SocialWorkouts - social page that resembles ExploreWorkouts what is the Shared workouts a User and their friends have shared
// Left: Shared workouts list from friends.
// Right: Wall posts (friends' shared posts or public Posts)

export function SocialWorkouts() {
  const user = useSelector((s) => s.auth.user);
  const userId = user?.id;
  const userEmail = user?.email.toLowerCase();
``
  const [sharedWorkouts, setSharedWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [wallPosts, setWallPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState(null);
  const [postNotes, setPostNotes] = useState("");
  const [postIsPublic, setPostIsPublic] = useState(false);
  const [postTargetEmail, setPostTargetEmail] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [gymDetails, setGymDetails] = useState(null);
  const [gymLoading, setGymLoading] = useState(false);
  const [gymError, setGymError] = useState(null);

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

  // Try fetching shared workouts from backend
  const fetchShared = async () => {
    setLoading(true);
    setError(null);
    try {
      // Attempt a sensible endpoint; if your backend differs update this URL
      const res = await fetch(`http://localhost:5000/api/AHFULsocial/shared-workouts`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSharedWorkouts([]);
      } else {
        setSharedWorkouts(data);
      }
    } catch (err) {
      console.warn("fetchShared failed:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchWallPosts = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/AHFULsocial/wall-posts`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setWallPosts([]);
      } else {
        setWallPosts(data);
      }
    } catch (err) {
      console.warn("fetchWallPosts failed:", err);
    }
  };

  const fetchFriends = async () => {
    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/AHFULsocial/user`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setFriends([]);
        return;
      }

      const friendEmails = data
        .map((friendship) => {
          const email1 = (friendship?.User1Email || "").toLowerCase();
          const email2 = (friendship?.User2Email || "").toLowerCase();
          if (email1 && email1 !== userEmail) return email1;
          if (email2 && email2 !== userEmail) return email2;
          return null;
        })
        .filter(Boolean);

      setFriends([...new Set(friendEmails)]);
    } catch (err) {
      console.warn("fetchFriends failed:", err);
      setFriendsError("Unable to load friends.");
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };


  const createWallPost = async () => {
    if (!postNotes.trim()) {
      setPostError("Please enter post notes.");
      return;
    }

    if (!postIsPublic && !postTargetEmail) {
      setPostError("Select a friend or mark the post as public.");
      return;
    }

    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/AHFULsocial/wall-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          notes: postNotes.trim(),
          is_public: postIsPublic,
          shared_to_user_email: postIsPublic ? null : postTargetEmail,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server returned ${res.status} ${res.statusText}`);
      }

      await res.json().catch(() => ({}));
      setPostNotes("");
      setPostIsPublic(false);
      setPostTargetEmail("");
      fetchWallPosts();
    } catch (err) {
      setPostError(String(err));
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    fetchShared();
    fetchWallPosts();
    fetchFriends();
  }, [userId]);

  useEffect(() => {
    let isActive = true;
    const gymId = selectedWorkout?.gym_id;

    if (!gymId) {
      setGymDetails(null);
      setGymError(null);
      return () => {
        isActive = false;
      };
    }

    const fetchGymDetails = async () => {
      setGymLoading(true);
      setGymError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/AHFULgyms/${gymId}` , {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (isActive) {
          setGymDetails(data && typeof data === "object" ? data : null);
        }
      } catch (err) {
        if (isActive) {
          console.warn("fetchGymDetails failed:", err);
          setGymError("Unable to load gym details.");
          setGymDetails(null);
        }
      } finally {
        if (isActive) {
          setGymLoading(false);
        }
      }
    };

    fetchGymDetails();

    return () => {
      isActive = false;
    };
  }, [selectedWorkout?.gym_id]);

  const getPostTimestamp = (post) => post?.created_at || post?.ts || null;

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
          {error && <div className="explore-error">Failed to load shared workouts</div>}

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
              >
                <div className="exercise-main">
                  <div className="exercise-name">{w.title || "Untitled Workout"}</div>
                  <div className="exercise-meta">
                    {w.startTime && <span>Start: {formatDate(w.startTime)}</span>}
                    {w.endTime && <span> • Duration: {calculateDuration(w.startTime, w.endTime)}</span>}
                    {w.sharedBy && w.sharedBy.name && <span> • Shared by: {w.sharedBy.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="explore-right">
          {/* Wall Section */}
          <div className="wh-chart-section" style={{ marginBottom: 16 }}>
            <div className="wh-chart-heading">Wall</div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea
                className="task-input"
                rows={3}
                placeholder="Share an update with your friends..."
                value={postNotes}
                onChange={(e) => setPostNotes(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={postIsPublic} onChange={(e) => setPostIsPublic(e.target.checked)} />
                  Make public
                </label>
                <select
                  className="task-input"
                  value={postTargetEmail}
                  onChange={(e) => setPostTargetEmail(e.target.value)}
                  disabled={postIsPublic || friendsLoading}
                >
                  <option value="">Share to a friend</option>
                  {friends.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
                <button className="refresh-btn" onClick={createWallPost} disabled={posting}>
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
              {friendsError && <div className="explore-error">{friendsError}</div>}
              {postError && <div className="explore-error">{postError}</div>}
            </div>
            {wallPosts.length === 0 ? (
                <div className="wh-status">No posts yet. Your friends' posts will show up here.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {wallPosts.map((p) => (
                    <article key={p._id || p.id} style={{ background: "var(--color-surface)", padding: 12, borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{p?.owner?.name || p.author || "Friend"}</strong>
                        <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                          {formatDate(getPostTimestamp(p))}
                        </span>
                      </div>
                      <p style={{ marginTop: 8 }}>{p.notes || p.text}</p>
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
              <h2>{selectedWorkout.title}</h2>
            </div>
            <div className="workout-modal-body">
              {selectedWorkout.sharedBy && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Shared By</label>
                  <p className="workout-detail-value">{selectedWorkout.sharedBy.name}</p>
                </div>
              )}

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

              {selectedWorkout.gym_id && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Gym</label>
                  {gymLoading && <p className="workout-detail-value">Loading gym details...</p>}
                  {!gymLoading && gymError && <p className="workout-detail-value">{gymError}</p>}
                  {!gymLoading && !gymError && gymDetails && (
                    <div className="workout-detail-value">
                      <div>{gymDetails.name || "Gym"}</div>
                      {gymDetails.address && <div>{gymDetails.address}</div>}
                      {gymDetails.type && <div>Type: {gymDetails.type}</div>}
                      {gymDetails.cost && <div>Cost: {formatCost(gymDetails.cost)}</div>}
                      {gymDetails.link && (
                        <a href={gymDetails.link} target="_blank" rel="noreferrer">
                          Visit site
                        </a>
                      )}
                    </div>
                  )}
                  {!gymLoading && !gymError && !gymDetails && (
                    <p className="workout-detail-value">{selectedWorkout.gym_id}</p>
                  )}
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
