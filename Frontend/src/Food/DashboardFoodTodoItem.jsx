import "../siteStyles.css";

export function DashboardFoodTodoItem({ food }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const totalCalories = ((food.calories) || 0) * (food.servings || 1);

  return (
    <div className="dashboard-todo-item">
      <div className="dashboard-todo-item-main">
        <span className="dashboard-todo-item-title">{food.name || "Untitled Food"}</span>
        <span className="dashboard-todo-item-meta">{food.type || ""}</span>
      </div>
      <div className="dashboard-todo-item-sub">
        <span>{totalCalories} cal</span>
        <span className="dashboard-todo-item-date">{formatDate(food.time)}</span>
      </div>
    </div>
  );
}
