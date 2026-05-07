import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./ExploreWorkouts.css";
import "../siteStyles.css";
import { CalendarButton } from "../Calendar/CalendarButton";
import { HeatMap } from "./HeatMap";
import { WorkoutChart } from "../ExploreWorkouts/WorkoutChart";
import { fetchPersonalExercises, fetchGym, fetchExerciseById } from "../QueryFunctions";

/**
 * ExploreWorkouts - Workout exploration and history page
 *
 * Features:
 * - View all workouts or just my workouts (toggle)
 * - Interactive workout history chart with week selection
 * - Heat map showing workout frequency
 * - Calendar integration
 *
 * Layout:
 * - Left column: List of workouts/exercises
 * - Right column: WorkoutChart and HeatMap widgets
 * - Bottom: Calendar component
 */
export function ExploreWorkouts() {
  // ─── State ────────────────────────────────────────────────────────────────────
  const user = useSelector((state) => state.auth.user);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [personalExercises, setPersonalExercises] = useState([]);
  const [personalExercisesLoading, setPersonalExercisesLoading] = useState(false);
  const [exerciseNames, setExerciseNames] = useState({});
  const [gymInfo, setGymInfo] = useState(null);
  const [gymLoading, setGymLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState(null);
  const [shareTargetEmail, setShareTargetEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(null);

  const getUserId = () => {
    if (user?._id) return user._id;
  };
  const userId = getUserId();

  const getUserEmail = () => {
    if (user?.email) return user.email;
  };
  const userEmail = (getUserEmail() || "").toLowerCase();

  // ─── Fetch Workouts from Backend ─────────────────────────────────────────────
  const fetchExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) {
        throw new Error("User ID not found. Please log in to view your workouts.");
      }
      
      const res = await fetch(`http://localhost:5000/api/AHFULworkouts/${userId}`,{method: "GET",credentials: "include",});

      if (!res.ok) {
        let bodyText = "";
        try {
          bodyText = await res.text();
        } catch (e) {
          // Ignore text extraction errors
        }
        throw new Error(`Server returned ${res.status} ${res.statusText} ${bodyText}`);
      }

      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch workouts:", err);
      const friendly = err && err.name ? `${err.name}: ${err.message}` : String(err);
      setError(friendly || "Unknown error");
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Load Workouts on Mount ───────────────────────────────────────────────────
  useEffect(() => {
    fetchExercises();
  }, [userId]);

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

  useEffect(() => {
    fetchFriends();
  }, [userId]);

  // ─── Fetch Personal Exercises when Workout is Selected ────────────────────────
  useEffect(() => {
    if (selectedWorkout?._id) {
      const loadPersonalExercises = async () => {
        setPersonalExercisesLoading(true);
        try {
          const exercises = await fetchPersonalExercises(selectedWorkout._id);
          setPersonalExercises(Array.isArray(exercises) ? exercises : []);
        } catch (err) {
          console.error("Failed to fetch personal exercises:", err);
          setPersonalExercises([]);
        } finally {
          setPersonalExercisesLoading(false);
        }
      };
      loadPersonalExercises();
    }
  }, [selectedWorkout]);

  // ─── Fetch Exercise Names for Personal Exercises ───────────────────────────────
  useEffect(() => {
    const exerciseIds = personalExercises.map((ex) => ex.exercise_id);

    if (exerciseIds.length === 0) return;

    // Filter missing names
    const missing = exerciseIds.filter((id) => !exerciseNames[id]);

    if (missing.length === 0) return;

    const loadNames = async () => {
      try {
        const results = {};

        for (const id of missing) {
          if (!id) {
            results[id] = "Unknown Exercise";
            continue;
          }
          try {
            const response = await fetch(`http://localhost:5000/api/AHFULexercises/id/${id}`, {credentials: "include"});

            if (!response.ok) {
              results[id] = "Unknown Exercise";
              continue;
            }

            const data = await response.json();
            results[id] = data?.name || "Unknown Exercise";
          } catch (err) {
            console.error("Error fetching exercise name for", id, err);
            results[id] = "Unknown Exercise";
          }
        }

        setExerciseNames((prev) => ({ ...prev, ...results }));
      } catch (err) {
        console.error("Error fetching exercise names:", err);
      }
    };

    loadNames();
  }, [personalExercises]);

  // ─── Fetch Gym Info when Workout is Selected ───────────────────────────────────
  useEffect(() => {
    if (selectedWorkout?.gymId) {
      const loadGymInfo = async () => {
        setGymLoading(true);
        try {
          const gym = await fetchGym(selectedWorkout.gymId);
          setGymInfo(gym);
        } catch (err) {
          console.error("Failed to fetch gym info:", err);
          setGymInfo(null);
        } finally {
          setGymLoading(false);
        }
      };
      loadGymInfo();
    } else {
      setGymInfo(null);
    }
  }, [selectedWorkout]);

  // ─── Helper Functions ─────────────────────────────────────────────────────────
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const shareWorkout = async () => {
    if (!selectedWorkout) return;
    if (!shareTargetEmail) {
      setShareError("Please select a friend to share with.");
      return;
    }

    setSharing(true);
    setShareError(null);
    try {
      const workoutId = selectedWorkout._id;
      const res = await fetch(`http://localhost:5000/api/AHFULsocial/shared-workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ workout_id: workoutId, to_user_email: shareTargetEmail }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server returned ${res.status} ${res.statusText}`);
      }

      await res.json().catch(() => ({}));
      setShareTargetEmail("");
    } catch (err) {
      setShareError(String(err));
    } finally {
      setSharing(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="explore-root">
      {/* Page Header with Title, Toggle, and Refresh Button */}
      <header className="explore-header">
        <h1>Explore Workouts</h1>
        <div className="header-controls">
          <button onClick={fetchExercises} disabled={loading} className="refresh-btn">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="explore-content">
        {/* Left Column: Workout List */}
        <div className="explore-left">
          {/* Error Message */}
          {error && <div className="explore-error">No Workouts currently saved! Check out the Workout Logger to create a Workout!</div>}

          {!error && (
            <div className="exercise-list">
              {/* Loading State */}
              {loading && workouts.length === 0 ? (
                <div className="explore-loading">Loading workouts…</div>
              ) : workouts.length === 0 ? (
                /* Empty State - no workouts yet */
                <div className="explore-empty">
                  {"No workouts found. Start a workout to see it here!"}
                </div>
              ) : (
                /* Workout List */
                workouts.map((workout, idx) => {
                  // Generate unique key for each workout item
                  const key = workout.id || workout._id || workout.title || `workout-${idx}`;
                  return (
                    <div
                      key={key}
                      className="exercise-item"
                      onClick={() => setSelectedWorkout(workout)}
                      role="button"
                      tabIndex="0"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedWorkout(workout);
                        }
                      }}
                    >
                      <div className="exercise-main">
                        {/* Workout Title */}
                        <div className="exercise-name">
                          {workout.title || "Untitled Workout"}
                        </div>
                        {/* Workout Metadata (start/end times, gym) */}
                        <div className="exercise-meta">
                          {workout.startTime && (
                            <span>Start: {new Date(workout.startTime * 1000).toLocaleDateString()}</span>
                          )}
                          {workout.endTime && (
                            <span> • End: {new Date(workout.endTime * 1000).toLocaleDateString()}</span>
                          )}
                          {workout.gymId && <span> • Gym ID: {workout.gymId.slice(0, 8)}...</span>}
                        </div>
                      </div>
                      {/* Optional Instructions */}
                      {workout.instructions && (
                        <div className="exercise-instructions">{workout.instructions}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Column: Charts and Visualizations */}
        <div className="explore-right">
          {/* Interactive Workout History Chart */}
          {/* Allows users to select different week ranges (4, 6, 8, 12 weeks) */}
          <WorkoutChart defaultWeeks={6} />
          {/* Heat Map showing workout frequency over time */}

          <HeatMap />
        </div>
      </div>

      {/* CalendarButton Component */}
      <CalendarButton />

      {/* Workout Details Modal */}
      {selectedWorkout && (
        <div className="workout-modal-overlay" onClick={() => setSelectedWorkout(null)}>
          <div className="workout-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="workout-modal-header">
              <h2>{selectedWorkout.title || "Untitled Workout"}</h2>
              <button
                className="workout-modal-close"
                onClick={() => setSelectedWorkout(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="workout-modal-body">
              {/* Workout Title */}
              <div className="workout-detail-section">
                <label className="workout-detail-label">Workout Title</label>
                <p className="workout-detail-value">{selectedWorkout.title || "N/A"}</p>
              </div>

              {/* Gym Information */}
              {selectedWorkout.gymId && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Gym</label>
                  {gymLoading ? (
                    <p className="workout-gym-loading">Loading gym info…</p>
                  ) : gymInfo ? (
                    <div className="workout-gym-info">
                      {gymInfo.name && (
                        <p className="workout-gym-name">{gymInfo.name}</p>
                      )}
                      {gymInfo.address && (
                        <p className="workout-gym-location">{gymInfo.address}</p>
                      )}
                    </div>
                  ) : (
                    <p className="workout-gym-unavailable">Gym info not available</p>
                  )}
                </div>
              )}

              {/* Start Time */}
              {selectedWorkout.startTime && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Start Time</label>
                  <p className="workout-detail-value">{formatDate(selectedWorkout.startTime)}</p>
                </div>
              )}

              {/* End Time */}
              {selectedWorkout.endTime && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">End Time</label>
                  <p className="workout-detail-value">{formatDate(selectedWorkout.endTime)}</p>
                </div>
              )}

              {/* Duration */}
              {selectedWorkout.startTime && selectedWorkout.endTime && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Duration</label>
                  <p className="workout-detail-value">
                    {calculateDuration(selectedWorkout.startTime, selectedWorkout.endTime)}
                  </p>
                </div>
              )}

              {/* Instructions */}
              {selectedWorkout.instructions && (
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Instructions</label>
                  <p className="workout-detail-value">{selectedWorkout.instructions}</p>
                </div>
              )}

              <div className="workout-detail-section">
                <label className="workout-detail-label">Share this workout</label>
                <div className="task-form" style={{ gap: 8 }}>
                  <select
                    className="task-input"
                    value={shareTargetEmail}
                    onChange={(e) => setShareTargetEmail(e.target.value)}
                    disabled={friendsLoading}
                  >
                    <option value="">Select a friend</option>
                    {friends.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                  <button className="refresh-btn" onClick={shareWorkout} disabled={sharing}>
                    {sharing ? "Sharing..." : "Share"}
                  </button>
                </div>
                {friendsError && <div className="explore-error">{friendsError}</div>}
                {shareError && <div className="explore-error">{shareError}</div>}
              </div>

              {/* Personal Exercises */}
              <div className="workout-detail-section">
                <label className="workout-detail-label">Exercises</label>
                {personalExercisesLoading ? (
                  <p className="workout-exercises-loading">Loading exercises…</p>
                ) : personalExercises.length === 0 ? (
                  <p className="workout-exercises-empty">No exercises recorded for this workout</p>
                ) : (
                  <div className="workout-exercises-list">
                    {personalExercises.map((exercise, idx) => (
                      <div key={exercise._id || idx} className="workout-exercise-item">
                        <div className="exercise-item-header">
                          <span className="exercise-item-number">
                            {exerciseNames[exercise.exercise_id] || "Unknown Exercise"}
                          </span>
                        </div>
                        {exercise.weight && (
                          <div className="exercise-item-detail">
                            <span className="exercise-detail-label">Weight:</span>{" "}
                            <span>{exercise.weight} lbs</span>
                          </div>
                        )}
                        {exercise.sets != null && exercise.sets !== undefined && exercise.sets !== "" && exercise.sets !== 0 && (
                          <div className="exercise-item-detail">
                            <span className="exercise-detail-label">Sets:</span>{" "}
                            <span>{exercise.sets}</span>
                          </div>
                        )}
                        {exercise.reps != null && exercise.reps !== undefined && exercise.reps !== "" && exercise.reps !== 0 && (
                          <div className="exercise-item-detail">
                            <span className="exercise-detail-label">Reps:</span>{" "}
                            <span>{exercise.reps}</span>
                          </div>
                        )}
                        {exercise.duration != null && exercise.duration !== undefined && Number(exercise.duration) > 0 && (
                          <div className="exercise-item-detail">
                            <span className="exercise-detail-label">Duration:</span>{" "}
                            <span>{exercise.duration}s</span>
                          </div>
                        )}
                        {exercise.distance != null && exercise.distance !== undefined && Number(exercise.distance) > 0 && (
                          <div className="exercise-item-detail">
                            <span className="exercise-detail-label">Distance:</span>{" "}
                            <span>{exercise.distance}m</span>
                          </div>
                        )}
                        {(exercise.complete || exercise.completed) && (
                          <div className="exercise-item-detail">
                            <span className="exercise-item-completed">✓ Completed</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="workout-modal-actions">
              <button
                className="workout-modal-btn workout-modal-btn-close"
                onClick={() => setSelectedWorkout(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
