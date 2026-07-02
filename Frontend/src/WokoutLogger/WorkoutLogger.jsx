import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import "./WorkoutLogger.css";
import "../siteStyles.css";
import { CalendarButton } from "../Calendar/CalendarButton.jsx";
import {
  getDefaultNewExercise,
  formatTime as formatTimeFn,
  loadEquipment as loadEquipmentFn,
  loadTargetMuscles,
  searchExercises,
  fetchWorkout,
  fetchWorkoutById,
  fetchPersonalExercises,
  fetchExerciseById,
  fetchAllGyms,
  createWorkout,
  updateWorkout,
  createPersonalExercise,
  updatePersonalExercise,
  deletePersonalExercise,
  loadBodyParts,
  createExercise,
  toggleWorkoutFavorite,
} from "../QueryFunctions.js";
import { pullWorkouts } from "../components/Cache/WorkoutCache/PullWorkout.jsx";
import { pullPersonalExercises } from "../components/Cache/PersonalExerciseCache/PersonalExercise.jsx";
import { Loading } from "../Loading.jsx";
import { useAutosave } from "./useAutosave.js";

/**
 * Logger - Main workout tracking page
 *
 * Features:
 * - Create/manage daily workouts
 * - Add exercises from the database
 * - Create custom exercises
 * - Track reps, sets, weight for each exercise
 * - Workout timer
 *
 * Auth Flow:
 * - Gets user from Redux auth state
 * - Creates a default workout for today if none exists
 * - Loads existing personal exercises for the workout
 */
