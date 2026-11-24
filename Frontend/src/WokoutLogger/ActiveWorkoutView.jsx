import React, { useState } from "react";
import { formatTime } from "../QueryFunctions.js";
import { HeatMap } from "./HeatMap.jsx";
import { ExerciseSetTable } from "./ExerciseSetTable.jsx";
import { AddExerciseDrawer } from "./AddExerciseDrawer.jsx";
import { ShareWorkoutModal } from "./ShareWorkoutModal.jsx";

export function ActiveWorkoutView({
  workout,
  workoutTitle,
  onChangeWorkoutTitle,
  selectedGymId,
  onChangeGymId,
  availableGyms = [],
  exercisesInProgress = [],
  personalExNames = {},
  cachedExerciseCatalog = [],
  onUpdateExerciseSetDetails,
  onRemoveExercise,
  onReorderExercise,
  onAddExercise,
  onToggleFavorite,
  onSaveAsTemplate,
  onBack,
  time = 0,
  isRunning = false,
  onToggleTimer,
  saveStatus = "idle",
  onFinishWorkout,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [expandedExerciseIds, setExpandedExerciseIds] = useState({});

  // Toggle accordion expand/collapse
  const toggleExerciseExpand = (exId) => {
    setExpandedExerciseIds((prev) => ({
      ...prev,
      [exId]: prev[exId] !== undefined ? !prev[exId] : false, // default was true
    }));
  };

  // Calculate overall workout stats
  const { totalVolume, totalCompletedSets, totalSets } = React.useMemo(() => {
    let volume = 0;
    let completed = 0;
    let setsCount = 0;

    exercisesInProgress.forEach((ex) => {
      if (Array.isArray(ex.setDetails) && ex.setDetails.length > 0) {
        ex.setDetails.forEach((s) => {
          setsCount += 1;
          if (s.completed) {
            completed += 1;
            const w = parseFloat(s.weight) || 0;
            const r = parseInt(s.reps, 10) || 10;
            volume += w * r;
          }
        });
      } else {
        const count = Number(ex.sets) || 1;
        setsCount += count;
        if (ex.complete) {
          completed += count;
          const w = parseFloat(ex.weight) || 0;
          const r = parseInt(ex.reps, 10) || 10;
          volume += w * r * count;
        }
      }
    });

    return { totalVolume: volume, totalCompletedSets: completed, totalSets: setsCount };
  }, [exercisesInProgress]);

  const saveStatusBadge = {
    idle: null,
    pending: <span className="autosave-badge pending">Saving pending…</span>,
    saving: <span className="autosave-badge saving">Saving…</span>,
    saved: <span className="autosave-badge saved">Saved ✓</span>,
    error: <span className="autosave-badge error">Save failed ✕</span>,
  }[saveStatus];

  return (
    <div className="active-workout-container">
      {/* Top Bar with Navigation & Actions */}
      <div className="active-workout-topbar">
        <div className="topbar-left">
          <button type="button" className="back-btn" onClick={onBack}>
            ← Back to Workouts
          </button>
          <div className="autosave-status-wrapper">{saveStatusBadge}</div>
        </div>

        <div className="topbar-right">
          {/* Workout Timer */}
          <div className="workout-timer-pill" onClick={onToggleTimer}>
            <span className="timer-icon">{isRunning ? "⏸" : "▶"}</span>
            <span className="timer-text">{formatTime(time)}</span>
          </div>

          {/* Favorite Toggle */}
          <button
            type="button"
            className={`topbar-action-btn favorite-btn ${workout?.favorite ? "active" : ""}`}
            onClick={onToggleFavorite}
            title={workout?.favorite ? "Favorited" : "Mark as Favorite"}
          >
            {workout?.favorite ? "★ Favorited" : "☆ Mark as Favorite"}
          </button>

          {/* Save as Template */}
          <button
            type="button"
            className="topbar-action-btn template-btn"
            onClick={onSaveAsTemplate}
            title="Save workout as a reusable template"
          >
            💾 Save as Template
          </button>

          {/* Share Workout */}
          <button
            type="button"
            className="topbar-action-btn share-btn"
            onClick={() => setIsShareModalOpen(true)}
            title="Share with a friend"
          >
            📤 Share this Workout
          </button>
        </div>
      </div>

      {/* Workout Card Info: Title & Gym Selector */}
      <div className="workout-card active-workout-info-card">
        <div className="active-workout-title-group">
          <input
            type="text"
            className="active-workout-title-input"
            value={workoutTitle}
            onChange={(e) => onChangeWorkoutTitle(e.target.value)}
            placeholder="Workout Title..."
          />
          <div className="active-workout-gym-row">
            <label className="gym-select-label">Gym:</label>
            <select
              className="gym-select-dropdown"
              value={selectedGymId}
              onChange={(e) => onChangeGymId(e.target.value)}
            >
              <option value="">No Gym / Home</option>
              {availableGyms.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name || g.address || "Gym"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Heat Map Section */}
      <div className="workout-card heatmap-card-wrapper">
        <div className="heatmap-card-header">
          <h3>Target Muscles Worked</h3>
          <span className="heatmap-hint">Keyed from your exercises</span>
        </div>
        <HeatMap data={{ workout: workout?._id }} />
      </div>

      {/* Exercises Section */}
      <div className="active-exercises-section">
        <div className="exercises-section-header">
          <h3>Exercises</h3>
          <button
            type="button"
            className="btn btn-primary add-exercise-trigger-btn"
            onClick={() => setIsDrawerOpen(true)}
          >
            + Add Exercise
          </button>
        </div>

        {exercisesInProgress.length === 0 ? (
          <div className="workout-card empty-exercises-card">
            <p>No exercises added to this workout yet.</p>
            <button
              type="button"
              className="btn btn-primary add-first-exercise-btn"
              onClick={() => setIsDrawerOpen(true)}
            >
              + Add Your First Exercise
            </button>
          </div>
        ) : (
          <div className="exercises-accordion-list">
            {exercisesInProgress.map((ex, idx) => {
              const exId = ex._id || ex.id || `ex-${ex.exercise_id}-${idx}`;
              const isExpanded = expandedExerciseIds[exId] !== false; // default open
              const exName = personalExNames[ex.exercise_id] || "Loading Exercise...";
              const exCatalogInfo = cachedExerciseCatalog?.find(
                (c) => c._id === ex.exercise_id
              );

              return (
                <ExerciseSetTable
                  key={exId}
                  exercise={ex}
                  exerciseName={exName}
                  exerciseInfo={exCatalogInfo}
                  onUpdateSetDetails={(newSets) => onUpdateExerciseSetDetails(exId, newSets)}
                  onRemoveExercise={() => onRemoveExercise(exId)}
                  onMoveUp={idx > 0 ? () => onReorderExercise(idx, idx - 1) : null}
                  onMoveDown={
                    idx < exercisesInProgress.length - 1
                      ? () => onReorderExercise(idx, idx + 1)
                      : null
                  }
                  isFirst={idx === 0}
                  isLast={idx === exercisesInProgress.length - 1}
                  isExpanded={isExpanded}
                  onToggleExpand={() => toggleExerciseExpand(exId)}
                />
              );
            })}
          </div>
        )}

        {/* Bottom Add Exercise Bar */}
        {exercisesInProgress.length > 0 && (
          <div className="bottom-add-exercise-bar">
            <button
              type="button"
              className="btn btn-secondary full-width-add-btn"
              onClick={() => setIsDrawerOpen(true)}
            >
              + Add Another Exercise
            </button>
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="workout-card workout-summary-card">
        <div className="summary-stats-grid">
          <div className="summary-stat-box">
            <span className="summary-stat-label">Exercises</span>
            <span className="summary-stat-value">{exercisesInProgress.length}</span>
          </div>

          <div className="summary-stat-box">
            <span className="summary-stat-label">Sets Completed</span>
            <span className="summary-stat-value">
              {totalCompletedSets} / {totalSets}
            </span>
          </div>

          <div className="summary-stat-box">
            <span className="summary-stat-label">Total Volume</span>
            <span className="summary-stat-value">
              {totalVolume.toLocaleString()} lbs
            </span>
          </div>
        </div>

        <div className="summary-finish-row">
          <button
            type="button"
            className="btn btn-success finish-workout-btn"
            onClick={onFinishWorkout}
          >
            ✓ Complete Workout
          </button>
        </div>
      </div>

      {/* Floating Add Exercise Button for Mobile */}
      <button
        type="button"
        className="mobile-fab-add-exercise"
        onClick={() => setIsDrawerOpen(true)}
        aria-label="Add Exercise"
      >
        +
      </button>

      {/* Slide-Up Exercise Drawer */}
      <AddExerciseDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectExercise={onAddExercise}
      />

      {/* Share Workout Modal */}
      {isShareModalOpen && (
        <ShareWorkoutModal
          workout={workout}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}

export default ActiveWorkoutView;
