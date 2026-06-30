import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./FavoritesHub.css";
import "../siteStyles.css";
import { getFoodFavorites, getWorkoutFavorites, getTaskFavorites, createWorkout, toggleFoodFavorite, toggleWorkoutFavorite, toggleTaskFavorite } from "../QueryFunctions";

export function FavoritesHub() {
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState("foods"); // foods, workouts, tasks

  const [favoriteFoods, setFavoriteFoods] = useState([]);
  const [favoriteWorkouts, setFavoriteWorkouts] = useState([]);
  const [favoriteTasks, setFavoriteTasks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addedToday, setAddedToday] = useState(new Set()); // Track items added today

  const getUserId = () => {
    if (user?._id) return user._id;
    try {
      const stored = JSON.parse(localStorage.getItem("user_data"));
      return stored?._id || null;
    } catch {
      return null;
    }
  };

  // Check if an item was added today
  const wasAddedToday = (itemId) => {
    const storageKey = `favorite_add_${itemId}`;
    const lastAddedDate = localStorage.getItem(storageKey);
    if (!lastAddedDate) return false;

    const lastAdded = new Date(lastAddedDate);
    const today = new Date();
    return (
      lastAdded.getFullYear() === today.getFullYear() &&
      lastAdded.getMonth() === today.getMonth() &&
      lastAdded.getDate() === today.getDate()
    );
  };

  // Mark an item as added today
  const markAsAddedToday = (itemId) => {
    const storageKey = `favorite_add_${itemId}`;
    localStorage.setItem(storageKey, new Date().toISOString());
    setAddedToday((prev) => new Set([...prev, itemId]));
  };

  // Load all items added today on mount
  useEffect(() => {
    const todayAdded = new Set();
    const allFavoriteIds = [
      ...favoriteFoods.map((f) => f._id),
      ...favoriteWorkouts.map((w) => w._id),
      ...favoriteTasks.map((t) => t._id),
    ];
    allFavoriteIds.forEach((id) => {
      if (wasAddedToday(id)) {
        todayAdded.add(id);
      }
    });
    setAddedToday(todayAdded);
  }, [favoriteFoods, favoriteWorkouts, favoriteTasks]);

  const userId = getUserId();

  useEffect(() => {
    if (!userId) return;
    fetchFavorites();
  }, [userId]);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const [foodRes, workoutRes, taskRes] = await Promise.all([
        getFoodFavorites(userId),
        getWorkoutFavorites(userId),
        getTaskFavorites(userId),
      ]);

      if (foodRes.data) {
        setFavoriteFoods(Array.isArray(foodRes.data) ? foodRes.data : []);
      }
      if (workoutRes.data) {
        setFavoriteWorkouts(Array.isArray(workoutRes.data) ? workoutRes.data : []);
      }
      if (taskRes.data) {
        setFavoriteTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const addFavoriteFoodToLog = async (food) => {
    // Check if already added today
    if (wasAddedToday(food._id)) {
      alert("You've already added this food today. Come back tomorrow! 🚫");
      return;
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      const res = await fetch(`https://www.ahful.app/api/AHFULfoods/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: food.name,
          calsPerServing: food.calsPerServing,
          servings: food.servings,
          type: food.type,
          time: now,
        }),
      });

      if (res.ok) {
        markAsAddedToday(food._id);
        alert(`✅ Added "${food.name}" to today's food log!`);
      } else {
        alert("Failed to add food");
      }
    } catch (err) {
      console.error("Error adding food:", err);
      alert("Error adding food to log");
    }
  };

  const addFavoriteWorkoutToToday = async (workout) => {
    // Check if already added today
    if (wasAddedToday(workout._id)) {
      alert("You've already added this workout today. Come back tomorrow! 🚫");
      return;
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      const res = await fetch(`https://www.ahful.app/api/AHFULworkouts/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${workout.title} (from favorites)`,
          startTime: now,
          endTime: now,
          gymId: workout.gymId || null,
          exercises: workout.exercises || [],
          template: false,
        }),
      });

      if (res.ok) {
        markAsAddedToday(workout._id);
        alert(`✅ Added "${workout.title}" to today's workouts!`);
      } else {
        alert("Failed to add workout");
      }
    } catch (err) {
      console.error("Error adding workout:", err);
      alert("Error adding workout");
    }
  };

  const addFavoriteTaskToList = async (task) => {
    // Check if already added today
    if (wasAddedToday(task._id)) {
      alert("You've already added this task today. Come back tomorrow! 🚫");
      return;
    }

    try {
      const res = await fetch(`https://www.ahful.app/api/AHFULtasks/create/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: task.name,
          note: task.note,
          dueTime: Math.floor(Date.now() / 1000) + 86400, // Due tomorrow
          recurring: task.recurring || false,
          recurrenceType: task.recurrenceType || null,
          recurrenceEndDate: task.recurrenceEndDate || null,
        }),
      });

      if (res.ok) {
        markAsAddedToday(task._id);
        alert(`✅ Added "${task.name}" to your tasks!`);
      } else {
        alert("Failed to add task");
      }
    } catch (err) {
      console.error("Error adding task:", err);
      alert("Error adding task");
    }
  };

  const removeFavoriteFood = async (foodId) => {
    try {
      const { data, error } = await toggleFoodFavorite(foodId);
      if (error) {
        alert(`Failed to remove favorite: ${error}`);
      } else {
        setFavoriteFoods(favoriteFoods.filter(f => f._id !== foodId));
        alert("✅ Removed from favorites!");
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
      alert("Error removing favorite");
    }
  };

  const removeFavoriteWorkout = async (workoutId) => {
    try {
      const { data, error } = await toggleWorkoutFavorite(workoutId);
      if (error) {
        alert(`Failed to remove favorite: ${error}`);
      } else {
        setFavoriteWorkouts(favoriteWorkouts.filter(w => w._id !== workoutId));
        alert("✅ Removed from favorites!");
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
      alert("Error removing favorite");
    }
  };

  const removeFavoriteTask = async (taskId) => {
    try {
      const { data, error } = await toggleTaskFavorite(taskId);
      if (error) {
        alert(`Failed to remove favorite: ${error}`);
      } else {
        setFavoriteTasks(favoriteTasks.filter(t => t._id !== taskId));
        alert("✅ Removed from favorites!");
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
      alert("Error removing favorite");
    }
  };

  return (
    <div className="favorites-hub">
      <div className="favorites-header">
        <h1>⭐ My Favorites</h1>
        <button className="refresh-btn" onClick={fetchFavorites} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="favorites-tabs">
        <button
          className={`tab-btn ${activeTab === "foods" ? "active" : ""}`}
          onClick={() => setActiveTab("foods")}
        >
          🍎 Foods ({favoriteFoods.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "workouts" ? "active" : ""}`}
          onClick={() => setActiveTab("workouts")}
        >
          💪 Workouts ({favoriteWorkouts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          ✓ Tasks ({favoriteTasks.length})
        </button>
      </div>

      <div className="favorites-content">
        {/* Foods Tab */}
        {activeTab === "foods" && (
          <div className="tab-content">
            {favoriteFoods.length === 0 ? (
              <div className="empty-state">
                <p>No favorite foods yet</p>
                <small>Star foods from your food log to add them here</small>
              </div>
            ) : (
              <div className="favorites-list">
                {favoriteFoods.map((food) => (
                  <div key={food._id} className="favorite-item">
                    <div className="favorite-info">
                      <h3>{food.name}</h3>
                      <p className="food-meta">
                        {food.calsPerServing} cal/serving × {food.servings} servings = {food.calsPerServing * food.servings} cal
                      </p>
                      <span className="food-type">{food.type}</span>
                    </div>
                    <div className="button-group">
                      <button
                        className="quick-add-btn"
                        onClick={() => addFavoriteFoodToLog(food)}
                        disabled={addedToday.has(food._id)}
                        title={addedToday.has(food._id) ? "Already added today" : "Add this food to today's log"}
                      >
                        {addedToday.has(food._id) ? "✓ Added Today" : "+ Add Today"}
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => removeFavoriteFood(food._id)}
                        title="Remove from favorites"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workouts Tab */}
        {activeTab === "workouts" && (
          <div className="tab-content">
            {favoriteWorkouts.length === 0 ? (
              <div className="empty-state">
                <p>No favorite workouts yet</p>
                <small>Star workouts from your workout logger to add them here</small>
              </div>
            ) : (
              <div className="favorites-list">
                {favoriteWorkouts.map((workout) => (
                  <div key={workout._id} className="favorite-item">
                    <div className="favorite-info">
                      <h3>{workout.title}</h3>
                      {workout.exercises && Array.isArray(workout.exercises) && (
                        <p className="exercise-count">
                          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <div className="button-group">
                      <button
                        className="quick-add-btn"
                        onClick={() => addFavoriteWorkoutToToday(workout)}
                        disabled={addedToday.has(workout._id)}
                        title={addedToday.has(workout._id) ? "Already added today" : "Add this workout to today"}
                      >
                        {addedToday.has(workout._id) ? "✓ Added Today" : "+ Add Today"}
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => removeFavoriteWorkout(workout._id)}
                        title="Remove from favorites"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="tab-content">
            {favoriteTasks.length === 0 ? (
              <div className="empty-state">
                <p>No favorite tasks yet</p>
                <small>Star tasks from your task list to add them here</small>
              </div>
            ) : (
              <div className="favorites-list">
                {favoriteTasks.map((task) => (
                  <div key={task._id} className="favorite-item">
                    <div className="favorite-info">
                      <h3>{task.name}</h3>
                      {task.note && <p className="task-note">{task.note}</p>}
                      {task.recurring && (
                        <span className="recurring-badge">🔄 Repeats {task.recurrenceType}</span>
                      )}
                    </div>
                    <div className="button-group">
                      <button
                        className="quick-add-btn"
                        onClick={() => addFavoriteTaskToList(task)}
                        disabled={addedToday.has(task._id)}
                        title={addedToday.has(task._id) ? "Already added today" : "Add this task to your list"}
                      >
                        {addedToday.has(task._id) ? "✓ Added Today" : "+ Add"}
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => removeFavoriteTask(task._id)}
                        title="Remove from favorites"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
