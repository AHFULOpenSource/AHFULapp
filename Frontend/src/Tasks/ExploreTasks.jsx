import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./ExploreTasks.css";
import "../siteStyles.css";
import { updateTask, toggleTaskFavorite } from "../QueryFunctions";

export function ExploreTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const user = useSelector((state) => state.auth.user);

  // Form state
  const [taskName, setTaskName] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [taskDueDateTime, setTaskDueDateTime] = useState("");
  const [formError, setFormError] = useState("");

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("daily"); // daily, weekly, monthly, yearly
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const getUserId = () => {
    if (user?._id) return user._id;
    try {
      const stored = JSON.parse(localStorage.getItem("user_data"));
      return stored?._id || null;
    } catch { return null; }
  };
  const userId = getUserId();

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) {
        throw new Error("User ID not found. Please log in to view your tasks.");
      }

      const res = await fetch(`https://www.ahful.app/api/AHFULtasks/user/${userId}`, {credentials: "include"});

      if (!res.ok) {
        let bodyText = "";
        try {
          bodyText = await res.text();
        } catch (e) {}
        throw new Error(`Server returned ${res.status} ${res.statusText} ${bodyText}`);
      }

      const data = await res.json();
      const sorted = (Array.isArray(data) ? data : [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTasks(sorted);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      const friendly = err && err.name ? `${err.name}: ${err.message}` : String(err);
      setError(friendly || "Unknown error");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!taskName.trim()) {
      setFormError("Task name is required");
      return;
    }

    if (!userId) {
      setFormError("You must be logged in to create a task");
      return;
    }

    // Convert datetime-local to Unix timestamp
    let dueTime = null;
    if (taskDueDateTime) {
      const dateObj = new Date(taskDueDateTime);
      dueTime = Math.floor(dateObj.getTime() / 1000);
    }

    // Convert recurrence end date to Unix timestamp
    let recEndTime = null;
    if (isRecurring && recurrenceEndDate) {
      const endDateObj = new Date(recurrenceEndDate);
      recEndTime = Math.floor(endDateObj.getTime() / 1000);
    }

    try {
      const res = await fetch(`https://www.ahful.app/api/AHFULtasks/create/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName,
          note: taskNote,
          dueTime: dueTime,
          recurring: isRecurring,
          recurrenceType: isRecurring ? recurrenceType : null,
          recurrenceEndDate: recEndTime
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData.error || "Failed to create task");
        return;
      }

      // Clear form and refresh task list
      setTaskName("");
      setTaskNote("");
      setTaskDueDateTime("");
      setIsRecurring(false);
      setRecurrenceType("daily");
      setRecurrenceEndDate("");
      fetchTasks();
    } catch (err) {
      setFormError("Network error - could not create task");
      console.error(err);
    }
  };

  const toggleTaskCompletion = async (taskId, currentCompleted) => {
    const newCompleted = !currentCompleted;
    const result = await updateTask(taskId, { completed: newCompleted });
    if (result.success) {
      setTasks(tasks.map(t =>
        t._id === taskId ? { ...t, completed: newCompleted } : t
      ));
    } else {
      console.error("Failed to update task:", result.error);
    }
  };

  const handleToggleFavorite = async (taskId) => {
    const { data, error } = await toggleTaskFavorite(taskId);
    if (!error) {
      setTasks(tasks.map(t =>
        t._id === taskId ? { ...t, favorite: !t.favorite } : t
      ));
    } else {
      console.error("Failed to toggle favorite:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  // Helper to format due date display
  const formatDueDate = (dueTime) => {
    if (!dueTime || dueTime === 0) return "No due date";
    try {
      return new Date(dueTime * 1000).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="explore-root">
      <header className="explore-header">
        <h1>Explore Tasks</h1>
        <div className="header-controls">
          <button onClick={fetchTasks} disabled={loading} className="refresh-btn">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Create Task Form */}
      {userId && (
        <div className="add-task-section">
          <h2>Create New Task</h2>
          <form onSubmit={createTask} className="task-form">
            <div className="form-group">
              <label htmlFor="taskName">Task Name</label>
              <input
                id="taskName"
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g., Morning Workout"
              />
            </div>
            <div className="form-group">
              <label htmlFor="taskNote">Note (optional)</label>
              <textarea
                id="taskNote"
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
            <div className="form-group">
              <label htmlFor="taskDueDateTime">Due Date (optional)</label>
              <input
                id="taskDueDateTime"
                type="datetime-local"
                value={taskDueDateTime}
                onChange={(e) => setTaskDueDateTime(e.target.value)}
              />
            </div>

            {/* Recurring Task Options */}
            <div className="form-group">
              <label htmlFor="isRecurring">
                <input
                  id="isRecurring"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                {" "}Make this a repeating task
              </label>
            </div>

            {isRecurring && (
              <>
                <div className="form-group">
                  <label htmlFor="recurrenceType">Repeat</label>
                  <select
                    id="recurrenceType"
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="recurrenceEndDate">End Date (optional)</label>
                  <input
                    id="recurrenceEndDate"
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {formError && <div className="error-message">{formError}</div>}
            <button type="submit" className="btn-add">Create Task</button>
          </form>
        </div>
      )}

      <div className="explore-content">
        <div className="explore-left">
          {error && <div className="explore-error">Error: {error}</div>}

          {!error && (
            <>
              <div className="favorite-filter-section">
                <button
                  className={`favorite-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  title="Show favorites only"
                >
                  {showFavoritesOnly ? '⭐ Favorites' : '☆ All'}
                </button>
              </div>
              <div className="exercise-list">
                {loading && tasks.length === 0 ? (
                  <div className="explore-loading">Loading tasks…</div>
                ) : (showFavoritesOnly ? tasks.filter(t => t.favorite) : tasks).length === 0 ? (
                  <div className="explore-empty">
                    {showFavoritesOnly ? "No favorite tasks. Star a task to add it here!" : "No tasks found. Create a task to see it here!"}
                  </div>
                ) : (
                  (showFavoritesOnly ? tasks.filter(t => t.favorite) : tasks).map((task, idx) => {
                    const key = task.id || task._id || task.name || `task-${idx}`;
                    return (
                      <div key={key} className="exercise-item">
                        <div className="exercise-main">
                          <button
                            className="task-complete-btn"
                            onClick={() => toggleTaskCompletion(task._id, task.completed)}
                            title={task.completed ? "Mark as incomplete" : "Mark as complete"}
                          >
                            {task.completed ? "✅" : "❌"}
                          </button>
                          <button
                            className="task-favorite-btn"
                            onClick={() => handleToggleFavorite(task._id)}
                            title={task.favorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            {task.favorite ? "⭐" : "☆"}
                          </button>
                          <div className="exercise-name" style={{ textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1 }}>
                            {task.name || "Untitled Task"}
                          </div>
                          <div className="exercise-meta">
                            {task.note && <span>{task.note}</span>}
                            {task.recurring && <span className="recurring-badge">🔄 {task.recurrenceType || "Repeating"}</span>}
                            {task.dueTime !== undefined && (
                              <span> • Due: {formatDueDate(task.dueTime)}</span>
                            )}
                          </div>
                        </div>
                        <div className="exercise-meta" style={{marginTop: '4px', fontSize: '12px'}}>
                          Created: {task.created_at ? new Date(task.created_at).toLocaleString() : "Unknown"}
                          {task.updated_at && ` • Updated: ${new Date(task.updated_at).toLocaleString()}`}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
