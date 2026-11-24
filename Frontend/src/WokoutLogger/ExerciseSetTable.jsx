import React from "react";

const SET_TYPE_OPTIONS = [
  { value: "N", label: "Normal" },
  { value: "W", label: "Warmup (W)" },
  { value: "D", label: "Drop Set (D)" },
  { value: "F", label: "Failure (F)" },
];

export function ExerciseSetTable({
  exercise,
  exerciseName = "Exercise",
  exerciseInfo = null,
  onUpdateSetDetails,
  onRemoveExercise,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  isExpanded = true,
  onToggleExpand,
}) {
  // Normalize setDetails or construct from legacy personal exercise fields
  const sets = React.useMemo(() => {
    if (Array.isArray(exercise?.setDetails) && exercise.setDetails.length > 0) {
      return exercise.setDetails.map((s) => ({
        ...s,
        isDefaultReps: s.isDefaultReps !== undefined ? s.isDefaultReps : (!s.reps || s.reps === 10),
      }));
    }
    // Legacy fallback: generate sets from exercise.sets / reps / weight
    const count = Math.max(1, Number(exercise?.sets) || 1);
    return Array.from({ length: count }, (_, idx) => {
      const hasSpecificReps = exercise?.reps !== undefined && exercise?.reps !== null && exercise?.reps !== 10;
      return {
        id: `set-${idx + 1}`,
        setNum: idx + 1,
        setType: idx === 0 && count > 1 ? "W" : "N",
        weight: exercise?.weight !== undefined && exercise?.weight !== null ? exercise.weight : "",
        reps: hasSpecificReps ? exercise.reps : "",
        isDefaultReps: !hasSpecificReps,
        completed: Boolean(exercise?.complete),
        prev: "-",
      };
    });
  }, [exercise?.setDetails, exercise?.sets, exercise?.reps, exercise?.weight, exercise?.complete]);

  // Compute sequential working set numbers deterministically
  const computedSets = React.useMemo(() => {
    let workingCounter = 0;
    return sets.map((s, idx) => {
      // Normalize legacy setType (e.g., if it was stored as "1", "2" or numeric string, map to "N")
      let normalizedType = s.setType || "N";
      if (normalizedType !== "W" && normalizedType !== "D" && normalizedType !== "F") {
        normalizedType = "N";
      }

      let displayBadge = "";
      if (normalizedType === "W") {
        displayBadge = "W";
      } else if (normalizedType === "D") {
        displayBadge = "D";
      } else if (normalizedType === "F") {
        displayBadge = "F";
      } else {
        workingCounter += 1;
        displayBadge = String(workingCounter);
      }

      return {
        ...s,
        setType: normalizedType,
        calculatedIndex: idx,
        displayBadge,
      };
    });
  }, [sets]);

  const handleSetChange = (index, field, value) => {
    const updated = sets.map((s, i) => {
      if (i !== index) return s;
      return { ...s, [field]: value };
    });
    onUpdateSetDetails(updated);
  };

  const handleRepsChange = (index, value) => {
    const updated = sets.map((s, i) => {
      if (i !== index) return s;
      return { ...s, reps: value, isDefaultReps: false };
    });
    onUpdateSetDetails(updated);
  };

  const handleRepsFocus = (e, index) => {
    const s = sets[index];
    if (s?.isDefaultReps) {
      // Clear the default placeholder value so the user can type immediately
      const updated = sets.map((item, i) =>
        i === index ? { ...item, reps: "", isDefaultReps: false } : item
      );
      onUpdateSetDetails(updated);
    } else {
      // User has already typed a value: do NOT remove it! Just select it
      e.target.select();
    }
  };

  const handleToggleComplete = (index) => {
    const updated = sets.map((s, i) => {
      if (i !== index) return s;
      const nextComplete = !s.completed;
      const reps = nextComplete && (s.reps === "" || s.reps === undefined || s.reps === null) ? 10 : s.reps;
      return { ...s, completed: nextComplete, reps };
    });
    onUpdateSetDetails(updated);
  };

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const newIdx = sets.length + 1;
    const newSet = {
      id: `set-${newIdx}-${Date.now()}`,
      setNum: newIdx,
      setType: "N",
      weight: lastSet ? lastSet.weight : "",
      reps: "",
      isDefaultReps: true,
      completed: false,
      prev: lastSet?.weight && (lastSet?.reps || lastSet?.reps === 0) ? `${lastSet.weight} x ${lastSet.reps || 10}` : "-",
    };
    onUpdateSetDetails([...sets, newSet]);
  };

  const handleRemoveSet = (index) => {
    if (sets.length <= 1) {
      // Keep at least one set
      return;
    }
    const updated = sets.filter((_, i) => i !== index);
    onUpdateSetDetails(updated);
  };

  const handleMoveSetUp = (index) => {
    if (index <= 0) return;
    const updated = [...sets];
    const [moved] = updated.splice(index, 1);
    updated.splice(index - 1, 0, moved);
    onUpdateSetDetails(updated);
  };

  const handleMoveSetDown = (index) => {
    if (index >= sets.length - 1) return;
    const updated = [...sets];
    const [moved] = updated.splice(index, 1);
    updated.splice(index + 1, 0, moved);
    onUpdateSetDetails(updated);
  };

  // Calculate volume for this exercise
  const totalVolume = sets.reduce((sum, s) => {
    if (!s.completed) return sum;
    const w = parseFloat(s.weight) || 0;
    const r = parseInt(s.reps, 10) || 10;
    return sum + w * r;
  }, 0);

  const completedSetsCount = sets.filter((s) => s.completed).length;

  return (
    <div className={`exercise-card ${isExpanded ? "expanded" : "collapsed"}`}>
      {/* Exercise Card Header */}
      <div className="exercise-card-header" onClick={onToggleExpand}>
        <div className="exercise-card-title-group">
          <span className="exercise-expand-indicator">{isExpanded ? "▾" : "▸"}</span>
          <h4 className="exercise-card-title">{exerciseName}</h4>
          {exerciseInfo?.targetMuscles && (
            <span className="exercise-muscle-tag">
              {Array.isArray(exerciseInfo.targetMuscles)
                ? exerciseInfo.targetMuscles.slice(0, 2).join(", ")
                : exerciseInfo.targetMuscles}
            </span>
          )}
          {exerciseInfo?.equipment && (
            <span className="exercise-equipment-tag">{exerciseInfo.equipment}</span>
          )}
        </div>

        <div className="exercise-card-actions" onClick={(e) => e.stopPropagation()}>
          {onMoveUp && (
            <button
              type="button"
              className="exercise-reorder-btn"
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move Up"
            >
              ▲
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              className="exercise-reorder-btn"
              onClick={onMoveDown}
              disabled={isLast}
              title="Move Down"
            >
              ▼
            </button>
          )}
          <button
            type="button"
            className="exercise-delete-btn"
            onClick={onRemoveExercise}
            title="Remove Exercise"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Accordion Body */}
      {isExpanded && (
        <div className="exercise-card-body">
          <div className="set-table-wrapper">
            <table className="set-table">
              <thead>
                <tr>
                  <th className="th-set">Set</th>
                  <th className="th-prev">Previous</th>
                  <th className="th-weight">Weight (lbs)</th>
                  <th className="th-reps">Reps</th>
                  <th className="th-done">Done</th>
                  <th className="th-actions"></th>
                </tr>
              </thead>
              <tbody>
                {computedSets.map((set, idx) => {
                  const isDone = Boolean(set.completed);
                  return (
                    <tr
                      key={set.id || `set-row-${idx}`}
                      className={`set-row ${isDone ? "set-row-completed" : ""}`}
                    >
                      <td className="td-set">
                        <div className="set-badge-container">
                          <div className={`set-number-badge set-type-${set.setType || "N"}`}>
                            {set.displayBadge}
                          </div>
                          <select
                            className="set-type-select set-type-select-hidden"
                            value={set.setType}
                            onChange={(e) => handleSetChange(idx, "setType", e.target.value)}
                            disabled={isDone}
                            aria-label={`Set ${set.displayBadge} type`}
                            title={`Set ${set.displayBadge} - Tap to change type`}
                          >
                            <option value="N">Set {set.displayBadge} (Normal)</option>
                            <option value="W">Warmup (W)</option>
                            <option value="D">Drop Set (D)</option>
                            <option value="F">Failure (F)</option>
                          </select>
                        </div>
                      </td>

                      <td className="td-prev">
                        <span className="prev-val">{set.prev || "-"}</span>
                      </td>

                      <td className="td-weight">
                        <div className="weight-input-group">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="set-input weight-input"
                            value={set.weight !== undefined ? set.weight : ""}
                            onChange={(e) => handleSetChange(idx, "weight", e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            disabled={isDone}
                          />
                          <button
                            type="button"
                            className={`bw-toggle-btn ${set.weight === "body" ? "active" : ""}`}
                            onClick={() => handleSetChange(idx, "weight", set.weight === "body" ? "" : "body")}
                            disabled={isDone}
                            title="Toggle Bodyweight"
                          >
                            BW
                          </button>
                        </div>
                      </td>

                      <td className="td-reps">
                        <input
                          type="number"
                          inputMode="numeric"
                          className="set-input reps-input"
                          value={set.reps !== undefined && set.reps !== null ? set.reps : ""}
                          onChange={(e) => handleRepsChange(idx, e.target.value)}
                          onFocus={(e) => handleRepsFocus(e, idx)}
                          placeholder="10"
                          min="0"
                          disabled={isDone}
                        />
                      </td>

                      <td className="td-done">
                        <button
                          type="button"
                          className={`set-done-btn ${isDone ? "done" : ""}`}
                          onClick={() => handleToggleComplete(idx)}
                          aria-label={isDone ? "Unlock Set" : "Complete Set"}
                        >
                          {isDone ? "✓" : ""}
                        </button>
                      </td>

                      <td className="td-actions">
                        <div className="set-row-actions">
                          <button
                            type="button"
                            className="set-arrow-btn"
                            onClick={() => handleMoveSetUp(idx)}
                            disabled={idx === 0 || isDone}
                            title="Move set up"
                            aria-label="Move set up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="set-arrow-btn"
                            onClick={() => handleMoveSetDown(idx)}
                            disabled={idx === sets.length - 1 || isDone}
                            title="Move set down"
                            aria-label="Move set down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            className="set-remove-btn"
                            onClick={() => handleRemoveSet(idx)}
                            disabled={sets.length <= 1 || isDone}
                            title="Delete set"
                            aria-label="Delete set"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Set Row & Exercise Footer Stats */}
          <div className="exercise-table-footer">
            <button
              type="button"
              className="add-set-btn"
              onClick={handleAddSet}
            >
              + Add Set
            </button>

            <div className="exercise-stats">
              <span>
                Sets: <strong>{completedSetsCount}/{sets.length}</strong>
              </span>
              {totalVolume > 0 && (
                <span>
                  • Volume: <strong>{totalVolume.toLocaleString()} lbs</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseSetTable;
