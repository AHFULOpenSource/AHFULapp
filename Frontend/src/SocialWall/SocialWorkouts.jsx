import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "../HistoryPRs/ExploreWorkouts.css";
import "../siteStyles.css";
import "./SocialWall.css";
import { GetFirebaseUser } from "../Auth/GetFirebaseUser.js";
import * as socialApi from "./socialApi.js";
import { PublicWallTab } from "./PublicWallTab.jsx";
import { PrivateMessagesTab } from "./PrivateMessagesTab.jsx";
import {
  syncCacheUser,
  pullPublicPosts,
  pullConversations,
  pullConversationThread,
  selectPublicPosts,
  selectConversations,
  selectSocialWallLoadingPublic,
  selectSocialWallLoadingConversations,
  selectSocialWallLoadingThread,
} from "./SocialWallSlice.js";

// SocialWorkouts - full-width tabbed Social hub: Public Wall, Private Messages, and Shared Workouts.

export function SocialWorkouts() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = GetFirebaseUser();
  const userEmail = user?.email?.toLowerCase() || "";
  const cachedExercises = useSelector((state) => state.pullExercise.exercises);
  const publicPosts = useSelector(selectPublicPosts);
  const conversations = useSelector(selectConversations);
  const loadingPublic = useSelector(selectSocialWallLoadingPublic);
  const loadingConversations = useSelector(selectSocialWallLoadingConversations);
  const loadingThread = useSelector(selectSocialWallLoadingThread);

  const [activeTab, setActiveTab] = useState("public");
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [sharedWorkouts, setSharedWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [gymDetails, setGymDetails] = useState(null);
  const [gymLoading, setGymLoading] = useState(false);
  const [gymError, setGymError] = useState(null);
  const [personalExercises, setPersonalExercises] = useState([]);
  const [personalExLoading, setPersonalExLoading] = useState(false);
  const [personalExError, setPersonalExError] = useState(null);

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
    const res = await socialApi.getSharedWorkouts();
    if (res.error) {
      console.warn("fetchShared failed:", res.error);
      setError(String(res.error));
      setSharedWorkouts([]);
    } else {
      setSharedWorkouts(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userEmail) {
      dispatch(syncCacheUser(userEmail));
    }
  }, [dispatch, userEmail]);

  useEffect(() => {
    fetchShared();
  }, [userEmail]);

  useEffect(() => {
    if (activeTab === "public") {
      dispatch(pullPublicPosts());
    } else if (activeTab === "private") {
      dispatch(pullConversations());
    }
  }, [dispatch, activeTab]);

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

  useEffect(() => {
    let isActive = true;
    const workoutId = selectedWorkout?.workout_id;

    if (!workoutId) {
      setPersonalExercises([]);
      setPersonalExError(null);
      return () => {
        isActive = false;
      };
    }

    const fetchPersonalExercises = async () => {
      setPersonalExLoading(true);
      setPersonalExError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/AHFULpersonalEx/workout/${workoutId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (isActive) {
          setPersonalExercises(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isActive) {
          console.warn("fetchPersonalExercises failed:", err);
          setPersonalExError("Unable to load personal exercises.");
          setPersonalExercises([]);
        }
      } finally {
        if (isActive) {
          setPersonalExLoading(false);
        }
      }
    };

    fetchPersonalExercises();

    return () => {
      isActive = false;
    };
  }, [selectedWorkout?.workout_id, selectedWorkout?._id]);

  const handleRefresh = () => {
    if (activeTab === "public") {
      dispatch(pullPublicPosts({ force: true }));
    } else if (activeTab === "private") {
      dispatch(pullConversations({ force: true }));
      if (selectedConversationId) {
        dispatch(
          pullConversationThread({
            conversationId: selectedConversationId,
            force: true,
          })
        );
      }
    } else {
      fetchShared();
    }
  };

  const isRefreshing =
    (activeTab === "public" && loadingPublic) ||
    (activeTab === "private" && (loadingConversations || loadingThread)) ||
    (activeTab === "workouts" && loading);

  return (
    <div className="explore-root">
      <header className="explore-header" style={{ flexWrap: "wrap", gap: 12 }}>
        <h1>Social — Shared Workouts &amp; Wall</h1>

        <div className="header-controls" style={{ flexWrap: "wrap" }}>
          <div className="social-top-nav" role="tablist" aria-label="Social sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "public"}
              className={`social-wall-tab-btn ${activeTab === "public" ? "active" : ""}`}
              onClick={() => setActiveTab("public")}
            >
              Public Wall ({publicPosts.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "private"}
              className={`social-wall-tab-btn ${activeTab === "private" ? "active" : ""}`}
              onClick={() => setActiveTab("private")}
            >
              Private Messages ({conversations.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "workouts"}
              className={`social-wall-tab-btn ${activeTab === "workouts" ? "active" : ""}`}
              onClick={() => setActiveTab("workouts")}
            >
              Shared Workouts ({sharedWorkouts.length})
            </button>
          </div>

          <button className="refresh-btn" onClick={() => navigate("/ExploreFriends")}>
            Explore Friends
          </button>
          <button onClick={handleRefresh} disabled={isRefreshing} className="refresh-btn">
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <div className="social-full-panel">
        {activeTab === "public" && (
          <div className="social-wall-card">
            <PublicWallTab />
          </div>
        )}

        {activeTab === "private" && (
          <div className="social-wall-card">
            <PrivateMessagesTab
              userEmail={userEmail}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
            />
          </div>
        )}

        {activeTab === "workouts" && (
          <div>
            {error && <div className="explore-error">Failed to load shared workouts</div>}

            {!error && sharedWorkouts.length === 0 && (
              <div className="explore-empty">
                No shared workouts yet. When friends share workouts they&apos;ll appear here.
              </div>
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
        )}
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
                      {gymDetails.cost && <div>Cost: (gymDetails.cost)</div>}
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

              <div className="workout-detail-section">
                <label className="workout-detail-label">Shared Workout Exercises</label>
                {personalExLoading && <p className="workout-detail-value">Loading exercises...</p>}
                {!personalExLoading && personalExError && <p className="workout-detail-value">{personalExError}</p>}
                {!personalExLoading && !personalExError && personalExercises.length === 0 && (
                  <p className="workout-detail-value">No shared exercises found for workout.</p>
                )}
                {!personalExLoading && !personalExError && personalExercises.length > 0 && (
                  <div className="workout-detail-value" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {personalExercises.map((ex) => (
                      <div
                        key={ex._id}
                        style={{
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                          padding: 8,
                          background: "var(--color-surface)",
                        }}
                      >
                        <div><strong>Exercise:</strong> {cachedExercises?.find(e => e._id?.toString() === ex.exercise_id?.toString())?.name}</div>
                        <div><strong>Reps:</strong> {ex.reps ?? 0}</div>
                        <div><strong>Weight:</strong> {ex.weight ?? 0}</div>
                        <div><strong>Duration:</strong> {ex.duration ?? 0}</div>
                        <div><strong>Distance:</strong> {ex.distance ?? 0}</div>
                        <div><strong>Complete:</strong> {ex.complete ? "Yes" : "No"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
