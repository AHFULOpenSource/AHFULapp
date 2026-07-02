import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "../siteStyles.css";
import { DashboardTaskTodoItem } from "./DashboardTaskTodoItem";
import { updateTask, toggleTaskFavorite } from "../QueryFunctions";

export function DashboardTaskTodoList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);

  const getUserId = () => {
    if (user?._id) return user._id;
    try {
      const stored = JSON.parse(localStorage.getItem("user_data"));
      return stored?._id || null;
    } catch { return null; }
  };
  const userId = getUserId();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch(`https://www.ahful.app/api/AHFULtasks/user/${userId}`, {credentials: "include"});
        if (res.ok) {
          const data = await res.json();
          const sorted = (Array.isArray(data) ? data : [])
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 15);
          setTasks(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userId]);

  const handleToggleComplete = async (taskId, currentCompleted) => {
    const newCompleted = !currentCompleted;
    const result = await updateTask(taskId, { completed: newCompleted });
    if (result.success) {
      setTasks(tasks.map(t => 
        t._id === taskId ? { ...t, completed: newCompleted } : t
      ));
    }
  };

  const handleToggleFavorite = async (taskId) => {
    const { data, error } = await toggleTaskFavorite(taskId);
    if (!error) {
      setTasks(tasks.map(t =>
        t._id === taskId ? { ...t, favorite: !t.favorite } : t
      ));
    }
  };

  if (loading) {
    return (
      <div className="dashboard-todo-list">
        <h3 className="dashboard-todo-title">Tasks</h3>
        <div className="dashboard-todo-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-todo-list">
      <h3 className="dashboard-todo-title">Tasks</h3>
      {tasks.length === 0 ? (
        <div className="dashboard-todo-empty">No tasks yet</div>
      ) : (
        <div className="dashboard-todo-items">
          {tasks.map((task) => (
            <DashboardTaskTodoItem 
              key={task._id} 
              task={task}
              onToggleComplete={handleToggleComplete}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
      <div className="dashboard-todo-footer">
        <Link to="/ExploreTasks" className="view-more-link">View More →</Link>
      </div>
    </div>
  );
}
