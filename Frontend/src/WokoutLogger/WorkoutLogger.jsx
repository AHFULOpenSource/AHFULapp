import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./WorkoutLogger.css";
import "../siteStyles.css";
import { selectSelectedDateOrToday } from "../Calendar/CalendarSlicer";
import {
  createWorkout,
  updateWorkout,
  deleteWorkout,
  createPersonalExercise,
  updatePersonalExercise,
  deletePersonalExercise,
  toggleWorkoutFavorite,
} from "../QueryFunctions.js";
import { fetchWorkoutById, fetchExerciseById } from "./QueryFunctions-WorkoutLogger.js";
import { fetchAllGyms } from "../Gyms/QueryFunctions-Gym.js";
import { pullWorkouts } from "./PullWorkoutSlice.js";
import { pullPersonalExercises } from "../HistoryPRs/PullPersonalExerciseSlice.js";
import { pullTemplates, selectTemplates } from "../Templates/PullTemplateSlice.js";
import { pullExercises } from "../ExercisesCard/PullExercise.jsx";
import { Loading } from "../Loading.jsx";
import { useAutosave } from "./useAutosave.js";
import { GetFirebaseUser } from "../Auth/GetFirebaseUser.js";
import { WorkoutLandingView } from "./WorkoutLandingView.jsx";
import { ActiveWorkoutView } from "./ActiveWorkoutView.jsx";

