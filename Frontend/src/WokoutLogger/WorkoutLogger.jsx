import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import "./WorkoutLogger.css";
import "../siteStyles.css";
import { selectSelectedDateOrToday } from "../Calendar/CalendarSlicer";
import {
  formatTime as formatTimeFn,
  fetchWorkoutById,
  fetchExerciseById,
  createWorkout,
  updateWorkout,
  createPersonalExercise,
  updatePersonalExercise,
  deletePersonalExercise,
} from "../QueryFunctions.js";
import { fetchAllGyms } from "../Gyms/QueryFunctions-Gym.js";
import { ExercisesCard } from "../ExercisesCard/ExercisesCard.jsx";
import { pullWorkouts } from "../components/Cache/WorkoutCache/PullWorkout.jsx";
import { pullPersonalExercises } from "../components/Cache/PersonalExerciseCache/PersonalExercise.jsx";
import { Loading } from "../Loading.jsx";
import { useAutosave } from "./useAutosave.js";
import { HeatMap } from "./HeatMap.jsx";

/**
 * Logger - Main workout tracking page
 *
 * Features:
 * - Create/manage daily workouts
 * - Add exercises from the database
 * - Create custom exercises
 * - Track reps, sets, weight for each exercise
 * - Workout timer
 * - Heatmap visualization of target muscles worked in current workout
 *
 * Auth Flow:
 * - Gets user from Redux auth state
 * - Creates a default workout for today if none exists
 * - Loads existing personal exercises for the workout
 */