export function WorkoutLogger() {
  // ─── Redux State ─────────────────────────────────────────────────────────
  const user = useSelector((state) => state.auth.user);
  const cachedExercises = useSelector((state) => state.pullExercise?.exercises);
  const userAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const selectedDate = useSelector((state) => state.calendar.selectedDate);
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

  // ─── Exercise Database State ──────────────────────────────────────────────────
  // All exercises available in the database
  const [exercises, setExercises] = useState([]);
  // Exercise list loading state
  const [exerciseLoading, setExerciseLoading] = useState(false);
  // Error state for exercise operations
  const [error, setError] = useState(null);

  // ─── Workout State ───────────────────────────────────────────────────────────
  // Daily workouts for the date
  const [dailyWorkouts, setDailyWorkouts] = useState([]);
  // Current workout object from database
  const [workout, setWorkout] = useState(null);
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

  // ─── Exercise Selection State ────────────────────────────────────────────────
  const [exerciseName, setExerciseName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Selected exercise IDs pending to be added to workout
  const [pendingExercises, setPendingExercises] = useState([]);
  // Modal visibility for creating new exercises
  const [showNewExerciseModal, setShowNewExerciseModal] = useState(false);

  // ─── New Exercise Form States
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [equipmentError, setEquipmentError] = useState(null);
  const [BodyPartOptions, setBodyPartOptions] = useState([]);
  const [BodyPartError, setBodyPartError] = useState(null);
  const [muscleOptions, setMuscleOptions] = useState([]);
  const [muscleError, setMuscleError] = useState(null);
  const [newExercise, setNewExercise] = useState(getDefaultNewExercise());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  // ─── Favorite Filter State ───────────────────────────────────────────────────
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ─── Refs ───────────────────────────────────────────────────────────────────
  const searchTimeoutRef = useRef(null);
  const workoutRef = useRef(workout);
  const workoutTitleRef = useRef(workoutTitle);
  const selectedGymIdRef = useRef(selectedGymId);
  const exercisesInProgressTableRef = useRef(exercisesInProgressTable);
  const personalExToRemoveRef = useRef(personalExToRemove);
  const timeRef = useRef(time);

  useEffect(() => {
    workoutRef.current = workout;
    workoutTitleRef.current = workoutTitle;
    selectedGymIdRef.current = selectedGymId;
    exercisesInProgressTableRef.current = exercisesInProgressTable;
    personalExToRemoveRef.current = personalExToRemove;
    timeRef.current = time;
  }, [workout, workoutTitle, selectedGymId, exercisesInProgressTable, personalExToRemove, time]);

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

  // ─── Use Effects ───────────────────────────────────────────────────────────────────

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

      const todaysWorkout = todaysWorkouts.find((w) => {
        if (!w?.startTime) return false;
        const workoutDate = new Date(w.startTime * 1000);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === selectedDay.getTime();
      });

      const activeWorkoutId = workoutRef.current?._id || null;
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

  // ─── Load Exercise Options on Mount ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Load equipment options
    (async () => {
      const res = await loadEquipmentFn();
      if (!mounted) return;
      if (res && res.data) setEquipmentOptions(res.data);
      if (res && res.error) setEquipmentError(res.error);
})();

    // Load muscle options
    (async () => {
      const res = await loadTargetMuscles();
      if (!mounted) return;
      if (res && res.data) setMuscleOptions(res.data);
      if (res && res.error) setMuscleError(res.error);
    })();

    // Load body part options
    (async () => {
      const res = await loadBodyParts();
      if (!mounted) return;
      if (res && res.data) setBodyPartOptions(res.data);
      if (res && res.error) setBodyPartError(res.error);
    })();

    //Load Gyms
    (async () => {
      const res = await fetchAllGyms();
      if (!mounted) return;
      setAvailableGyms(Array.isArray(res) ? res : []);
    })();

    //Pull in cached exercises from Redux store to avoid unnecessary DB calls
    setExercises(Array.isArray(cachedExercises) ? cachedExercises : []);


    return () => {
      mounted = false;
      // ─── Cleanup Search Timeout on Unmount ─────────────────────────────────────
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // ─── Utility Functions ───────────────────────────────────────────────────────
  const resetNewExercise = () => setNewExercise(getDefaultNewExercise());

  const unixToDate = (unix) => {
    return new Date(unix * 1000).toLocaleDateString("en-US");
  };

  const handleToggleFavorite = async (workoutId) => {
    if (!workoutId) return;
    try {
      const { error } = await toggleWorkoutFavorite(workoutId);
      if (!error) {
        setDailyWorkouts((prev) =>
          prev.map((item) =>
            item._id === workoutId ? { ...item, favorite: !item.favorite } : item,
          ),
        );
        setWorkout((prev) =>
          prev && prev._id === workoutId ? { ...prev, favorite: !prev.favorite } : prev,
        );
      } else {
        console.error("Failed to toggle favorite:", error);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  // ─── Modal Handlers ─────────────────────────────────────────────────────────
  const openNewExerciseModal = () => {
    resetNewExercise();
    setShowNewExerciseModal(true);
  };

  const closeNewExerciseModal = () => {
    setShowNewExerciseModal(false);
  };

  // ─── New Exercise Form Handler ────────────────────────────────────────────────
  const handleNewExerciseSave = async (e) => {
    e.preventDefault();
    if (!newExercise.name.trim()) {
      alert("Please enter a name for the exercise");
      return;
    }

    setIsSaving(true);
    try {
      const result = await createExercise(newExercise);

      if (result.error) {
        alert(`Failed to save exercise: ${result.error}`);
        return;
      }

      // Add the new exercise to the local list
      setExercises((prev) => [
        ...prev,
        { ...newExercise, _id: result.data.exercise_id },
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      closeNewExerciseModal();
      resetNewExercise();
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Multi-select Handler for Exercise Form ─────────────────────────────────
  const handleMultiSelectChange = (e, field) => {
    const values = Array.from(e.target.selectedOptions, (o) => o.value);
    setNewExercise((prev) => ({ ...prev, [field]: values }));
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
    if (!workout?._id) {
      setExercisesInProgressTable([]);
      setPersonalExToRemove({});
      return;
    }

    const workoutPersonalExercises =
      cachedPersonalExercises?.filter(
        (pe) => pe?.workout_id === workout._id,
      ) || [];

    setExercisesInProgressTable(workoutPersonalExercises);
    setPersonalExToRemove({});
  }, [workout?._id, cachedPersonalExercises]);

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

  // Append selected pending exercises to the in-progress table
  const addExerciseToWorkout = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    console.log("Adding exercises...");
    console.log("workout._id:", workout?._id);

    // Ensure workout is loaded before adding exercises
    if (!workout?._id) {
      await handleCreateWorkout(selectedDate ? new Date(selectedDate) : new Date());
    }

    if (!workout?._id) return;

    if (pendingExercises.length === 0) return;

    console.log("Pending exercises to add:", pendingExercises);

    // Create exercise objects with workout context
    const newExercises = pendingExercises.map((rawName) => ({
      exercise_id: rawName,
      workout_id: workout._id,
      user_id: user?._id,
      complete: false,
      reps: 0,
      sets: 0,
      weight: "0",
      distance: "0",
      duration: 0,
    }));

    setExercisesInProgressTable((prev) => [...prev, ...newExercises]);
    setPendingExercises([]);
    setExerciseName("");
    queueWorkoutAutosave();
  };

  // ─── Search Exercises ─────────────────────────────────────────────────────────
  const handleSearch = async (query) => {
    const searchQuery = typeof query === "string" ? query : exerciseName;

    if (!searchQuery) {
      setSearchTerm(exerciseName);
      setExercises(Array.isArray(cachedExercises) ? cachedExercises : []);
      return;
    }

    setExerciseLoading(true);
    setError(null);
    try {
      const list = await searchExercises(searchQuery);
      setExercises(list);
    } catch (err) {
      console.error("Search failed:", err);
      const friendly =
        err && err.name ? `${err.name}: ${err.message}` : String(err);
      setError(friendly || "Unknown error");
    } finally {
      setExerciseLoading(false);
    }
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
    } catch (err) {
      console.error("Error creating workout:", err);
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
      <CalendarButton />

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
          <div className="favorite-filter-section">
            <button
              className={`favorite-filter-btn ${showFavoritesOnly ? "active" : ""}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              {showFavoritesOnly ? "⭐ Favorites" : "☆ All"}
            </button>
          </div>

          <div className="workout-scroll-container">
            <p>Showing workout for {selectedDate?.slice(0, 10) || "selected date"}</p>

            {(!dailyWorkouts ||
              (showFavoritesOnly
                ? dailyWorkouts.filter((w) => w.favorite)
                : dailyWorkouts
              ).length === 0) && (
              <div className="no-workouts">
                {showFavoritesOnly
                  ? "No favorite workouts for this day."
                  : "No workouts for this day."}
              </div>
            )}

            {dailyWorkouts &&
              (showFavoritesOnly
                ? dailyWorkouts.filter((w) => w.favorite)
                : dailyWorkouts
              ).map((w) => (
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
                  <button
                    className="workout-favorite-btn"
                    onClick={() => {
                      handleToggleFavorite(w._id);
                    }}
                    title={
                      w.favorite ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    {w.favorite ? "⭐" : "☆"}
                  </button>
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

      {/* Center Column: Workout Card */}
      <div className="center-column">
        {workout ? (
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
                    {workout?.startTime ? unixToDate(workout.startTime) : ""}
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

      {/* Right Column: Exercise Search & Selection */}
      <div className="right-column">
        <div className="add-exercise">
          <div className="add-exercise-form">
            {/* Search Input */}
            <div className="dropdown-wrapper">
              <div className="search-row">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(exerciseName); // run search
                      exitOnEnter(e); // blur input
                    }
                  }}
                />

                <button
                  type="button"
                  className="search-btn"
                  onClick={() => handleSearch(exerciseName)}
                >
                  Search
                </button>
              </div>

              <div className="dropdown-instructions">
                Click an exercise to select it
              </div>

              {/* Exercise List Dropdown */}
              <div className="dropdown">
                {exerciseLoading && (
                  <div className="dropdown-item">Loading...</div>
                )}
                {!exerciseLoading && exercises.length === 0 && (
                  <div className="dropdown-item">No exercises found</div>
                )}
                {!exerciseLoading &&
                  exercises
                    .filter((ex) => ex && (ex.name || ex._id || ex.exercise_id)) // remove empty objects
                    .map((item, i) => {
                      const name = item.name ?? "";
                      const id = item._id ?? item.exerciseId;

                      // Filter by search term
                      if (
                        searchTerm &&
                        !name.toLowerCase().includes(searchTerm.toLowerCase())
                      ) {
                        return;
                      }

                      // Check if already selected
                      const isSelected =
                        typeof id === "string" &&
                        pendingExercises.includes(id) &&
                        exercises.some(
                          (ex) => (ex._id ?? ex.exerciseId) === id,
                        );

                      return (
                        <div
                          key={`item-${i}`}
                          className={`dropdown-item ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setPendingExercises((prev) => {
                              if (
                                !exercises.some(
                                  (ex) => (ex._id ?? ex.exerciseId) === id,
                                )
                              ) {
                                console.warn("Invalid exerciseId clicked:", id);
                                return prev;
                              }
                              if (prev.includes(id)) {
                                return prev.filter((p) => p !== id);
                              }
                              return [...prev, id];
                            });
                          }}
                        >
                          <span>{name}</span>
                          {isSelected && <span className="check">✓</span>}
                        </div>
                      );
                    })}
              </div>
            </div>

            {/* Pending Exercises List */}
            <div className="pending-list">
              {pendingExercises.map((id, i) => {
                const name =
                  personalExNames[id] ||
                  exercises.find((ex) => (ex._id ?? ex.exerciseId) === id)
                    ?.name ||
                  "(Unknown Exercise)";
                return (
                  <div key={i} className="pending-item">
                    <span>{name}</span>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() =>
                        setPendingExercises((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div
              className="add-btn-wrapper"
              style={{ display: "flex", gap: "8px" }}
            >
              <button
                className="workout-add-selected-button add-btn"
                id="add-exercises-btn"
                type="button"
                onClick={() => addExerciseToWorkout()}
              >
                Add Selected Exercises
              </button>
              <button
                className="workout-open-new-button add-btn"
                type="button"
                onClick={openNewExerciseModal}
              >
                Add New Exercise
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveSuccess && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0a7b00",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 3000,
          }}
        >
          Exercise saved successfully!
        </div>
      )}

      {/* New Exercise Modal */}
      {showNewExerciseModal && (
        <div className="modal-overlay" onClick={closeNewExerciseModal}>
          <form
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleNewExerciseSave}
          >
            <h3>Add New Exercise</h3>

            <label style={{ display: "block", marginTop: 8 }}>Name</label>
            <input
              type="text"
              value={newExercise.name}
              onChange={(e) =>
                setNewExercise((p) => ({ ...p, name: e.target.value }))
              }
              style={{ width: "100%" }}
              onKeyDown={exitOnEnter}
            />

            <label style={{ display: "block", marginTop: 8 }}>
              GIF URL (optional)
            </label>
            <input
              type="text"
              value={newExercise.gifUrl}
              onChange={(e) =>
                setNewExercise((p) => ({ ...p, gifUrl: e.target.value }))
              }
              placeholder="https://..."
              style={{ width: "100%" }}
              onKeyDown={exitOnEnter}
            />
            {newExercise.gifUrl && newExercise.gifUrl.startsWith("http") && (
              <div style={{ marginTop: 8, textAlign: "center" }}>
                <img
                  src={newExercise.gifUrl}
                  alt="GIF Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "150px",
                    borderRadius: "8px",
                    border: "2px solid #000",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}

            <label style={{ display: "block", marginTop: 8 }}>
              Target Muscles
            </label>
            {muscleError && (
              <div style={{ color: "red", marginBottom: 6 }}>{muscleError}</div>
            )}
            <select
              multiple
              value={newExercise.targetMuscles}
              onChange={(e) => handleMultiSelectChange(e, "targetMuscles")}
              style={{ width: "100%" }}
            >
              {(muscleOptions || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label style={{ display: "block", marginTop: 8 }}>Body Parts</label>
            {BodyPartError && (
              <div style={{ color: "red", marginBottom: 6 }}>
                {BodyPartError}
              </div>
            )}
            <select
              multiple
              value={newExercise.bodyParts}
              onChange={(e) => handleMultiSelectChange(e, "bodyParts")}
              style={{ width: "100%" }}
            >
              {(BodyPartOptions || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label style={{ display: "block", marginTop: 8 }}>Equipment</label>
            {equipmentError && (
              <div style={{ color: "red", marginBottom: 6 }}>
                {equipmentError}
              </div>
            )}
            <select
              multiple
              value={newExercise.equipment}
              onChange={(e) => handleMultiSelectChange(e, "equipment")}
              style={{ width: "100%" }}
            >
              {(equipmentOptions || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label style={{ display: "block", marginTop: 8 }}>
              Instructions
            </label>
            <textarea
              value={newExercise.instructions}
              onChange={(e) =>
                setNewExercise((p) => ({ ...p, instructions: e.target.value }))
              }
              style={{ width: "100%" }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 12,
              }}
            >
              <button type="button" onClick={closeNewExerciseModal}>
                Cancel
              </button>
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}


    </div>
  );
}