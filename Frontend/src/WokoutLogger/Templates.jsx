import { useEffect, useState } from "react";
import { useSelector } from "react-redux";


export function Templates() {

    // ─── Template States
    const [templateSearch, setTemplateSearch] = useState("");
  const [templateModal, setTemplateModal] = useState(null);
  const [exerciseNames, setExerciseNames] = useState({});

    //Redux Cache for Templates.
    const templates = useSelector((state) => state.pullTemplate.templates);
    const cachedPersonalExercises = useSelector((state) => state.pullPersonalExercise.personalExercises);
    
    const exitOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.target.blur();
        }
    };

  async function handleApplyTemplate(template) {
    try {
      // Get template exercises from cache (personal exercises with template's workout_id)
      const templateExercises = cachedPersonalExercises?.filter((pe) => pe?.workout_id === template._id) || [];

      // TODO: hook this into the apply flow if needed
      setTemplateModal({
        ...template,
        exercises: template.exercises || templateExercises,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load template exercises.");
    }
  }

  const formatTemplateDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const raw = dateValue?.$date ?? dateValue;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return String(raw);
    return parsed.toLocaleString();
  };

  useEffect(() => {
    if (!templateModal?.exercises?.length) return;

    const missingIds = templateModal.exercises
      .map((exercise) => exercise?.exercise_id)
      .filter((id) => id && !exerciseNames[id]);

    if (missingIds.length === 0) return;

    const loadNames = async () => {
      const results = {};
      for (const id of missingIds) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/AHFULexercises/id/${id}`,
            { credentials: "include" }
          );
          if (!response.ok) {
            results[id] = "Unknown Exercise";
            continue;
          }
          const data = await response.json();
          results[id] = data?.name || "Unknown Exercise";
        } catch (err) {
          console.error("Error fetching exercise name for", id, err);
          results[id] = "Unknown Exercise";
        }
      }

      setExerciseNames((prev) => ({ ...prev, ...results }));
    };

    loadNames();
  }, [templateModal, exerciseNames]);

    return (
    /* Left Column: Template/History */
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
        </div>


        <div className="dropdown-instructions">
          Select a template to apply
        </div>

        {/* Template List */}
          {templates.length === 0 && (
            <div className="dropdown-item">No templates found</div>
          )}

          {templates
              .filter((t) => {
                const title = t?.title ?? "";

                return title
                  .toLowerCase()
                  .includes(templateSearch.toLowerCase());
              })
              .map((t, i) => (
                <div
                  key={t._id ?? i}
                  className="dropdown-item"
                  onClick={() => {
                    handleApplyTemplate(t);
                  }}
                >
                  <span>Template Name: {t.title ?? "Unnamed Template"}</span>
                  <br />
                  <span>Created: {t.created_at ?? "Unknown Date"}</span>
                  <br />
                  <span>Notes: {t.notes ?? "No Notes"}</span>
                </div>
              ))}
        {templateModal && (
          <div className="workout-modal-overlay" onClick={() => setTemplateModal(null)}>
            <div className="workout-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="workout-modal-header">
                <h2>{templateModal.title || "Untitled Template"}</h2>
                <button
                  className="workout-modal-close"
                  onClick={() => setTemplateModal(null)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="workout-modal-body">
                <div className="workout-detail-section">
                  <label className="workout-detail-label">Template Name</label>
                  <p className="workout-detail-value">{templateModal.title || "N/A"}</p>
                </div>

                <div className="workout-detail-section">
                  <label className="workout-detail-label">Created</label>
                  <p className="workout-detail-value">
                    {formatTemplateDate(templateModal.created_at)}
                  </p>
                </div>

                <div className="workout-detail-section">
                  <label className="workout-detail-label">Notes</label>
                  <p className="workout-detail-value">{templateModal.notes || "No Notes"}</p>
                </div>

                <div className="workout-detail-section">
                  <label className="workout-detail-label">Exercises</label>
                  {templateModal.exercises?.length ? (
                    <div className="workout-exercises-list">
                      {templateModal.exercises.map((exercise, idx) => (
                        <div key={exercise.exercise_id || idx} className="workout-exercise-item">
                          <div className="exercise-item-header">
                            <span className="exercise-item-number">
                              {exerciseNames[exercise.exercise_id] || "Unknown Exercise"}
                            </span>
                          </div>
                          {exercise.weight != null && Number(exercise.weight) > 0 && (
                            <div className="exercise-item-detail">
                              <span className="exercise-detail-label">Weight:</span>{" "}
                              <span>{exercise.weight} lbs</span>
                            </div>
                          )}
                          {exercise.sets != null && Number(exercise.sets) > 0 && (
                            <div className="exercise-item-detail">
                              <span className="exercise-detail-label">Sets:</span>{" "}
                              <span>{exercise.sets}</span>
                            </div>
                          )}
                          {exercise.reps != null && Number(exercise.reps) > 0 && (
                            <div className="exercise-item-detail">
                              <span className="exercise-detail-label">Reps:</span>{" "}
                              <span>{exercise.reps}</span>
                            </div>
                          )}
                          {exercise.duration != null && Number(exercise.duration) > 0 && (
                            <div className="exercise-item-detail">
                              <span className="exercise-detail-label">Duration:</span>{" "}
                              <span>{exercise.duration}s</span>
                            </div>
                          )}
                          {exercise.distance != null && Number(exercise.distance) > 0 && (
                            <div className="exercise-item-detail">
                              <span className="exercise-detail-label">Distance:</span>{" "}
                              <span>{exercise.distance}m</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="workout-exercises-empty">No exercises recorded for this template</p>
                  )}
                </div>
              </div>

              <div className="workout-modal-actions">
                <button
                  className="workout-modal-btn"
                  onClick={() => handleApplyTemplate(templateModal)}
                >
                  Apply Template
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
    );
}