export function WorkoutLogger() {
  // ─── Redux & Auth State ──────────────────────────────────────────────────
  const { user, loading: authLoading } = GetFirebaseUser();
  const userId = useSelector((state) => state.setting.user_id);
  const dispatch = useDispatch();

  const selectedDate = useSelector(selectSelectedDateOrToday);
  const cachedWorkouts = useSelector((state) => state.pullWorkout.workouts);
  const cachedPersonalExercises = useSelector(
    (state) => state.pullPersonalExercise.personalExercises
  );
  const cachedTemplates = useSelector(selectTemplates);
  const cachedExercises = useSelector((state) => state.pullExercise?.exercises || []);

  // ─── View State: "landing" (Screen 1) vs "active" (Screen 2) ─────────────
  const [activeView, setActiveView] = useState("landing");

  // ─── Active Workout State ────────────────────────────────────────────────
  const [selectedEditableWorkout, setSelectedWorkout] = useState(null);
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [selectedGymId, setSelectedGymId] = useState("");
  const [exercisesInProgressTable, setExercisesInProgressTable] = useState([]);
  const [personalExNames, setPersonalExNames] = useState({});
  const [personalExToRemove, setPersonalExToRemove] = useState({});

  // ─── Gyms & General State ────────────────────────────────────────────────
  const [availableGyms, setAvailableGyms] = useState([]);
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [workoutError, setWorkoutError] = useState(null);

  // ─── Timer State ─────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);

  // ─── Autosave State ──────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState("idle");

  // ─── Refs for Autosave ───────────────────────────────────────────────────
  const workoutRef = useRef(selectedEditableWorkout);
  const workoutTitleRef = useRef(workoutTitle);
  const selectedGymIdRef = useRef(selectedGymId);
  const exercisesInProgressTableRef = useRef(exercisesInProgressTable);
  const personalExToRemoveRef = useRef(personalExToRemove);
  const timeRef = useRef(time);

  useEffect(() => {
    workoutRef.current = selectedEditableWorkout;
  }, [selectedEditableWorkout]);

  useEffect(() => {
    workoutTitleRef.current = workoutTitle;
  }, [workoutTitle]);

  useEffect(() => {
    selectedGymIdRef.current = selectedGymId;
  }, [selectedGymId]);

  useEffect(() => {
    exercisesInProgressTableRef.current = exercisesInProgressTable;
  }, [exercisesInProgressTable]);

  useEffect(() => {
    personalExToRemoveRef.current = personalExToRemove;
  }, [personalExToRemove]);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // ─── Timer Interval ──────────────────────────────────────────────────────
  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning]);

  // ─── Fetch Gyms & Initial Caches ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const gyms = await fetchAllGyms();
        if (mounted && Array.isArray(gyms)) setAvailableGyms(gyms);
      } catch (err) {
        console.error("Failed to load gyms:", err);
      }
    })();

    dispatch(pullWorkouts());
    dispatch(pullPersonalExercises());
    dispatch(pullTemplates());
    pullExercises().catch((err) => console.error("Failed to load exercises:", err));

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // ─── Filter Daily Workouts for Selected Date ─────────────────────────────
  const dailyWorkouts = useMemo(() => {
    if (!selectedDate || !Array.isArray(cachedWorkouts)) return [];

    const [year, month, day] = selectedDate.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).getTime() / 1000;
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime() / 1000;

    return cachedWorkouts.filter(
      (w) => w.startTime && w.startTime >= startOfDay && w.startTime <= endOfDay
    );
  }, [selectedDate, cachedWorkouts]);

  // ─── Helper: Fetch & Cache Exercise Names ────────────────────────────────
  const loadMissingExerciseNames = useCallback(async (exerciseIds = []) => {
    const missing = exerciseIds.filter((id) => id && !personalExNames[id]);
    if (missing.length === 0) return;

    try {
      const entries = await Promise.all(
        missing.map(async (id) => {
          try {
            const data = await fetchExerciseById(id);
            return [id, data?.name || "Exercise"];
          } catch {
            return [id, "Exercise"];
          }
        })
      );
      setPersonalExNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    } catch (err) {
      console.error("Failed to load exercise names:", err);
    }
  }, [personalExNames]);

  // ─── Autosave Persistence Engine ─────────────────────────────────────────
  const persistWorkout = useCallback(async () => {
    const activeWorkout = workoutRef.current;
    if (!activeWorkout?._id) return { ok: true };

    setSaveStatus("saving");
    try {
      // 1. Save all exercises currently in the table
      const savedExercises = await Promise.all(
        exercisesInProgressTableRef.current.map(async (ex, idx) => {
          const isNew = !ex._id;
          const totalSets = Array.isArray(ex.setDetails) ? ex.setDetails.length : ex.sets || 1;
          const isComplete = Array.isArray(ex.setDetails)
            ? ex.setDetails.length > 0 && ex.setDetails.every((s) => s.completed)
            : Boolean(ex.complete);

          // Derive representative weight/reps for backward compatibility
          const lastSet = Array.isArray(ex.setDetails) ? ex.setDetails[ex.setDetails.length - 1] : null;
          const weight = lastSet?.weight !== undefined && lastSet?.weight !== "" ? lastSet.weight : ex.weight || 0;
          const reps = lastSet?.reps !== undefined ? lastSet.reps : ex.reps || 10;

          const peData = isNew
            ? {
                user_id: ex.user_id || userId,
                exercise_id: ex.exercise_id,
                workout_id: activeWorkout._id,
                complete: isComplete,
                distance: ex.distance || 0,
                duration: ex.duration || 0,
                reps,
                sets: totalSets,
                weight,
                order: idx,
                setDetails: ex.setDetails || [],
              }
            : {
                complete: isComplete,
                distance: ex.distance || 0,
                duration: ex.duration || 0,
                reps,
                sets: totalSets,
                weight,
                order: idx,
                setDetails: ex.setDetails || [],
              };

          if (isNew) {
            const res = await createPersonalExercise(peData);
            const newId = res?.personal_ex_id || res?._id || res?.data?._id;
            return { ...ex, ...peData, _id: newId, id: newId || ex.id };
          } else {
            await updatePersonalExercise(ex._id, peData);
            return { ...ex, ...peData, id: ex._id || ex.id };
          }
        })
      );

      // Keep exercisesInProgressTable in sync with assigned IDs
      setExercisesInProgressTable(savedExercises);

      // 2. Delete exercises marked for removal
      const deleteRequests = Object.values(personalExToRemoveRef.current)
        .filter((ex) => ex?._id)
        .map((ex) => deletePersonalExercise(ex._id));

      await Promise.all(deleteRequests);

      // 3. Update workout title, gym, and duration
      const workoutPayload = {
        title: workoutTitleRef.current || activeWorkout.title,
        gym_id: selectedGymIdRef.current || activeWorkout.gym_id || "000000000000000000000000",
        startTime: activeWorkout.startTime,
        endTime: (activeWorkout.startTime || 0) + timeRef.current,
      };

      await updateWorkout(activeWorkout._id, workoutPayload);

      // Refresh Redux caches in background
      dispatch(pullWorkouts());
      dispatch(pullPersonalExercises());

      setPersonalExToRemove({});
      setSaveStatus("saved");
      return { ok: true };
    } catch (err) {
      console.error("Autosave error:", err);
      setSaveStatus("error");
      return { ok: false, error: err };
    }
  }, [dispatch, userId]);

  const {
    trigger: triggerWorkoutAutosave,
    flush: flushWorkoutAutosave,
    isPending: isWorkoutAutosavePending,
  } = useAutosave(persistWorkout);

  const queueAutosave = useCallback(() => {
    setSaveStatus((curr) => (curr === "saving" ? curr : "pending"));
    triggerWorkoutAutosave();
  }, [triggerWorkoutAutosave]);

  useEffect(() => {
    if (isRunning) queueAutosave();
  }, [time, isRunning, queueAutosave]);

  // ─── Action: Select and Open Workout (Transition to Screen 2) ────────────
  const handleSelectWorkout = useCallback(
    async (workout) => {
      if (!workout) return;

      setSelectedWorkout(workout);
      setWorkoutTitle(workout.title || "");
      setSelectedGymId(workout.gym_id || "");
      setTime(
        workout.startTime && workout.endTime && workout.endTime > workout.startTime
          ? workout.endTime - workout.startTime
          : 0
      );
      setIsRunning(false);
      setSaveStatus("idle");
      setPersonalExToRemove({});

      // Find exercises for this workout from cache
      const workoutExercises = (cachedPersonalExercises || [])
        .filter((pe) => pe?.workout_id === workout._id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((pe, idx) => {
          let setDetails = Array.isArray(pe.setDetails) && pe.setDetails.length > 0 ? pe.setDetails : null;
          if (!setDetails) {
            const count = Math.max(1, Number(pe.sets) || 1);
            setDetails = Array.from({ length: count }, (_, sIdx) => ({
              id: `set-${sIdx + 1}`,
              setNum: sIdx + 1,
              setType: sIdx === 0 && count > 1 ? "W" : "N",
              weight: pe.weight !== undefined && pe.weight !== null ? pe.weight : "",
              reps: pe.reps || 10,
              completed: Boolean(pe.complete),
              prev: "-",
            }));
          }
          return {
            ...pe,
            id: pe._id || `pe-${pe.exercise_id}-${idx}`,
            order: pe.order !== undefined ? pe.order : idx,
            setDetails,
          };
        });

      setExercisesInProgressTable(workoutExercises);

      // Load exercise display names
      const exerciseIds = workoutExercises.map((pe) => pe.exercise_id);
      loadMissingExerciseNames(exerciseIds);

      setActiveView("active");
    },
    [cachedPersonalExercises, loadMissingExerciseNames]
  );

  // ─── Action: Create New Workout ──────────────────────────────────────────
  const handleCreateWorkout = async ({ title, gym_id }) => {
    if (!selectedDate || !userId) return;

    const [year, month, day] = selectedDate.split("-").map(Number);
    const startUnix = Math.floor(new Date(year, month - 1, day, 0, 0, 0).getTime() / 1000);

    const payload = {
      user_id: userId,
      title: title || `Workout ${selectedDate}`,
      gym_id: gym_id || "000000000000000000000000",
      startTime: startUnix,
      endTime: startUnix,
    };

    try {
      const created = await createWorkout(payload);
      const persisted = await fetchWorkoutById(created.workout_id);

      dispatch(pullWorkouts());
      handleSelectWorkout(persisted);
      return persisted;
    } catch (err) {
      console.error("Failed to create workout:", err);
      alert("Failed to create workout. Please try again.");
    }
  };

  // ─── Action: Delete Workout ──────────────────────────────────────────────
  const handleDeleteWorkout = async (workoutId) => {
    try {
      await deleteWorkout(workoutId);
      dispatch(pullWorkouts());
      if (selectedEditableWorkout?._id === workoutId) {
        handleBackToLanding();
      }
    } catch (err) {
      console.error("Failed to delete workout:", err);
      alert("Failed to delete workout.");
    }
  };

  // ─── Action: Toggle Workout Favorite ─────────────────────────────────────
  const handleToggleFavorite = async (workoutId) => {
    const targetId = workoutId || selectedEditableWorkout?._id;
    if (!targetId) return;

    try {
      const res = await toggleWorkoutFavorite(targetId);
      if (res?.data) {
        dispatch(pullWorkouts());
        if (selectedEditableWorkout?._id === targetId) {
          setSelectedWorkout((prev) => ({ ...prev, favorite: !prev.favorite }));
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  // ─── Action: Start from Template ─────────────────────────────────────────
  const handleStartFromTemplate = async (template) => {
    if (!template || !selectedDate || !userId) return;

    const [year, month, day] = selectedDate.split("-").map(Number);
    const startUnix = Math.floor(new Date(year, month - 1, day, 0, 0, 0).getTime() / 1000);

    const payload = {
      user_id: userId,
      title: template.title || `Workout ${selectedDate}`,
      gym_id: "000000000000000000000000",
      startTime: startUnix,
      endTime: startUnix,
    };

    try {
      const created = await createWorkout(payload);
      const persisted = await fetchWorkoutById(created.workout_id);

      // Create personal exercises from template exercises
      const templateExercises =
        template.exercises ||
        (cachedPersonalExercises || []).filter((pe) => pe.workout_id === template._id);

      if (templateExercises.length > 0) {
        await Promise.all(
          templateExercises.map((tplEx, idx) =>
            createPersonalExercise({
              user_id: userId,
              exercise_id: tplEx.exercise_id,
              workout_id: persisted._id,
              reps: tplEx.reps || 10,
              sets: tplEx.sets || 3,
              weight: tplEx.weight || 0,
              order: idx,
              complete: false,
              setDetails: tplEx.setDetails || [],
            })
          )
        );
      }

      dispatch(pullWorkouts());
      dispatch(pullPersonalExercises());
      handleSelectWorkout(persisted);
    } catch (err) {
      console.error("Failed to create workout from template:", err);
      alert("Failed to start from template.");
    }
  };

  // ─── Action: Save Active Workout as Template ─────────────────────────────
  const handleSaveAsTemplate = async () => {
    if (!selectedEditableWorkout?._id || !userId) return;

    const titlePrompt = window.prompt(
      "Enter a name for this template:",
      workoutTitle || selectedEditableWorkout.title || "My Routine Template"
    );
    if (!titlePrompt || !titlePrompt.trim()) return;

    try {
      const exercisesPayload = exercisesInProgressTable.map((ex, idx) => ({
        exercise_id: ex.exercise_id,
        order: idx,
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        weight: ex.weight || 0,
        setDetails: ex.setDetails || [],
      }));

      const res = await fetch("http://localhost:5000/api/AHFULtemplate/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: titlePrompt.trim(),
          exercises: exercisesPayload,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save template.");
      }

      dispatch(pullTemplates());
      alert(`"${titlePrompt.trim()}" saved to your templates!`);
    } catch (err) {
      console.error("Save template error:", err);
      alert("Failed to save template: " + (err.message || "Unknown error"));
    }
  };

  // ─── Active Workout Handlers ─────────────────────────────────────────────
  const handleAddExerciseToActiveWorkout = (catalogExercise) => {
    if (!catalogExercise?._id || !selectedEditableWorkout?._id) return;

    const newIdx = exercisesInProgressTable.length;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const defaultSets = [
      { id: `s1-${Date.now()}`, setNum: 1, setType: "W", weight: "", reps: 10, completed: false, prev: "-" },
      { id: `s2-${Date.now() + 1}`, setNum: 2, setType: "N", weight: "", reps: 10, completed: false, prev: "-" },
      { id: `s3-${Date.now() + 2}`, setNum: 3, setType: "N", weight: "", reps: 10, completed: false, prev: "-" },
    ];

    const newPersonalEx = {
      id: tempId,
      exercise_id: catalogExercise._id,
      workout_id: selectedEditableWorkout._id,
      user_id: userId,
      order: newIdx,
      complete: false,
      sets: 3,
      reps: 10,
      weight: "",
      setDetails: defaultSets,
    };

    setPersonalExNames((prev) => ({
      ...prev,
      [catalogExercise._id]: catalogExercise.name || "Exercise",
    }));

    setExercisesInProgressTable((prev) => [...prev, newPersonalEx]);
    queueAutosave();
  };

  const handleUpdateExerciseSetDetails = (identifier, newSetDetails) => {
    setExercisesInProgressTable((prev) => {
      const targetIdx =
        typeof identifier === "number"
          ? identifier
          : prev.findIndex(
              (ex) =>
                (ex._id && ex._id === identifier) ||
                (ex.id && ex.id === identifier)
            );

      if (targetIdx === -1 || !prev[targetIdx]) return prev;

      const updated = [...prev];
      const target = { ...updated[targetIdx] };
      target.setDetails = newSetDetails;
      target.sets = newSetDetails.length;
      target.complete =
        newSetDetails.length > 0 && newSetDetails.every((s) => s.completed);

      const lastSet = newSetDetails[newSetDetails.length - 1];
      if (lastSet) {
        target.weight = lastSet.weight;
        target.reps = lastSet.reps;
      }

      updated[targetIdx] = target;
      return updated;
    });
    queueAutosave();
  };

  const handleReorderExercise = (fromIndex, toIndex) => {
    setExercisesInProgressTable((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((item, idx) => ({ ...item, order: idx }));
    });
    queueAutosave();
  };

  const handleRemoveExercise = (identifier) => {
    setExercisesInProgressTable((prev) => {
      const targetIdx =
        typeof identifier === "number"
          ? identifier
          : prev.findIndex(
              (ex) =>
                (ex._id && ex._id === identifier) ||
                (ex.id && ex.id === identifier)
            );

      if (targetIdx === -1 || !prev[targetIdx]) return prev;

      const target = prev[targetIdx];
      if (target?._id) {
        setPersonalExToRemove((curr) => ({ ...curr, [target._id]: target }));
      }
      return prev
        .filter((_, idx) => idx !== targetIdx)
        .map((item, idx) => ({ ...item, order: idx }));
    });
    queueAutosave();
  };

  const handleBackToLanding = async () => {
    setIsRunning(false);
    await flushWorkoutAutosave();
    if (isWorkoutAutosavePending()) return;
    setSelectedWorkout(null);
    setExercisesInProgressTable([]);
    setActiveView("landing");
  };

  const handleFinishWorkout = async () => {
    // Mark all sets completed
    setExercisesInProgressTable((prev) =>
      prev.map((ex) => {
        const sets = (ex.setDetails || []).map((s) => ({ ...s, completed: true }));
        return { ...ex, complete: true, setDetails: sets };
      })
    );
    setIsRunning(false);
    await flushWorkoutAutosave();
    if (isWorkoutAutosavePending()) return;
    alert("Workout completed! Great effort today!");
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  if (workoutLoading || authLoading) {
    return <Loading message="Loading your workout logger..." />;
  }

  if (workoutError) {
    return (
      <div className="workout-error-container">
        <h2>Error Loading Workout</h2>
        <p>{workoutError}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (activeView === "active" && selectedEditableWorkout) {
    return (
      <ActiveWorkoutView
        workout={selectedEditableWorkout}
        workoutTitle={workoutTitle}
        onChangeWorkoutTitle={(title) => {
          setWorkoutTitle(title);
          queueAutosave();
        }}
        selectedGymId={selectedGymId}
        onChangeGymId={(gymId) => {
          setSelectedGymId(gymId);
          queueAutosave();
        }}
        availableGyms={availableGyms}
        exercisesInProgress={exercisesInProgressTable}
        personalExNames={personalExNames}
        cachedExerciseCatalog={cachedExercises}
        onUpdateExerciseSetDetails={handleUpdateExerciseSetDetails}
        onRemoveExercise={handleRemoveExercise}
        onReorderExercise={handleReorderExercise}
        onAddExercise={handleAddExerciseToActiveWorkout}
        onToggleFavorite={() => handleToggleFavorite(selectedEditableWorkout._id)}
        onSaveAsTemplate={handleSaveAsTemplate}
        onBack={handleBackToLanding}
        time={time}
        isRunning={isRunning}
        onToggleTimer={() => setIsRunning((r) => !r)}
        saveStatus={saveStatus}
        onFinishWorkout={handleFinishWorkout}
      />
    );
  }

  // Default: Screen 1 Landing View
  return (
    <WorkoutLandingView
      selectedDate={selectedDate}
      dailyWorkouts={dailyWorkouts}
      availableGyms={availableGyms}
      templates={cachedTemplates}
      onSelectWorkout={handleSelectWorkout}
      onCreateWorkout={handleCreateWorkout}
      onDeleteWorkout={handleDeleteWorkout}
      onToggleFavorite={handleToggleFavorite}
      onStartFromTemplate={handleStartFromTemplate}
    />
  );
}

export default WorkoutLogger;