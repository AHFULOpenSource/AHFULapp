import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "../Calendar/Calendar.jsx";
import { WorkoutChart } from "../HistoryPRs/WorkoutChart.jsx";

export function WorkoutLandingView({
  selectedDate,
  dailyWorkouts = [],
  availableGyms = [],
  templates = [],
  onSelectWorkout,
  onCreateWorkout,
  onDeleteWorkout,
  onToggleFavorite,
  onStartFromTemplate,
}) {
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");
  const [selectedGymId, setSelectedGymId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      await onCreateWorkout({
        title: newTitle.trim(),
        gym_id: selectedGymId || "000000000000000000000000",
      });
      setNewTitle("");
      setSelectedGymId("");
    } finally {
      setIsCreating(false);
    }
  };

  const formatDuration = (w) => {
    if (!w.startTime || !w.endTime || w.endTime <= w.startTime) {
      return null;
    }
    const diffMins = Math.round((w.endTime - w.startTime) / 60);
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="workout-landing-container">
      {/* Page Title */}
      <div className="workout-landing-header">
        <h1>My Workouts</h1>
        <p className="workout-landing-subtitle">
          Select a date on your calendar to view or log daily workouts.
        </p>
      </div>

      <div className="workout-landing-columns">
        {/* Left Column: Calendar & Daily Workouts List */}
        <div className="workout-landing-col-main">
          {/* Calendar Widget */}
          <Calendar />

          {/* Quick Create Form */}
          <div className="workout-card quick-create-card">
            <h3>Add New Workout</h3>
            <form onSubmit={handleCreateSubmit} className="quick-create-form">
              <input
                type="text"
                id="new-workout-name-textbox"
                className="quick-create-input"
                placeholder="Enter workout name (e.g. Chest & Triceps)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />

              <div className="quick-create-row">
                <select
                  id="select-gym-dropdown"
                  className="quick-create-select"
                  value={selectedGymId}
                  onChange={(e) => setSelectedGymId(e.target.value)}
                >
                  <option value="">No Gym / Home</option>
                  {availableGyms.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name || g.address || "Gym"}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  id="create-new-workout-button"
                  className="quick-create-btn"
                  disabled={!newTitle.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create Workout"}
                </button>
              </div>
            </form>
          </div>

          {/* Workouts for Selected Date */}
          <div className="workout-card workouts-list-card">
            <div className="workouts-list-header">
              <h3>Workouts for {selectedDate}</h3>
              <span className="workout-count-badge">
                {dailyWorkouts.length} {dailyWorkouts.length === 1 ? "workout" : "workouts"}
              </span>
            </div>

            {dailyWorkouts.length === 0 ? (
              <div className="no-workouts-box">
                <p>No workouts recorded for this day.</p>
                <p className="no-workouts-sub">
                  Use the form above to start a workout, or select an existing template below.
                </p>
              </div>
            ) : (
              <div className="workouts-rows-list">
                {dailyWorkouts.map((w, idx) => {
                  const gym = availableGyms.find((g) => g._id === w.gym_id);
                  const duration = formatDuration(w);
                  return (
                    <div
                      key={w._id}
                      className="workout-row-item"
                      onClick={() => onSelectWorkout(w)}
                    >
                      <div className="workout-row-left">
                        <span className="workout-index-num">#{idx + 1}</span>
                        <div className="workout-row-info">
                          <h4 className="workout-row-title">{w.title || `Workout #${idx + 1}`}</h4>
                          <div className="workout-row-meta">
                            <span className="workout-gym-tag">
                              📍 {gym?.name || "No Gym"}
                            </span>
                            {duration && (
                              <span className="workout-duration-tag">
                                ⏱ {duration}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="workout-row-right" onClick={(e) => e.stopPropagation()}>
                        {/* Favorite toggle */}
                        <button
                          type="button"
                          className={`row-favorite-btn ${w.favorite ? "active" : ""}`}
                          onClick={() => onToggleFavorite(w._id)}
                          title={w.favorite ? "Favorited" : "Favorite"}
                        >
                          {w.favorite ? "★" : "☆"}
                        </button>

                        {/* Open / Edit Pencil */}
                        <button
                          type="button"
                          className="row-edit-btn"
                          onClick={() => onSelectWorkout(w)}
                          title="Open Workout"
                        >
                          ✏️ Log
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="row-delete-btn"
                          onClick={() => {
                            if (window.confirm(`Delete "${w.title}"?`)) {
                              onDeleteWorkout(w._id);
                            }
                          }}
                          title="Delete Workout"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Templates Quick-Launch & History Graph */}
        <div className="workout-landing-col-side">
          {/* Templates Quick Start */}
          <div className="workout-card templates-quick-card">
            <div className="templates-quick-header">
              <h3>Templates Quick Start</h3>
              <button
                type="button"
                className="templates-toggle-btn"
                onClick={() => navigate("/Templates")}
                title="Browse all workout templates"
              >
                Browse All ↗
              </button>
            </div>

            <div className="templates-chip-list">
              {templates.length === 0 ? (
                <p className="templates-empty-text">
                  No workout templates saved yet. You can save any active workout as a template!
                </p>
              ) : (
                templates.map((tpl) => (
                  <button
                    key={tpl._id}
                    type="button"
                    className="template-chip-item"
                    onClick={() => onStartFromTemplate(tpl)}
                  >
                    <span className="template-chip-title">{tpl.title || "Template"}</span>
                    <span className="template-chip-action">+ Start</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Graph of History */}
          <div className="workout-card graph-card-wrapper">
            <div className="graph-card-header">
              <h3>Workout History</h3>
              <span className="graph-card-desc">Weekly consistency</span>
            </div>
            <WorkoutChart defaultWeeks={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkoutLandingView;
