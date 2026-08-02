import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "../siteStyles.css";
import { DashboardFoodTodoItem } from "./DashboardFoodTodoItem";
import { selectFood } from "./PullUserFoodSlice.js";

export function DashboardFoodTodoList() {
  const foods = useSelector(selectFood);

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
