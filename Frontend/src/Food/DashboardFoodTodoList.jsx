import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "../siteStyles.css";
import { DashboardFoodTodoItem } from "./DashboardFoodTodoItem";

export function DashboardFoodTodoList() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = useSelector((state) => state.setting.user_id);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchFoods = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/AHFULfoods/${userId}`, {credentials: "include"});
        if (res.ok) {
          const data = await res.json();
          const sorted = (Array.isArray(data) ? data : [])
            .sort((a, b) => (b.time || 0) - (a.time || 0))
            .slice(0, 15);
          setFoods(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch foods:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [userId]);

  if (loading) {
    return (
      <div className="dashboard-todo-list">
        <h3 className="dashboard-todo-title">Recent Foods</h3>
        <div className="dashboard-todo-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-todo-list">
      <h3 className="dashboard-todo-title">Recent Foods</h3>
      {foods.length === 0 ? (
        <div className="dashboard-todo-empty">No foods logged yet</div>
      ) : (
        <div className="dashboard-todo-items">
          {foods.map((food) => (
            <DashboardFoodTodoItem key={food._id} food={food} />
          ))}
        </div>
      )}
      <div className="dashboard-todo-footer">
        <Link to="/FoodLog" className="view-more-link">View More →</Link>
      </div>
    </div>
  );
}
