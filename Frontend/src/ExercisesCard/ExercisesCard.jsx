import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { createExercise, getDefaultNewExercise } from "./QueryFunctionsExercises.js";
import { pullExercises } from "./PullExercise.jsx";
import {
  loadBodyParts,
  loadEquipment,
  loadTargetMuscles,
} from "../WokoutLogger/QueryFunctionsWorkoutLogger.js";

export function ExercisesCard({ AddSelectedExercises = () => {} }) {
  const cachedExercises = useSelector((state) => state.pullExercise?.exercises);

  const [exerciseName, setExerciseName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showNewExerciseModal, setShowNewExerciseModal] = useState(false);

  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [equipmentError, setEquipmentError] = useState(null);
  const [bodyPartOptions, setBodyPartOptions] = useState([]);
  const [bodyPartError, setBodyPartError] = useState(null);
  const [muscleOptions, setMuscleOptions] = useState([]);
  const [muscleError, setMuscleError] = useState(null);
  const [newExercise, setNewExercise] = useState(getDefaultNewExercise());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await loadEquipment();
      if (!mounted) return;
      if (res?.data) setEquipmentOptions(res.data);
      if (res?.error) setEquipmentError(res.error);
    })();

    (async () => {
      const res = await loadBodyParts();
      if (!mounted) return;
      if (res?.data) setBodyPartOptions(res.data);
      if (res?.error) setBodyPartError(res.error);
    })();

    (async () => {
      const res = await loadTargetMuscles();
      if (!mounted) return;
      if (res?.data) setMuscleOptions(res.data);
      if (res?.error) setMuscleError(res.error);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const resetNewExercise = () => setNewExercise(getDefaultNewExercise());

  const openNewExerciseModal = () => {
    resetNewExercise();
    setShowNewExerciseModal(true);
  };

  const closeNewExerciseModal = () => {
    setShowNewExerciseModal(false);
  };

  const exitOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };

  const handleMultiSelectChange = (e, field) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    setNewExercise((prev) => ({ ...prev, [field]: values }));
  };

  const handleSearch = () => {
    setSearchTerm(exerciseName.trim());
  };

  const filteredExercises = (Array.isArray(cachedExercises) ? cachedExercises : []).filter(
    (exercise) => {
      if (!exercise) return false;
      if (!searchTerm) return true;
      const name = exercise.name || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    },
  );

  const isSelected = (exerciseId) =>
    selectedExercises.some((exercise) => exercise?._id === exerciseId);

  const toggleExerciseSelection = (exercise) => {
    if (!exercise?._id) return;

    setSelectedExercises((prev) => {
      if (prev.some((item) => item._id === exercise._id)) {
        return prev.filter((item) => item._id !== exercise._id);
      }
      return [...prev, exercise];
    });
  };

  const handleAddSelectedExercises = async () => {
    if (selectedExercises.length === 0) return;

    await Promise.resolve(AddSelectedExercises([...selectedExercises]));
    setSelectedExercises([]);
    setExerciseName("");
    setSearchTerm("");
  };

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

      await pullExercises();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      closeNewExerciseModal();
      resetNewExercise();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="right-column">
      <div className="add-exercise">
        <div className="add-exercise-form">
          <div className="dropdown-wrapper">
            <div className="search-row">
              <input
                type="text"
                placeholder="Search exercises..."
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                    exitOnEnter(e);
                  }
                }}
              />

              <button
                type="button"
                className="search-btn"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>

            <div className="dropdown-instructions">
              Click an exercise to select it
            </div>

            <div className="dropdown">
              {filteredExercises.length === 0 && (
                <div className="dropdown-item">No exercises found</div>
              )}
              {filteredExercises.map((exercise, index) => {
                const selected = isSelected(exercise._id);

                return (
                  <div
                    key={exercise._id || `${exercise.name}-${index}`}
                    className={`dropdown-item ${selected ? "selected" : ""}`}
                    onClick={() => toggleExerciseSelection(exercise)}
                  >
                    <span>{exercise.name || "Unnamed Exercise"}</span>
                    {selected && <span className="check">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pending-list">
            {selectedExercises.map((exercise) => (
              <div key={exercise._id} className="pending-item">
                <span>{exercise.name || "Unnamed Exercise"}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() =>
                    setSelectedExercises((prev) =>
                      prev.filter((item) => item._id !== exercise._id),
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="add-btn-wrapper" style={{ display: "flex", gap: "8px" }}>
            <button
              className="workout-add-selected-button add-btn"
              id="add-exercises-btn"
              type="button"
              onClick={handleAddSelectedExercises}
              disabled={selectedExercises.length === 0}
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

      {showNewExerciseModal && (
        <div className="modal-overlay" onClick={closeNewExerciseModal}>
          <form
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleNewExerciseSave}
          >
            <h3>Add New Exercise</h3>

            <label style={{ display: "block", marginTop: 8 }}>Name</label>
            <input
              type="text"
              value={newExercise.name}
              onChange={(event) =>
                setNewExercise((prev) => ({ ...prev, name: event.target.value }))
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
              onChange={(event) =>
                setNewExercise((prev) => ({ ...prev, gifUrl: event.target.value }))
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
                  onError={(event) => {
                    event.target.style.display = "none";
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
              onChange={(event) => handleMultiSelectChange(event, "targetMuscles")}
              style={{ width: "100%" }}
            >
              {(muscleOptions || []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label style={{ display: "block", marginTop: 8 }}>Body Parts</label>
            {bodyPartError && (
              <div style={{ color: "red", marginBottom: 6 }}>
                {bodyPartError}
              </div>
            )}
            <select
              multiple
              value={newExercise.bodyParts}
              onChange={(event) => handleMultiSelectChange(event, "bodyParts")}
              style={{ width: "100%" }}
            >
              {(bodyPartOptions || []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
              value={newExercise.equipments}
              onChange={(event) => handleMultiSelectChange(event, "equipments")}
              style={{ width: "100%" }}
            >
              {(equipmentOptions || []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label style={{ display: "block", marginTop: 8 }}>
              Instructions
            </label>
            <textarea
              value={newExercise.instructions}
              onChange={(event) =>
                setNewExercise((prev) => ({ ...prev, instructions: event.target.value }))
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