export function WorkoutLogger() {
  // ─── Redux State ─────────────────────────────────────────────────────────
  const user = useSelector((state) => state.auth.user);
  const userAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const selectedDate = useSelector(selectSelectedDateOrToday);
  const cachedWorkouts = useSelector((state) => state.pullWorkout.workouts);
  const cachedPersonalExercises = useSelector((state) => state.pullPersonalExercise.personalExercises);

  // ─── Personal Exercise State ──────────────────────────────────────────────────
  // Tracks exercises to be deleted when workout is submitted (removed from UI but need DB deletion)
  const [personalExToRemove, setPersonalExToRemove] = useState({});
  // Maps exercise IDs to their display names (fetched from backend)
  const [personalExNames, setPersonalExNames] = useState({});
  // Exercises currently in the workout (reps, sets, weight, completed status)
  /* Hook to track state of the InProgressTable on the Workout Page */
  const [exercisesInProgressTable, setExercisesInProgressTable] = useState([]);

  // ─── Workout State ───────────────────────────────────────────────────────────
  // Daily workouts for the date
  const [dailyWorkouts, setDailyWorkouts] = useState([]);
  // Current workout object from database
  const [selectedEditableWorkout, setWorkout] = useState(null);
  // User-editable workout title
  const [workoutTitle, setWorkoutTitle] = useState("");
  // Workout loading state
  const [workoutLoading, setWorkoutLoading] = useState(false);
  // Workout error state
  const [workoutError, setWorkoutError] = useState(null);

  // ─── Workout Picker UI State ─────────────────────────────────────────────────
  // Which workout is selected inside the picker
  const [selectedWorkoutIdForPicker, setSelectedWorkoutIdForPicker] = useState(null);
  // New workout name (for creation)
  const [newWorkoutName, setNewWorkoutName] = useState("");
  // Available gyms and selected gym for new workouts
  const [availableGyms, setAvailableGyms] = useState([]);
  const [selectedGymId, setSelectedGymId] = useState("");

  // ─── Timer State ─────────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);

  const [saveStatus, setSaveStatus] = useState("idle");

  // ─── Refs ───────────────────────────────────────────────────────────────────
  const workoutRef = useRef(selectedEditableWorkout);
  const workoutTitleRef = useRef(workoutTitle);
  const selectedGymIdRef = useRef(selectedGymId);
  const exercisesInProgressTableRef = useRef(exercisesInProgressTable);
  const personalExToRemoveRef = useRef(personalExToRemove);
  const timeRef = useRef(time);

  useEffect(() => {
    workoutRef.current = selectedEditableWorkout;
    workoutTitleRef.current = workoutTitle;
    selectedGymIdRef.current = selectedGymId;
    exercisesInProgressTableRef.current = exercisesInProgressTable;
    personalExToRemoveRef.current = personalExToRemove;
    timeRef.current = time;
  }, [selectedEditableWorkout, workoutTitle, selectedGymId, exercisesInProgressTable, personalExToRemove, time]);

  const persistWorkout = useCallback(async () => {
    const activeWorkout = workoutRef.current;

    if (!activeWorkout?._id) {
      return { ok: false, reason: "no-workout" };
    }

    setSaveStatus("saving");

    try {
      const currentExercises = exercisesInProgressTableRef.current;

      const invalid = currentExercises.some((ex) => ex.sets < 0 || ex.reps < 0);
      if (invalid) {
        setSaveStatus("error");
        return { ok: false, reason: "invalid-values" };
      }

      const saveRequests = currentExercises.map((ex) => {
        const isNew = !ex._id;

        const peData = isNew
          ? {
              complete: ex.complete,
              distance: ex.distance,
              duration: ex.duration,
              exercise_id: ex.exercise_id,
              reps: ex.reps,
              sets: ex.sets,
              user_id: ex.user_id,
              weight: ex.weight,
              workout_id: ex.workout_id,
            }
          : {
              complete: ex.complete,
              distance: ex.distance,
              duration: ex.duration,
              reps: ex.reps,
              sets: ex.sets,
              weight: ex.weight,
            };

        return isNew ? createPersonalExercise(peData) : updatePersonalExercise(ex._id, peData);
      });

      const deleteRequests = Object.values(personalExToRemoveRef.current)
        .filter((ex) => ex._id)
        .map((ex) => deletePersonalExercise(ex._id));

      const responses = await Promise.all([...saveRequests, ...deleteRequests]);
      const failed = responses.filter((response) => response == null || response.error);

      if (failed.length > 0) {
        setSaveStatus("error");
        console.error("Some operations failed:", failed);
        return { ok: false, failed };
      }

      const workoutUpdatePayload = {
        endTime: (activeWorkout.startTime || 0) + timeRef.current,
        startTime: activeWorkout.startTime,
        title: workoutTitleRef.current,
        gym_id: selectedGymIdRef.current,
      };

      const workoutRes = await updateWorkout(activeWorkout._id, workoutUpdatePayload);

      if (workoutRes?.error) {
        setSaveStatus("error");
        console.error("Failed to update workout:", workoutRes.error);
        return { ok: false, error: workoutRes.error };
      }

      await pullWorkouts();
      await pullPersonalExercises();
      setSaveStatus("saved");
      return { ok: true };
    } catch (err) {
      setSaveStatus("error");
      console.error("Error submitting workout:", err);
      return { ok: false, error: err };
    }
  }, []);

  const { trigger: triggerWorkoutAutosave, flush: flushWorkoutAutosave } = useAutosave(
    persistWorkout,
  );

  const queueWorkoutAutosave = () => {
    setSaveStatus((current) => (current === "saving" ? current : "pending"));
    triggerWorkoutAutosave();
  };

  // ─── Timer Logic ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // ─── Load Today's Workout by date ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadWorkoutForDay = async () => {
      if (!userAuthenticated) {
        setWorkoutLoading(false);
        return;
      }

      const selectedDay = selectedDate ? new Date(selectedDate) : new Date();
      selectedDay.setHours(0, 0, 0, 0);
      const currentDateUnix = Math.floor(selectedDay.getTime() / 1000);

      const tomorrow = new Date(selectedDay);
      tomorrow.setDate(selectedDay.getDate() + 1);
      const tomorrowUnix = Math.floor(tomorrow.getTime() / 1000);

      const todaysWorkouts = Array.isArray(cachedWorkouts)
        ? cachedWorkouts.filter(
            (w) => w?.startTime >= currentDateUnix && w?.startTime < tomorrowUnix,
          )
        : [];

      setDailyWorkouts(todaysWorkouts);

      const activeWorkoutId = workoutRef.current?._id || selectedEditableWorkout?._id || null;

      const todaysWorkout =
        todaysWorkouts.find((w) => w?._id === activeWorkoutId) ||
        todaysWorkouts.find((w) => {
          if (!w?.startTime) return false;
          const workoutDate = new Date(w.startTime * 1000);
          workoutDate.setHours(0, 0, 0, 0);
          return workoutDate.getTime() === selectedDay.getTime();
        });

      const workoutId = todaysWorkout?._id || null;
      const tableMatchesWorkout =
        activeWorkoutId &&
        workoutId === activeWorkoutId &&
        exercisesInProgressTable.length > 0 &&
        exercisesInProgressTable.every((exercise) => exercise?.workout_id === workoutId);

      try {
        if (cancelled) return;

        if (todaysWorkout) {
          setWorkout(todaysWorkout);
          setWorkoutTitle(todaysWorkout.title || "");
          setSelectedGymId(todaysWorkout.gym_id || "");
          setSaveStatus("idle");

          if (!tableMatchesWorkout) {
            const workoutPersonalExercises =
              cachedPersonalExercises?.filter(
                (pe) => pe?.workout_id === todaysWorkout._id,
              ) || [];
            setExercisesInProgressTable(workoutPersonalExercises);
          }

          return;
        }

        await flushWorkoutAutosave();
        setWorkout(null);
        setWorkoutTitle("");
        setSelectedGymId("");
        setExercisesInProgressTable([]);
        setSaveStatus("idle");
      } finally {
        if (!cancelled) {
          setWorkoutLoading(false);
        }
      }
    };

    loadWorkoutForDay();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, userAuthenticated, cachedWorkouts, cachedPersonalExercises, flushWorkoutAutosave]);

  // ─── Load Gyms on Mount ─────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    //Load Gyms
    (async () => {
      const res = await fetchAllGyms();
      if (!mounted) return;
      setAvailableGyms(Array.isArray(res) ? res : []);
    })();


    return () => {
      mounted = false;
    };
  }, []);

  const unixToDate = (unix) => {
    return new Date(unix * 1000).toLocaleDateString("en-US");
  };


  // ─── Toggle Exercise Completion ───────────────────────────────────────────────
  const toggleCompleted = (index) => {
    setExercisesInProgressTable((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        complete: !updated[index].complete,
      };
      return updated;
    });
    queueWorkoutAutosave();
  };

  // ─── Update Exercise Field (reps, sets, weight) ───────────────────────────────
  const updateField = (index, field, value) => {
    setExercisesInProgressTable((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    queueWorkoutAutosave();
  };

  // ─── Load Exercise Names for Display ─────────────────────────────────────────
  // When exercises are added to the workout or showing the template preview ,
  // we need to fetch their display names
  useEffect(() => {
    // Collect IDs from workout table
    const exerciesInProgressIds = exercisesInProgressTable.map((ex) => {
      return ex.exercise_id;
    });

    // Combine and dedupe
    const allIds = [...new Set([...exerciesInProgressIds])];

    if (allIds.length === 0) return;

    // Filter missing names
    const missing = allIds.filter((id) => !personalExNames[id]);

    if (missing.length === 0) return;

    const loadNames = async () => {
      try {
        const results = {};

        for (const id of missing) {
          try {
            const data = await fetchExerciseById(id);
            results[id] = data.name;
          } catch (err) {
            console.error("Error fetching exercise name for", id, err);
            results[id] = "Unknown Exercise";
          }
        }

        setPersonalExNames((prev) => ({ ...prev, ...results }));
      } catch (err) {
        console.error("Error fetching exercise names:", err);
      }
    };

    loadNames();
  }, [exercisesInProgressTable]);

  // Keep the table aligned with whichever workout is currently active.
  useEffect(() => {
    if (!selectedEditableWorkout?._id) {
      setExercisesInProgressTable([]);
      setPersonalExToRemove({});
      return;
    }

    const workoutPersonalExercises =
      cachedPersonalExercises?.filter(
        (pe) => pe?.workout_id === selectedEditableWorkout._id,
      ) || [];

    setExercisesInProgressTable(workoutPersonalExercises);
    setPersonalExToRemove({});
  }, [selectedEditableWorkout?._id, cachedPersonalExercises]);

  const handleManualSave = async () => {
    const saved = await flushWorkoutAutosave();

    if (!saved) {
      await persistWorkout();
    }
  };

  // ─── Remove Exercise from Workout ─────────────────────────────────────────────
  // Removes from UI but queues for deletion on submit
  const removePersonalEx = (index) => {
    setExercisesInProgressTable((prev) => {
      const removed = prev[index]; // the exercise being removed

      // Add removed exercise to personalExToRemove
      setPersonalExToRemove((prevRemoved) => ({
        ...prevRemoved,
        [removed._id || removed.exerciseId]: removed,
      }));
      return prev.filter((_, i) => i !== index);
    });
    queueWorkoutAutosave();
  };

  const AddSelectedExercises = async (selectedExercises = []) => {
    if (!Array.isArray(selectedExercises) || selectedExercises.length === 0) return;

    let activeWorkout = workoutRef.current;

    if (!activeWorkout?._id) {
      activeWorkout = await handleCreateWorkout(selectedDate ? new Date(selectedDate) : new Date());
    }

    if (!activeWorkout?._id) return;

    const newExercises = selectedExercises
      .filter((exercise) => exercise?._id)
      .map((exercise) => ({
        exercise_id: exercise._id,
        workout_id: activeWorkout._id,
        user_id: user?._id,
        complete: false,
        reps: 0,
        sets: 0,
        weight: "0",
        distance: "0",
        duration: 0,
      }));

    if (newExercises.length === 0) return;

    setExercisesInProgressTable((prev) => [...prev, ...newExercises]);
    queueWorkoutAutosave();
  };

  // ─── Select Workout Picker logic ──────────────────────────────────────────────────────────────
  function resetWorkoutPicker() {
    setSelectedWorkoutIdForPicker(null); // reset selection
    setNewWorkoutName(""); // reset input
  }

  const exitOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };

  async function handleLoadWorkout() {
    if (!selectedWorkoutIdForPicker) return;

    await flushWorkoutAutosave();

    try {
      const selected = dailyWorkouts.find(
        (w) => w._id === selectedWorkoutIdForPicker,
      );

      if (!selected) return;

      // Fetch full workout from DB (ensures fresh data)
      const fullWorkout = await fetchWorkoutById(selected._id);

      setWorkout(fullWorkout);
      setWorkoutTitle(fullWorkout.title);
      setSelectedGymId(fullWorkout.gym_id || "");

      // Reset timer based on workout times
      if (fullWorkout.startTime && fullWorkout.endTime) {
        setTime(fullWorkout.endTime - fullWorkout.startTime);
      } else {
        setTime(0);
      }

      setSaveStatus("idle");

      resetWorkoutPicker();
    } catch (err) {
      console.error("Error loading workout:", err);
    }
  }

  async function handleCreateWorkout(baseDate) {
    try {
      if (!user?._id) return;

      const workoutDate = baseDate
        ? new Date(baseDate)
        : selectedDate
          ? new Date(selectedDate)
          : new Date();
      workoutDate.setHours(0, 0, 0, 0);
      const startUnix = Math.floor(workoutDate.getTime() / 1000);

      // Use selected gym (or fall back to user's home gym if available)
      const gymId = selectedGymId || user?.settings?.homeGymId || "000000000000000000000000";

      const payload = {
        endTime: startUnix,
        gym_id: gymId,
        startTime: startUnix,
        title: newWorkoutName.trim() || "Workout " + workoutDate.toLocaleDateString(),
        user_id: user._id,
      };

      // Create workout
      const created = await createWorkout(payload);

      // Fetch persisted version
      const persisted = await fetchWorkoutById(created.workout_id);

      // Add to daily list
      setDailyWorkouts((prev) => (prev ? [...prev, persisted] : [persisted]));

      // Load it immediately
      setWorkout(persisted);
      setWorkoutTitle(persisted.title);
      setSelectedGymId(persisted.gym_id);
      setTime(0);
      setExercisesInProgressTable([]);
      setSaveStatus("idle");

      await pullWorkouts(); // Refresh cached workouts in Redux
      resetWorkoutPicker();
      return persisted;
    } catch (err) {
      console.error("Error creating workout:", err);
      return null;
    }
  }

  const toggleTimer = () => {
    setIsRunning((r) => !r);
  };

  const saveButtonLabel = {
    idle: "Save",
    pending: "Save Now",
    saving: "Saving…",
    saved: "Saved ✓",
    error: "Retry Save",
  }[saveStatus];

  const saveButtonClass = `workout-submit-button save-status-${saveStatus}`;

  // ─── Loading State ────────────────────────────────────────────────────────────
  if (workoutLoading) {
    return (
      <Loading message="Please wait while we set up your workout..." />
      
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (workoutError) {
    return (
      <div className="page-layout">
        <div className="center-column">
          <div className="workout-card">
            <h2>Error Loading Workout</h2>
            <p>{workoutError}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────
  return (
  <div className="page-layout">

      <div className="workout-picker-panel">
        <div className="workout-picker-inline">

        {/* Zone A: Create New Workout Section */}
        <div className="create-workout-section">
          <input
            type="text"
            id="new-workout-name-textbox"
            placeholder="Add a New Workout by Entering a Name"
            value={newWorkoutName}
            onChange={(e) => setNewWorkoutName(e.target.value)}
            onKeyDown={exitOnEnter}
          />
          <select
            id="select-gym-dropdown"
            value={selectedGymId}
            onChange={(e) => setSelectedGymId(e.target.value)}
          >
            <option value="">New Workout - No Gym</option>
            {availableGyms.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name || g.address || "Ambiguous Gym"}
              </option>
            ))}
          </select>
          <button
            id="create-new-workout-button"
            className="create-workout-button"
            disabled={!newWorkoutName.trim()}
            onClick={() => handleCreateWorkout(selectedDate ? new Date(selectedDate) : new Date())}
          >
            Create New Workout
          </button>
        </div>

        {/* Zone 1 + 2: Filter, scrollable list, load button */}
        <div className="workout-list">

          <div className="workout-scroll-container">
            <p>Showing workout for {selectedDate?.slice(0, 10)}</p>

            {dailyWorkouts.length === 0 && (
              <div className="no-workouts">
                No workouts for this day.
              </div>
            )}

            {dailyWorkouts &&
               dailyWorkouts.map((w) => (
                <div
                  key={w._id}
                  className={
                    "workout-list-item " +
                    (selectedWorkoutIdForPicker === w._id ? "selected" : "")
                  }
                >
                  <div
                    className="workout-list-content"
                    onClick={() =>
                      setSelectedWorkoutIdForPicker(
                        selectedWorkoutIdForPicker === w._id ? null : w._id,
                      )
                    }
                  >
                    <div className="workout-list-title">{w.title}</div>
                    <div className="workout-list-date">
                      {unixToDate(w.startTime)}
                    </div>
                  </div>
                </div>
              ))}

          </div>

          <button className="load-workout-button"
          disabled={!selectedWorkoutIdForPicker}
            onClick={handleLoadWorkout}
          >
            Load Existing Workout
          </button>

        </div>
      </div>
    </div>

    <ExercisesCard AddSelectedExercises={AddSelectedExercises} />
    <HeatMap />

      {/* Center Column: Workout Card */}
        {selectedEditableWorkout ? (
          <>
            <div className="workout-card">
              {/* Header row: Title on left, button on right */}
              <div className="workout-header">
                <div className="workout-title">
                  <textarea
                    className="workout-title-input"
                    value={workoutTitle}
                    onChange={(e) => {
                      setWorkoutTitle(e.target.value);
                      queueWorkoutAutosave();

                      const el = e.target;

                      // Reset to starting height
                      el.style.height = "2.4em";

                      // Expand up to max-height
                      const scrollHeight = el.scrollHeight;
                      const maxHeight = parseFloat(
                        getComputedStyle(el).maxHeight,
                      );

                      el.style.height =
                        Math.min(scrollHeight, maxHeight) + "px";
                    }}
                  />

                  <h3>
                    {unixToDate(selectedEditableWorkout.startTime)}
                  </h3>
                </div>

                <select
                  value={selectedGymId}
                  onChange={(e) => {
                    setSelectedGymId(e.target.value);
                    queueWorkoutAutosave();
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                  }}
                >
                  <option value="">None / No Gym</option>
                  {availableGyms.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name ||
                        `${g.address || "Unnamed"} (${g._id.slice(0, 6)})`}
                    </option>
                  ))}
                </select>

                <button className="select-workout-button" onClick={resetWorkoutPicker}>
                  Clear Selection
                </button>
              </div>

              {/* Exercise Table */}
              <div className="workout-grid">
                <div className="cell workout-grid-header">Exercise</div>
                <div className="cell workout-grid-header">Reps</div>
                <div className="cell workout-grid-header">Sets</div>
                <div className="cell workout-grid-header">Weight</div>
                <div className="cell workout-grid-header">Completed</div>
                <div className="cell workout-grid-header"></div>

                {exercisesInProgressTable.map((ex, i) => (
                  <React.Fragment key={i}>
                    <div className="cell">
                      {personalExNames[ex.exercise_id] || "Loading..."}
                    </div>

                    <div className="cell">
                      {ex.complete ? (
                        ex.reps
                      ) : (
                        <input
                          type="number"
                          value={ex.reps}
                          onChange={(e) => {
                            const raw = e.target.value;
                            updateField(
                              i,
                              "reps",
                              raw === "" ? "" : Number(raw),
                            );
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              updateField(i, "reps", 0);
                            }
                          }}
                          onKeyDown={exitOnEnter}
                        />
                      )}
                    </div>

                    <div className="cell">
                      {ex.complete ? (
                        ex.sets
                      ) : (
                        <input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => {
                            const raw = e.target.value;
                            updateField(
                              i,
                              "sets",
                              raw === "" ? "" : Number(raw),
                            );
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              updateField(i, "reps", 0);
                            }
                          }}
                          onKeyDown={exitOnEnter}
                        />
                      )}
                    </div>

                    <div className="cell">
                      {ex.complete ? (
                        ex.weight
                      ) : (
                        <input
                          type="text"
                          value={ex.weight}
                          onChange={(e) =>
                            updateField(i, "weight", e.target.value)
                          }
                          onKeyDown={exitOnEnter}
                        />
                      )}
                    </div>

                    <div className="cell">
                      <input
                        type="checkbox"
                        checked={ex.complete}
                        onChange={() => toggleCompleted(i)}
                      />
                    </div>

                    <div className="cell">
                      <button
                        className="delete-button"
                        onClick={() => removePersonalEx(i)}
                      >
                        🗑️
                      </button>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="workout-actions">
                <div className="workout-actions-right-side">
                  <button
                    className={saveButtonClass}
                    onClick={handleManualSave}
                    disabled={saveStatus === "saving"}
                  >
                    {saveButtonLabel}
                  </button>
                </div>
              </div>
            </div>

            {/* Timer Footer */}
            <div className="workout-footer">
              <div className="workout-timer-box workout-timer">
                {formatTimeFn(time)}
              </div>
              <button
                className="workout-timer-box workout-timer-button"
                onClick={toggleTimer}
              >
                {isRunning ? "Stop Timer" : "Start Timer"}
              </button>
            </div>
          </>
        ) : null}
    </div>
  );
}