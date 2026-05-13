import React, { useState, useRef, useEffect } from "react";
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
  createTemplate,
  loadBodyParts,
  createExercise,
  toggleWorkoutFavorite,
} from "../QueryFunctions.js";
import { pullWorkouts } from "../components/Cache/WorkoutCache/PullWorkout.jsx";
import { pullTemplates } from "../components/Cache/TemplateCache/PullTemplate.jsx";
import { pullPersonalExercises } from "../components/Cache/PersonalExerciseCache/PersonalExercise.jsx";

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
  const cachedPersonalExercises = useSelector(
    (state) => state.pullPersonalExercise.personalExercises,
  );
  const templates = useSelector((state) => state.pullTemplate.templates);

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
  // Current workout ID (used for API calls)
  const [workoutId, setWorkoutId] = useState("");
  // User-editable workout title
  const [workoutTitle, setWorkoutTitle] = useState("");
  // Workout loading state
  const [workoutLoading, setWorkoutLoading] = useState(true);
  // Workout error state
  const [workoutError, setWorkoutError] = useState(null);

  // ─── Workout Picker UI State ─────────────────────────────────────────────────
  // Select Workout Popup visibility
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  // Which workout is selected inside the popup
  const [selectedWorkoutIdForPicker, setSelectedWorkoutIdForPicker] =
    useState(null);
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

  // ─── Template States
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);

  // ─── Favorite Filter State ───────────────────────────────────────────────────
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load gyms for the select dropdown
  useEffect(() => {
    let mounted = true;
    async function loadGyms() {
      try {
        const list = await fetchAllGyms();
        if (!mounted) return;
        setAvailableGyms(list || []);
        // default to first gym or user's home gym if available
        // commented out for dev
        // if (!selectedGymId && list && list.length > 0) {
        //   const home = user?.settings?.homeGymId;
        //   const foundHome = home ? list.find((g) => g._id === home) : null;
        //   setSelectedGymId(foundHome ? foundHome._id : list[0]._id);
        // }
      } catch (err) {
        console.error("Failed to load gyms for workout picker:", err);
      }
    }
    loadGyms();
    return () => (mounted = false);
  }, [user]);

  // Set gym_id from workout when page is loaded
  useEffect(() => {
    if (!selectedDate || !cachedWorkouts?.length) return;

    const dateStr = selectedDate.slice(0, 10);

    const todaysWorkout = cachedWorkouts.find((w) => {
      if (!w?.startTime) return false;
      const workoutDate = new Date(w.startTime * 1000)
        .toISOString()
        .slice(0, 10);
      return workoutDate === dateStr;
    });

    if (!todaysWorkout) return;
    (async () => {
      try {
        const fullWorkout = await fetchWorkoutById(todaysWorkout._id);

        setWorkout(fullWorkout);
        setWorkoutId(fullWorkout._id);
        setWorkoutTitle(fullWorkout.title || "");
        setSelectedGymId(fullWorkout.gym_id || "");
      } catch (err) {
        console.error("Failed to load full workout:", err);
      }
    })();
  }, [selectedDate, cachedWorkouts]);


  // ─── Refs ───────────────────────────────────────────────────────────────────
  const searchTimeoutRef = useRef(null);

  // ─── Utility Functions ───────────────────────────────────────────────────────
  const resetNewExercise = () => setNewExercise(getDefaultNewExercise());

  const unixToDate = (unix) => {
    return new Date(unix * 1000).toLocaleDateString("en-US");
  };

  const handleToggleFavorite = async () => {
    if (!workoutId) return;
    try {
      const { data, error } = await toggleWorkoutFavorite(workoutId);
      if (!error) {
        setWorkout((prev) => ({ ...prev, favorite: !prev.favorite }));
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

  // useEffect 1: cleanup debounced search timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

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

    return () => {
      mounted = false;
    };
  }, []);

  // ─── Cleanup Search Timeout on Unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // ─── Load Exercises from Database ─────────────────────────────────────────────
  const fetch_exercises = async () => {
    setExerciseLoading(true);
    setError(null);
    try {
      const list = cachedExercises;
      setExercises(list);
    } catch (err) {
      console.error("Failed to fetch exercises:", err);
      const friendly =
        err && err.name ? `${err.name}: ${err.message}` : String(err);
      setError(friendly || "Unknown error");
      setExercises([]);
    } finally {
      setExerciseLoading(false);
    }
  };

  useEffect(() => {
    fetch_exercises();
  }, []);

  // ─── Load Workout when selectedDate changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedDate) return;

    const dateStr = selectedDate.slice(0, 10);

    // Find workout for selected date from Redux
    const todaysWorkout = cachedWorkouts?.find((w) => {
      if (!w?.startTime) return false;
      const workoutDate = new Date(w.startTime * 1000)
        .toISOString()
        .slice(0, 10);
      return workoutDate === dateStr;
    });

    if (todaysWorkout) {
      setWorkout(todaysWorkout);
      setWorkoutId(todaysWorkout._id);
      setWorkoutTitle(todaysWorkout.title || "");
      setSelectedGymId(todaysWorkout.gym_id || "");

      // Load personal exercises for this workout from cache
      const workoutPersonalExercises =
        cachedPersonalExercises?.filter(
          (pe) => pe?.workout_id === todaysWorkout._id,
        ) || [];

      setExercisesInProgressTable(workoutPersonalExercises);
    } else {
      // No workout for this date - reset state
      setWorkout(null);
      setWorkoutId("");
      setWorkoutTitle("");
      //setSelectedGymId("");
      setExercisesInProgressTable([]);
    }
  }, [selectedDate, cachedWorkouts, cachedPersonalExercises]);

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
  };

  // ─── Update Exercise Field (reps, sets, weight) ───────────────────────────────
  const updateField = (index, field, value) => {
    setExercisesInProgressTable((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ─── Load Exercise Names for Display ─────────────────────────────────────────
  // When exercises are added to the workout or showing the template preview ,
  // we need to fetch their display names
  useEffect(() => {
    // Collect IDs from workout table
    //const workoutIds = exercisesInProgressTable.map((ex) => ex.exerciseId);
    const workoutIds = exercisesInProgressTable.map((ex) => {
      return ex.exercise_id;
    });

    // Collect IDs from template preview
    const templateIds =
      templatePreview?.exercises?.map((ex) => ex.exercise_id) || [];

    // Combine and dedupe
    const allIds = [...new Set([...workoutIds, ...templateIds])];

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
  }, [exercisesInProgressTable, templatePreview]);

  // ─── Save Template ───────────────────────────────────────────────────────────
  // Saves personal exercises as a template using the workout name
  const saveTemplate = async () => {
    try {
      if (!workoutTitle || !user?._id) {
        alert("Cannot save template — missing workout or user.");
        return;
      }
      if (exercisesInProgressTable === 0) {
        alert("No exercises to save.");
        return;
      }

      // 1. Create the template
      const templatePayload = {
        title: workoutTitle,
        user_id: user._id,
      };

      const template = await createTemplate(templatePayload);

      if (!template.success) {
        throw new Error("Failed to create template");
      }

      // 2. Create personalExercises using template._id as workoutId
      for (const ex of exercisesInProgressTable) {
        const personalExPayload = {
          exercise_id: ex.exercise_id,
          reps: ex.reps,
          sets: ex.sets,
          weight: ex.weight,
          duration: ex.duration,
          distance: ex.distance,
          complete: false,
          user_id: user._id,
          workout_id: template.data.workout_id,
          template: true,
        };
        createPersonalExercise(personalExPayload);
      }

      alert("Template has been saved!");
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Failed to save template.");
    }
    await pullTemplates();
    await pullPersonalExercises();
  };

  async function handleApplyTemplate(template) {
    try {
      // Get template exercises from cache (personal exercises with template's workout_id)
      const templateExercises =
        cachedPersonalExercises?.filter(
          (pe) => pe?.workout_id === template._id
        ) || [];

      // Open popup
      setTemplatePreview({
        template,
        exercises: templateExercises,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load template exercises.");
    }
  }

  async function handleConfirmTemplateApply() {
    console.log("Applying template...");

    let targetWorkoutId = workoutId; // default to existing workout

    if (workoutId !== "") {
      // 1. Move current exercises → personalExToRemove
      setPersonalExToRemove((prev) => {
        const removed = { ...prev };

        exercisesInProgressTable.forEach((ex) => {
          const key = ex._id || ex.exercise_id;
          removed[key] = ex;
        });

        return removed;
      });
    } else {
      // 2. Create workout
      const workoutName = `"${templatePreview.template.title}" Workout`;
      const today = selectedDate ? new Date(selectedDate) : new Date();
      today.setHours(0, 0, 0, 0);
      const startUnix = Math.floor(today.getTime() / 1000);

      const payload = {
        endTime: startUnix,
        gym_id: "000000000000000000000000",
        startTime: startUnix,
        title: workoutName,
        user_id: user._id,
      };

      try {
        const created = await createWorkout(payload);
        const persisted = await fetchWorkoutById(created.workout_id);

        // Save the correct ID for later
        targetWorkoutId = persisted._id;

        // Update UI
        setDailyWorkouts((prev) => (prev ? [...prev, persisted] : [persisted]));
        setWorkout(persisted);
        setWorkoutId(persisted._id);
        setWorkoutTitle(persisted.title);
        setSelectedGymId(persisted.gym_id);
        setTime(0);
      } catch (e) {
        console.error("Error: ", e);
        return;
      }
    }

    // 3. Apply template exercises to the correct workout
    setExercisesInProgressTable(
      templatePreview.exercises.map((ex) => ({
        ...ex,
        _id: null,
        workout_id: targetWorkoutId, // <-- ALWAYS correct
        user_id: user._id,
      })),
    );

    // 4. Close popup
    setTemplatePreview(null);
  }

  // ─── Submit Workout ───────────────────────────────────────────────────────────
  // Saves all exercise changes and updates workout end time

  const handleSubmit = async () => {
    console.log("Submitting workout...");

    // Alert if reps or sets are negative numbers

    const invalid = exercisesInProgressTable.some(
      (ex) => ex.sets < 0 || ex.reps < 0,
    );

    if (invalid) {
      alert("Please make sure all reps and sets are not negative numbers.");

      return;
    }

    try {
      // --- CREATE + UPDATE REQUESTS ---
      const saveRequests = exercisesInProgressTable.map((ex) => {
        const isNew = ex._id === null;

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

        return isNew
          ? createPersonalExercise(peData)
          : updatePersonalExercise(ex._id, peData);
      });

      // --- DELETE REQUESTS ---
      const deleteRequests = Object.values(personalExToRemove)
        .filter((ex) => ex._id) // only delete DB-backed exercises
        .map((ex) => deletePersonalExercise(ex._id));

      // --- RUN EVERYTHING IN PARALLEL ---
      const responses = await Promise.all([...saveRequests, ...deleteRequests]);

      const failed = responses.filter((r) => r == null || r.error);

      if (failed.length > 0) {
        console.error("Some operations failed:", failed);
      } else {
        console.log("Workout saved successfully!");
      }

      // --- UPDATE WORKOUT endTime ---
      const workoutUpdatePayload = {
        endTime: workout.startTime + time, // your endTime variable
        startTime: workout.startTime, // keep original startTime
        title: workoutTitle, // keep original title
        gym_id: selectedGymId,
      };

      const workoutRes = await updateWorkout(workoutId, workoutUpdatePayload);

      if (workoutRes.error) {
        console.error("Failed to update workout:", workoutRes.error);
      } else {
        console.log("Workout updated successfully!");
      }

      alert("Workout has been submitted and saved!");
    } catch (err) {
      console.error("Error submitting workout:", err);
    }
    await pullWorkouts();
    await pullPersonalExercises();
    await pullTemplates();
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
  };

  // Append selected pending exercises to the in-progress table
  const addExerciseToWorkout = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    console.log("Adding exercises...");

    let targetWorkoutId = workoutId; // default to existing workout

    // Ensure workout is loaded before adding exercises
    if (workoutId == "") {
      const today = selectedDate ? new Date(selectedDate) : new Date();
      const workoutName = `New Workout`;
      today.setHours(0, 0, 0, 0);
      const startUnix = Math.floor(today.getTime() / 1000);

      const payload = {
        endTime: startUnix,
        gym_id: "000000000000000000000000",
        startTime: startUnix,
        title: workoutName,
        user_id: user._id,
      };

      try {
        const created = await createWorkout(payload);
        // Save the correct ID for later

        // Update UI
        setDailyWorkouts((prev) => (prev ? [...prev, created] : [created]));
        setWorkout(created);
        setWorkoutId(created._id);
        setWorkoutTitle(created.title);
        setSelectedGymId(created.gym_id);
        setTime(0);
      } catch (e) {
        console.error("Error: ", e);
        return;
      }

    }

    if (pendingExercises.length === 0) return;

    // Create exercise objects with workout context
    const newExercises = pendingExercises.map((rawName) => ({
      _id: null, // null = new exercise, will be assigned ID after DB save
      exercise_id: rawName,
      workout_id: targetWorkoutId,
      user_id: user._id,
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
  };

  // ─── Search Exercises ─────────────────────────────────────────────────────────
  const handleSearch = async (query) => {
    const searchQuery = typeof query === "string" ? query : exerciseName;

    if (!searchQuery) {
      setSearchTerm(exerciseName);
      fetchExercises(exerciseName);
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

  useEffect(() => {
    console.log("Workout updated");
  }, [workout]);

  // ─── Select Workout Popup logic ──────────────────────────────────────────────────────────────
  function openWorkoutPicker() {
    setSelectedWorkoutIdForPicker(null); // reset selection
    setNewWorkoutName(""); // reset input
    setShowWorkoutPicker(true);
  }

  function closeWorkoutPicker() {
    setShowWorkoutPicker(false);
  }

  const exitOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };

  async function handleLoadWorkout() {
    if (!selectedWorkoutIdForPicker) return;

    try {
      const selected = dailyWorkouts.find(
        (w) => w._id === selectedWorkoutIdForPicker,
      );

      if (!selected) return;

      // Fetch full workout from DB (ensures fresh data)
      const fullWorkout = await fetchWorkoutById(selected._id);

      setWorkout(fullWorkout);
      setWorkoutId(fullWorkout._id);
      setWorkoutTitle(fullWorkout.title);
      setSelectedGymId(fullWorkout.gym_id || "");

      // Reset timer based on workout times
      if (fullWorkout.startTime && fullWorkout.endTime) {
        setTime(fullWorkout.endTime - fullWorkout.startTime);
      } else {
        setTime(0);
      }

      closeWorkoutPicker();
    } catch (err) {
      console.error("Error loading workout:", err);
    }
  }

  async function handleCreateWorkout() {
    if (!newWorkoutName.trim()) return;

    try {
      const today = selectedDate ? new Date(selectedDate) : new Date();
      today.setHours(0, 0, 0, 0);
      const startUnix = Math.floor(today.getTime() / 1000);

      // Use selected gym (or fall back to user's home gym if available)
      const gymId = selectedGymId || user?.settings?.homeGymId || "" || "";

      const payload = {
        endTime: startUnix,
        gym_id: gymId,
        startTime: startUnix,
        title: newWorkoutName.trim(),
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
      setWorkoutId(persisted._id);
      setWorkoutTitle(persisted.title);
      setSelectedGymId(persisted.gym_id);
      setTime(0);

      closeWorkoutPicker();
    } catch (err) {
      console.error("Error creating workout:", err);
    }
  }

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

  const toggleTimer = () => {
    setIsRunning((r) => !r);
  };

  // ─── Load or Create Today's Workout ───────────────────────────────────────────
  useEffect(() => {
    // Don't proceed if user isn't logged in
    if (!userAuthenticated) {
      setWorkoutLoading(false);
      return;
    }

    async function getWorkout() {
      try {
        setWorkoutLoading(true);
        setWorkoutError(null);

        // Calculate today's date range (midnight to midnight)
        const today = selectedDate ? new Date(selectedDate) : new Date();
        today.setHours(0, 0, 0, 0);
        const currentDateUnix = Math.floor(today.getTime() / 1000);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowUnix = Math.floor(tomorrow.getTime() / 1000);

        // Fetch all workouts for this user
        const allWorkouts = await fetchWorkout(user._id);

        // Filter to today's workouts only
        const todaysWorkouts = allWorkouts.filter(
          (w) => w.startTime >= currentDateUnix && w.startTime < tomorrowUnix,
        );

        // Store them for the UI
        setDailyWorkouts(todaysWorkouts);
      } catch (err) {
        console.error("Error fetching workout:", err);
        setWorkoutError(err.message || "Failed to load workout");
      } finally {
        setWorkoutLoading(false);
      }
    }

    getWorkout();
  }, [userAuthenticated, workoutId]);

  useEffect(() => {
    if (!workoutId) return;

    // If we already have exercises
    if (exercisesInProgressTable.length > 0) {
      return;
    }

    async function getPersonalEx() {
      try {
        const data = await fetchPersonalExercises(workoutId);
        setExercisesInProgressTable(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching personal exercises:", err);
      }
    }

    getPersonalEx();
  }, [workoutId]);

  // ─── Loading State ────────────────────────────────────────────────────────────
  if (workoutLoading) {
    return (
      <div className="page-layout">
        <div className="center-column">
          <div className="workout-card">
            <h2>Loading workout...</h2>
            <p>Please wait while we set up your workout.</p>
          </div>
        </div>
      </div>
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
      {/* Left Column: Template/History */}
      <div className="left-column">
        <div className="template-container">
          <div className="add-template-form">
            {/* Search Bar */}
            <div className="dropdown-wrapper">
              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                onKeyDown={exitOnEnter}
              />

              <div className="dropdown-instructions">
                Select a template to apply
              </div>

              {/* Template List */}
              <div className="dropdown">
                {templates.length === 0 && (
                  <div className="dropdown-item">No templates found</div>
                )}

                {templates
                  .filter((t) => {
                    const title = t?.title ?? "";

                    // Keep selected template visible even if search doesn't match
                    if (selectedTemplate?._id === t._id) return true;

                    return title
                      .toLowerCase()
                      .includes(templateSearch.toLowerCase());
                  })
                  .map((t, i) => {
                    const isSelected = selectedTemplate?._id === t._id;

                    return (
                      <div
                        key={t._id ?? i}
                        className={`dropdown-item ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTemplate(null); // unselect
                          } else {
                            setSelectedTemplate(t); // select
                          }
                        }}
                      >
                        <span>{t.title ?? "Unnamed Template"}</span>
                        {isSelected && <span className="check">✓</span>}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div
              className="apply-btn-wrapper"
              style={{ display: "flex", gap: "8px" }}
            >
              {/* Apply Button */}
              {selectedTemplate && (
                <button
                  className="apply-btn"
                  onClick={() => handleApplyTemplate(selectedTemplate)}
                >
                  Apply Template
                </button>
              )}
            </div>
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
                  onChange={(e) => setSelectedGymId(e.target.value)}
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

                <button
                  className="select-workout-button"
                  onClick={openWorkoutPicker}
                >
                  Select Workout
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
                <div className="workout-actions-left-side">
                  <button
                    className="workout-submit-button"
                    onClick={saveTemplate}
                  >
                    Save as Template
                  </button>
                </div>
                <div className="workout-actions-right-side">
                  <button
                    className="workout-submit-button"
                    onClick={handleSubmit}
                  >
                    Save
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
        ) : (
          <button className="select-workout-button" onClick={openWorkoutPicker}>
            Select Workout
          </button>
        )}
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

      {templatePreview && (
        <div className="template-overlay">
          <div className="template-modal">
            <h2>{templatePreview.template.templateName}</h2>

            <div className="template-grid">
              <div className="cell template-grid-header">Exercise</div>
              <div className="cell template-grid-header">Reps</div>
              <div className="cell template-grid-header">Sets</div>
              <div className="cell template-grid-header">Weight</div>

              {templatePreview.exercises.map((ex, i) => (
                <React.Fragment key={ex._id || i}>
                  <div className="cell" title={personalExNames[ex.exercise_id]}>
                    {personalExNames[ex.exercise_id]}
                  </div>

                  <div className="cell">{ex.reps}</div>
                  <div className="cell">{ex.sets}</div>
                  <div className="cell">{ex.weight}</div>
                </React.Fragment>
              ))}
            </div>

            <button
              className="template-confirm-btn"
              onClick={handleConfirmTemplateApply}
            >
              Confirm
            </button>

            <button
              className="template-cancel-btn"
              onClick={() => setTemplatePreview(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showWorkoutPicker && (
        <div className="popup-overlay">
          <div className="popup workout-picker-popup">
            <h2>Select Workout</h2>

            {/* List of workouts for the selected date */}
            <div className="workout-list">
              <div className="favorite-filter-section">
                <button
                  className={`favorite-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  title="Show favorites only"
                >
                  {showFavoritesOnly ? '⭐ Favorites' : '☆ All'}
                </button>
              </div>

              {(!dailyWorkouts || (showFavoritesOnly ? dailyWorkouts.filter((w) => w.favorite) : dailyWorkouts).length === 0) && (
                <div className="no-workouts">
                  {showFavoritesOnly ? "No favorite workouts for this day." : "No workouts for this day."}
                </div>
              )}

              {dailyWorkouts &&
                (showFavoritesOnly ? dailyWorkouts.filter((w) => w.favorite) : dailyWorkouts).map((w) => (
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
                        handleToggleFavorite();
                        setDailyWorkouts(dailyWorkouts.map((wk) =>
                          wk._id === w._id ? { ...wk, favorite: !wk.favorite } : wk
                        ));
                      }}
                      title={w.favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      {w.favorite ? "⭐" : "☆"}
                    </button>
                  </div>
                ))}
            </div>

            {/* Create Workout Section */}
            <div className="create-workout-section">
              <input
                type="text"
                placeholder="New workout name"
                value={newWorkoutName}
                onChange={(e) => setNewWorkoutName(e.target.value)}
                onKeyDown={exitOnEnter}
              />
              <div style={{ marginTop: 8 }}>
                <label
                  style={{ display: "block", fontSize: 12, marginBottom: 6 }}
                >
                  Gym (optional)
                </label>
                <select
                  value={selectedGymId}
                  onChange={(e) => setSelectedGymId(e.target.value)}
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
              </div>
              <button
                className="create-workout-button"
                onClick={handleCreateWorkout}
              >
                Create Workout
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="popup-footer">
              <button
                className="load-workout-button"
                disabled={!selectedWorkoutIdForPicker}
                onClick={handleLoadWorkout}
              >
                Load Workout
              </button>

              <button
                className="cancel-button"
                onClick={() => setShowWorkoutPicker(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}