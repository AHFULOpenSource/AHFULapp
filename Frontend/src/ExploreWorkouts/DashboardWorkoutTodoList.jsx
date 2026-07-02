import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "../siteStyles.css";
import { DashboardWorkoutTodoItem } from "./DashboardWorkoutTodoItem";

export function DashboardWorkoutTodoList() {
  const [workouts, setWorkouts] = useState([]);
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

    const fetchWorkouts = async () => {
      try {
        const res = await fetch(`https://www.ahful.app/api/AHFULworkouts/${userId}` , {credentials: "include"});
        if (res.ok) {
          const data = await res.json();
          const sorted = (Array.isArray(data) ? data : [])
            .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
            .slice(0, 15);
          setWorkouts(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch workouts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [userId]);

  if (loading) {
    return (
      <div className="dashboard-todo-list">
        <h3 className="dashboard-todo-title">Recent Workouts</h3>
        <div className="dashboard-todo-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-todo-list">
      <h3 className="dashboard-todo-title">Recent Workouts</h3>
      {workouts.length === 0 ? (
        <div className="dashboard-todo-empty">No workouts yet</div>
      ) : (
        <div className="dashboard-todo-items">
          {workouts.map((workout) => (
            <DashboardWorkoutTodoItem key={workout._id} workout={workout} />
          ))}
        </div>
      )}
      <div className="dashboard-todo-footer">
        <Link to="/ExploreWorkout" className="view-more-link">View More →</Link>
      </div>
    </div>
  );
}
