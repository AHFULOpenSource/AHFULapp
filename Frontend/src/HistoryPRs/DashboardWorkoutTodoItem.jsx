import "../siteStyles.css";

export function DashboardWorkoutTodoItem({ workout }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="dashboard-todo-item">
      <div className="dashboard-todo-item-main">
        <span className="dashboard-todo-item-title">{workout.title || "Untitled Workout"}</span>
        <span className="dashboard-todo-item-date">{formatDate(workout.startTime)}</span>
      </div>
      {workout.endTime && (
        <div className="dashboard-todo-item-meta">
          Duration: {Math.round((workout.endTime - workout.startTime) / 60)} min
        </div>
      )}
    </div>
  );
}
