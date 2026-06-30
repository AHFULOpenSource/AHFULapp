import "./Calendar.css";
import { useState, useEffect, useRef } from "react";
import { Calendar } from "../Calendar/Calendar.jsx";
import { useSelector } from "react-redux";
import { fetchPersonalExercises, fetchGym } from "../QueryFunctions";
import { DashboardWorkoutTodoItem } from "../ExploreWorkouts/DashboardWorkoutTodoItem";
import { DashboardFoodTodoItem } from "../Food/DashboardFoodTodoItem";

export function CalendarButton({ trigger = undefined, setTrigger = undefined, todoPosition = { top5Rows: "61%", top6Rows: "69.5%" } }) {
    const [open, setOpen] = useState(Boolean(trigger));
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [personalExercises, setPersonalExercises] = useState([]);
    const [personalExercisesLoading, setPersonalExercisesLoading] = useState(false);
    const [exerciseNames, setExerciseNames] = useState({});
    const [gymInfo, setGymInfo] = useState(null);
    const [gymLoading, setGymLoading] = useState(false);
    const [dayWorkouts, setDayWorkouts] = useState([]);
    const [dayFoods, setDayFoods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [calendarRows, setCalendarRows] = useState(5);
    const wrapperRef = useRef(null);

    const todoTop = calendarRows === 6 ? todoPosition.top6Rows : todoPosition.top5Rows;

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                toggle();
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const selectedDate = useSelector((state) => state.calendar.selectedDate);
    const workouts = useSelector((state) => state.pullWorkout.workouts);
    const foods = useSelector((state) => state.pullUserFood.food);

    useEffect(() => {
        if (typeof trigger !== "undefined") {
            setOpen(Boolean(trigger));
        }
    }, [trigger]);

    useEffect(() => {
        if (!selectedDate || !workouts?.length || !foods?.length) return;
        setLoading(true);

        const dateStr = new Date(selectedDate).toISOString().slice(0, 10);
        const filteredWorkouts = workouts.filter((w) => {
            if (!w.startTime) return false;
            return new Date(w.startTime * 1000).toISOString().slice(0, 10) === dateStr;
        });
        const filteredFoods = foods.filter((f) => {
            if (!f.time) return false;
            return new Date(f.time * 1000).toISOString().slice(0, 10) === dateStr;
        });

        setDayWorkouts(filteredWorkouts);
        setDayFoods(filteredFoods);
        setLoading(false);
    }, [selectedDate, workouts, foods]);

    useEffect(() => {
        if (selectedWorkout?._id) {
            const loadPersonalExercises = async () => {
                setPersonalExercisesLoading(true);
                try {
                    const exercises = await fetchPersonalExercises(selectedWorkout._id);
                    setPersonalExercises(Array.isArray(exercises) ? exercises : []);
                } catch (err) {
                    console.error("Failed to fetch personal exercises:", err);
                    setPersonalExercises([]);
                } finally {
                    setPersonalExercisesLoading(false);
                }
            };
            loadPersonalExercises();
        }
    }, [selectedWorkout]);

    useEffect(() => {
        const exerciseIds = personalExercises.map((ex) => ex.exercise_id);
        if (exerciseIds.length === 0) return;
        const missing = exerciseIds.filter((id) => !exerciseNames[id]);
        if (missing.length === 0) return;

        const loadNames = async () => {
            try {
                const results = {};
                for (const id of missing) {
                    if (!id) {
                        results[id] = "Unknown Exercise";
                        continue;
                    }
                    try {
                        const response = await fetch(`https://www.ahful.app/api/AHFULexercises/id/${id}`, {credentials: "include"});
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
            } catch (err) {
                console.error("Error fetching exercise names:", err);
            }
        };
        loadNames();
    }, [personalExercises]);

    useEffect(() => {
        if (selectedWorkout?.gymId) {
            const loadGymInfo = async () => {
                setGymLoading(true);
                try {
                    const gym = await fetchGym(selectedWorkout.gymId);
                    setGymInfo(gym);
                } catch (err) {
                    console.error("Failed to fetch gym info:", err);
                    setGymInfo(null);
                } finally {
                    setGymLoading(false);
                }
            };
            loadGymInfo();
        } else {
            setGymInfo(null);
        }
    }, [selectedWorkout]);

    const toggle = () => {
        if (typeof setTrigger === "function") {
            setTrigger(!trigger);
        } else {
            setOpen((s) => !s);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const calculateDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return "N/A";
        const duration = endTime - startTime;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        if (minutes === 0) return `${seconds}s`;
        return `${minutes}m ${seconds}s`;
    };

    return (
        <div className="calendar-button-wrapper" ref={wrapperRef}>
            <div style={{ display: open ? "block" : "none" }} className="calendar-popup-content">
                <Calendar onCalendarSizeChange={(rows) => setCalendarRows(rows)} />
                <div className="calendar-todo-row" style={{ top: todoTop }}>
                    <div className="calendar-todo-panel">
                        <h3 className="dashboard-todo-title">Workouts</h3>
                        {loading ? (
                            <div className="dashboard-todo-loading">Loading...</div>
                        ) : dayWorkouts.length === 0 ? (
                            <div className="dashboard-todo-empty">No workouts</div>
                        ) : (
                            <div className="dashboard-todo-items">
                                {dayWorkouts.map((workout) => (
                                    <div
                                        key={workout._id}
                                        className="workout-todo-clickable"
                                        onClick={() => setSelectedWorkout(workout)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                setSelectedWorkout(workout);
                                            }
                                        }}
                                    >
                                        <DashboardWorkoutTodoItem workout={workout} />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="dashboard-todo-footer">
                            <a href="/ExploreWorkout" className="view-more-link">View More →</a>
                        </div>
                    </div>
                    <div className="calendar-todo-panel">
                        <h3 className="dashboard-todo-title">Foods</h3>
                        {loading ? (
                            <div className="dashboard-todo-loading">Loading...</div>
                        ) : dayFoods.length === 0 ? (
                            <div className="dashboard-todo-empty">No foods</div>
                        ) : (
                            <div className="dashboard-todo-items">
                                {dayFoods.map((food) => (
                                    <DashboardFoodTodoItem key={food._id} food={food} />
                                ))}
                            </div>
                        )}
                        <div className="dashboard-todo-footer">
                            <a href="/FoodLog" className="view-more-link">View More →</a>
                        </div>
                    </div>
                </div>
            </div>
            <button
                className={`calendar-button-trigger ${open ? "active" : ""}`}
                onClick={toggle}
            >
                📅
            </button>

            {/* Workout Details Modal */}
            {selectedWorkout && (
                <div className="workout-modal-overlay calendar-workout-modal" onClick={() => setSelectedWorkout(null)}>
                    <div className="workout-modal-content calendar-workout-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="workout-modal-header">
                            <h2>{selectedWorkout.title || "Untitled Workout"}</h2>
                            <button
                                className="workout-modal-close"
                                onClick={() => setSelectedWorkout(null)}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="workout-modal-body">
                            <div className="workout-detail-section">
                                <label className="workout-detail-label">Workout Title</label>
                                <p className="workout-detail-value">{selectedWorkout.title || "N/A"}</p>
                            </div>

                            {selectedWorkout.gymId && (
                                <div className="workout-detail-section">
                                    <label className="workout-detail-label">Gym</label>
                                    {gymLoading ? (
                                        <p className="workout-gym-loading">Loading gym info…</p>
                                    ) : gymInfo ? (
                                        <div className="workout-gym-info">
                                            {gymInfo.name && <p className="workout-gym-name">{gymInfo.name}</p>}
                                            {gymInfo.address && <p className="workout-gym-location">{gymInfo.address}</p>}
                                        </div>
                                    ) : (
                                        <p className="workout-gym-unavailable">Gym info not available</p>
                                    )}
                                </div>
                            )}

                            {selectedWorkout.startTime && (
                                <div className="workout-detail-section">
                                    <label className="workout-detail-label">Start Time</label>
                                    <p className="workout-detail-value">{formatDate(selectedWorkout.startTime)}</p>
                                </div>
                            )}

                            {selectedWorkout.endTime && (
                                <div className="workout-detail-section">
                                    <label className="workout-detail-label">End Time</label>
                                    <p className="workout-detail-value">{formatDate(selectedWorkout.endTime)}</p>
                                </div>
                            )}

                            {selectedWorkout.startTime && selectedWorkout.endTime && (
                                <div className="workout-detail-section">
                                    <label className="workout-detail-label">Duration</label>
                                    <p className="workout-detail-value">
                                        {calculateDuration(selectedWorkout.startTime, selectedWorkout.endTime)}
                                    </p>
                                </div>
                            )}

                            {selectedWorkout.instructions && (
                                <div className="workout-detail-section">
                                    <label className="workout-detail-label">Instructions</label>
                                    <p className="workout-detail-value">{selectedWorkout.instructions}</p>
                                </div>
                            )}

                            <div className="workout-detail-section">
                                <label className="workout-detail-label">Exercises</label>
                                {personalExercisesLoading ? (
                                    <p className="workout-exercises-loading">Loading exercises…</p>
                                ) : personalExercises.length === 0 ? (
                                    <p className="workout-exercises-empty">No exercises recorded for this workout</p>
                                ) : (
                                    <div className="workout-exercises-list">
                                        {personalExercises.map((exercise, idx) => (
                                            <div key={exercise._id || idx} className="workout-exercise-item">
                                                <div className="exercise-item-header">
                                                    <span className="exercise-item-number">
                                                        {exerciseNames[exercise.exercise_id] || "Unknown Exercise"}
                                                    </span>
                                                </div>
                                                {exercise.weight && (
                                                    <div className="exercise-item-detail">
                                                        <span className="exercise-detail-label">Weight:</span>{" "}
                                                        <span>{exercise.weight} lbs</span>
                                                    </div>
                                                )}
                                                {exercise.sets != null && exercise.sets !== undefined && exercise.sets !== "" && exercise.sets !== 0 && (
                                                    <div className="exercise-item-detail">
                                                        <span className="exercise-detail-label">Sets:</span>{" "}
                                                        <span>{exercise.sets}</span>
                                                    </div>
                                                )}
                                                {exercise.reps != null && exercise.reps !== undefined && exercise.reps !== "" && exercise.reps !== 0 && (
                                                    <div className="exercise-item-detail">
                                                        <span className="exercise-detail-label">Reps:</span>{" "}
                                                        <span>{exercise.reps}</span>
                                                    </div>
                                                )}
                                                {exercise.duration != null && exercise.duration !== undefined && Number(exercise.duration) > 0 && (
                                                    <div className="exercise-item-detail">
                                                        <span className="exercise-detail-label">Duration:</span>{" "}
                                                        <span>{exercise.duration}s</span>
                                                    </div>
                                                )}
                                                {exercise.distance != null && exercise.distance !== undefined && Number(exercise.distance) > 0 && (
                                                    <div className="exercise-item-detail">
                                                        <span className="exercise-detail-label">Distance:</span>{" "}
                                                        <span>{exercise.distance}m</span>
                                                    </div>
                                                )}
                                                {(exercise.complete || exercise.completed) && (
                                                    <div className="exercise-item-detail">
                                                        <span className="exercise-item-completed">✓ Completed</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="workout-modal-actions">
                            <button
                                className="workout-modal-btn workout-modal-btn-close"
                                onClick={() => setSelectedWorkout(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
