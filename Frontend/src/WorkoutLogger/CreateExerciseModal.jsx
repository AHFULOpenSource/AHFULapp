import React, { useState, useEffect } from "react";
import {
  loadEquipment,
  loadBodyParts,
  loadTargetMuscles,
} from "./QueryFunctions-WorkoutLogger.js";
import { createExercise } from "../ExercisesCard/QueryFunctions-Exercises.js";
import { pullExercises } from "../ExercisesCard/PullExercise.jsx";

export function CreateExerciseModal({
  isOpen,
  onClose,
  onExerciseCreated,
  initialName = "",
}) {
  const [name, setName] = useState(initialName);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedBodyParts, setSelectedBodyParts] = useState([]);
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [instructions, setInstructions] = useState("");

  const [muscleOptions, setMuscleOptions] = useState([]);
  const [bodyPartOptions, setBodyPartOptions] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync initialName when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setErrorMessage(null);
    }
  }, [isOpen, initialName]);

  // Load option lists on open
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsLoadingOptions(true);

    Promise.all([loadEquipment(), loadBodyParts(), loadTargetMuscles()])
      .then(([eq, bp, ms]) => {
        if (!mounted) return;
        if (eq?.data && Array.isArray(eq.data)) setEquipmentOptions(eq.data);
        if (bp?.data && Array.isArray(bp.data)) setBodyPartOptions(bp.data);
        if (ms?.data && Array.isArray(ms.data)) setMuscleOptions(ms.data);
      })
      .catch((err) => {
        console.error("Failed to load exercise options:", err);
      })
      .finally(() => {
        if (mounted) setIsLoadingOptions(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle selection helper
  const toggleSelection = (list, setList, item) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter an exercise name.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      targetMuscles: selectedMuscles,
      bodyParts: selectedBodyParts,
      equipments: selectedEquipments,
      equipment: selectedEquipments[0] || "",
      instructions: instructions.trim(),
      gifUrl: "",
    };

    try {
      const result = await createExercise(payload);
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      // Refresh exercise catalog in Redux
      await pullExercises();

      const newExerciseId = result.data?.exercise_id || result.data?._id;
      const createdObj = {
        _id: newExerciseId,
        ...payload,
      };

      if (typeof onExerciseCreated === "function") {
        onExerciseCreated(createdObj);
      }

      // Reset and close
      setName("");
      setSelectedMuscles([]);
      setSelectedBodyParts([]);
      setSelectedEquipments([]);
      setInstructions("");
      onClose();
    } catch (err) {
      console.error("Error creating exercise:", err);
      setErrorMessage(err.message || "Failed to create exercise.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="create-exercise-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Create New Exercise</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-exercise-form">
          {errorMessage && (
            <div className="create-exercise-error-banner">{errorMessage}</div>
          )}

          {/* Exercise Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="new-exercise-name-input">
              Exercise Name <span className="required-star">*</span>
            </label>
            <input
              id="new-exercise-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Incline Dumbbell Bench Press"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Target Muscles */}
          <div className="form-group">
            <label className="form-label">
              Target Muscles
              {selectedMuscles.length > 0 && (
                <span className="selection-count"> ({selectedMuscles.length} selected)</span>
              )}
            </label>
            <div className="chips-selection-box">
              {muscleOptions.length === 0 && isLoadingOptions ? (
                <span className="loading-hint">Loading muscles…</span>
              ) : (
                muscleOptions.map((opt) => {
                  const val = opt.label || opt.value;
                  const isSelected = selectedMuscles.includes(val);
                  return (
                    <button
                      key={opt.value || opt.label}
                      type="button"
                      className={`select-chip-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSelection(selectedMuscles, setSelectedMuscles, val)}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {val}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Body Parts */}
          <div className="form-group">
            <label className="form-label">
              Body Parts
              {selectedBodyParts.length > 0 && (
                <span className="selection-count"> ({selectedBodyParts.length} selected)</span>
              )}
            </label>
            <div className="chips-selection-box">
              {bodyPartOptions.length === 0 && isLoadingOptions ? (
                <span className="loading-hint">Loading body parts…</span>
              ) : (
                bodyPartOptions.map((opt) => {
                  const val = opt.label || opt.value;
                  const isSelected = selectedBodyParts.includes(val);
                  return (
                    <button
                      key={opt.value || opt.label}
                      type="button"
                      className={`select-chip-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSelection(selectedBodyParts, setSelectedBodyParts, val)}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {val}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Equipment */}
          <div className="form-group">
            <label className="form-label">
              Equipment
              {selectedEquipments.length > 0 && (
                <span className="selection-count"> ({selectedEquipments.length} selected)</span>
              )}
            </label>
            <div className="chips-selection-box">
              {equipmentOptions.length === 0 && isLoadingOptions ? (
                <span className="loading-hint">Loading equipment…</span>
              ) : (
                equipmentOptions.map((opt) => {
                  const val = opt.label || opt.value;
                  const isSelected = selectedEquipments.includes(val);
                  return (
                    <button
                      key={opt.value || opt.label}
                      type="button"
                      className={`select-chip-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSelection(selectedEquipments, setSelectedEquipments, val)}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {val}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="form-group">
            <label className="form-label" htmlFor="new-exercise-instructions">
              Instructions (Optional)
            </label>
            <textarea
              id="new-exercise-instructions"
              className="form-textarea"
              rows={3}
              placeholder="Add cues, form notes, or setup steps..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary create-exercise-submit-btn"
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? "Saving..." : "Save & Add Exercise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateExerciseModal;
