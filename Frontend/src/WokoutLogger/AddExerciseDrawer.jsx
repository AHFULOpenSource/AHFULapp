import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  loadBodyParts,
  loadEquipment,
  loadTargetMuscles,
} from "./QueryFunctions-WorkoutLogger.js";
import { pullExercises } from "../ExercisesCard/PullExercise.jsx";
import { CreateExerciseModal } from "./CreateExerciseModal.jsx";

export function AddExerciseDrawer({ isOpen, onClose, onSelectExercise }) {
  const dispatch = useDispatch();
  const cachedExercises = useSelector((state) => state.pullExercise?.exercises || []);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "muscle" | "equipment"
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [muscleOptions, setMuscleOptions] = useState([]);

  // Fetch filter options and exercises if missing
  useEffect(() => {
    if (cachedExercises.length === 0) {
      pullExercises().catch((err) => console.error("Failed to load exercises:", err));
    }

    let mounted = true;
    (async () => {
      const eq = await loadEquipment();
      if (mounted && eq?.data && Array.isArray(eq.data)) setEquipmentOptions(eq.data);

      const ms = await loadTargetMuscles();
      if (mounted && ms?.data && Array.isArray(ms.data)) setMuscleOptions(ms.data);
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch, cachedExercises.length]);

  // Filter exercises based on search and active tab
  const filteredExercises = useMemo(() => {
    let list = cachedExercises || [];

    if (activeTab === "muscle" && selectedMuscle) {
      list = list.filter((e) => {
        const muscles = Array.isArray(e.targetMuscles)
          ? e.targetMuscles
          : [e.targetMuscles].filter(Boolean);
        return muscles.some((m) =>
          String(m).toLowerCase().includes(selectedMuscle.toLowerCase())
        );
      });
    } else if (activeTab === "equipment" && selectedEquipment) {
      list = list.filter((e) => {
        const eqList = Array.isArray(e.equipments)
          ? e.equipments
          : Array.isArray(e.equipment)
            ? e.equipment
            : [e.equipment || e.equipments].filter(Boolean);
        return eqList.some((eq) =>
          String(eq).toLowerCase().includes(selectedEquipment.toLowerCase())
        );
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((e) => {
        const matchName = e.name && e.name.toLowerCase().includes(q);
        const matchMuscles =
          e.targetMuscles &&
          (Array.isArray(e.targetMuscles)
            ? e.targetMuscles.some((m) => String(m).toLowerCase().includes(q))
            : String(e.targetMuscles).toLowerCase().includes(q));
        const eqList = Array.isArray(e.equipments)
          ? e.equipments
          : Array.isArray(e.equipment)
            ? e.equipment
            : [e.equipment || e.equipments].filter(Boolean);
        const matchEquipment = eqList.some((eq) =>
          String(eq).toLowerCase().includes(q)
        );
        return matchName || matchMuscles || matchEquipment;
      });
    }

    return list;
  }, [cachedExercises, activeTab, selectedMuscle, selectedEquipment, searchTerm]);

  const handleExerciseCreated = (newExercise) => {
    setShowCreateModal(false);
    if (typeof onSelectExercise === "function") {
      onSelectExercise(newExercise);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}>
        <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
          {/* Drawer Header */}
          <div className="drawer-header">
            <div className="drawer-handle" />
            <div className="drawer-title-row">
              <h3>Add Exercises</h3>
              <div className="drawer-header-actions">
                <button
                  type="button"
                  className="drawer-create-btn"
                  onClick={() => setShowCreateModal(true)}
                  title="Create and save a new custom exercise"
                >
                  + New Exercise
                </button>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={onClose}
                  aria-label="Close drawer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="drawer-search-wrapper">
              <input
                type="text"
                className="drawer-search-input"
                placeholder="Search exercise by name, muscle, or equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  className="drawer-search-clear"
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mode Tabs: All, By Muscle Group, By Equipment */}
            <div className="drawer-tabs">
              <button
                type="button"
                className={`drawer-tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("all");
                  setSelectedMuscle("");
                  setSelectedEquipment("");
                }}
              >
                All Exercises
              </button>

              <button
                type="button"
                className={`drawer-tab-btn ${activeTab === "muscle" ? "active" : ""}`}
                onClick={() => setActiveTab("muscle")}
              >
                By Muscle Group
              </button>

              <button
                type="button"
                className={`drawer-tab-btn ${activeTab === "equipment" ? "active" : ""}`}
                onClick={() => setActiveTab("equipment")}
              >
                By Equipment
              </button>
            </div>

            {/* Secondary Filter Chips */}
            {activeTab === "muscle" && (
              <div className="drawer-chips-scroll">
                <button
                  type="button"
                  className={`drawer-chip ${selectedMuscle === "" ? "active" : ""}`}
                  onClick={() => setSelectedMuscle("")}
                >
                  All Muscles
                </button>
                {muscleOptions.map((opt) => (
                  <button
                    key={opt.value || opt.label}
                    type="button"
                    className={`drawer-chip ${selectedMuscle === opt.label ? "active" : ""}`}
                    onClick={() => setSelectedMuscle(opt.label)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "equipment" && (
              <div className="drawer-chips-scroll">
                <button
                  type="button"
                  className={`drawer-chip ${selectedEquipment === "" ? "active" : ""}`}
                  onClick={() => setSelectedEquipment("")}
                >
                  All Equipment
                </button>
                {equipmentOptions.map((opt) => (
                  <button
                    key={opt.value || opt.label}
                    type="button"
                    className={`drawer-chip ${selectedEquipment === opt.label ? "active" : ""}`}
                    onClick={() => setSelectedEquipment(opt.label)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exercises Scroll List */}
          <div className="drawer-exercise-list">
            {filteredExercises.length === 0 ? (
              <div className="drawer-empty">
                <p>No exercises found matching your filter.</p>
                <button
                  type="button"
                  className="drawer-empty-create-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  + Create "{searchTerm || "New Exercise"}"
                </button>
              </div>
            ) : (
              filteredExercises.map((ex) => {
                const equipmentDisplay = Array.isArray(ex.equipments)
                  ? ex.equipments.join(", ")
                  : ex.equipment || (ex.equipments ? String(ex.equipments) : null);

                return (
                  <div
                    key={ex._id || ex.id}
                    className="drawer-exercise-row"
                    onClick={() => {
                      onSelectExercise(ex);
                      onClose();
                    }}
                  >
                    <div className="drawer-exercise-info">
                      <span className="drawer-exercise-name">{ex.name}</span>
                      <div className="drawer-exercise-tags">
                        {ex.targetMuscles && (
                          <span className="drawer-tag muscle">
                            {Array.isArray(ex.targetMuscles)
                              ? ex.targetMuscles.join(", ")
                              : ex.targetMuscles}
                          </span>
                        )}
                        {equipmentDisplay && (
                          <span className="drawer-tag equipment">{equipmentDisplay}</span>
                        )}
                      </div>
                    </div>
                    <button type="button" className="drawer-add-action-btn">
                      + Add
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create Custom Exercise Modal */}
      {showCreateModal && (
        <CreateExerciseModal
          isOpen={showCreateModal}
          initialName={searchTerm}
          onClose={() => setShowCreateModal(false)}
          onExerciseCreated={handleExerciseCreated}
        />
      )}
    </>
  );
}

export default AddExerciseDrawer;
