import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "../siteStyles.css";
import { DashboardWorkoutTodoItem } from "./DashboardWorkoutTodoItem";
import { selectWorkouts } from "../WokoutLogger/PullWorkoutSlice.js";

export function DashboardWorkoutTodoList() {
  const workouts = useSelector(selectWorkouts);

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
        <Link to="/WorkoutLogger" className="view-more-link">View More →</Link>
      </div>
    </div>
  );
}
