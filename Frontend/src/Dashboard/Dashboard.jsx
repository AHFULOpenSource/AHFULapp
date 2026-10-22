import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import { DashboardFoodTodoList } from "../Food/DashboardFoodTodoList";
import { DashboardWorkoutTodoList } from "../HistoryPRs/DashboardWorkoutTodoList";
import { DashboardTaskTodoList } from "../Tasks/DashboardTaskTodoList";
import { WorkoutChart } from "../HistoryPRs/WorkoutChart";
import { TodayFoodChart } from "../Food/TodayFoodChart";
import { Calendar } from "../Calendar/Calendar.jsx";
import { StreakCounter } from "./StreakCounter";
import "../siteStyles.css";
import { auth } from "../firebase.js";
import { GetFirebaseUser } from "../Auth/GetFirebaseUser.js";

export function Dashboard() {
  const [workoutStreak, setWorkoutStreak] = useState({
    streak: 0,
    loading: true,
  });
  const [foodStreak, setFoodStreak] = useState({ streak: 0, loading: true });
  const { user, loading: authLoading } = GetFirebaseUser();
  const userID = useSelector((state) => state.setting.user_id);

  useEffect(() => {
    if (userID) {
      const fetchStreaks = async () => {
        try {
          const [workoutRes, foodRes] = await Promise.all([
            fetch(`http://localhost:5000/api/AHFULworkouts/streak/${userID}`, {credentials: "include"}),
            fetch(`http://localhost:5000/api/AHFULfoods/streak/${userID}`, {credentials: "include"}),
          ]);

          const workoutData = await workoutRes.json();
          const foodData = await foodRes.json();

          setWorkoutStreak({ streak: workoutData.streak || 0, loading: false });
          setFoodStreak({ streak: foodData.streak || 0, loading: false });
        } catch (error) {
          console.error("Error fetching streaks:", error);
          setWorkoutStreak({ streak: 0, loading: false });
          setFoodStreak({ streak: 0, loading: false });
        }
      };
      fetchStreaks();
    }
  }, [userID]);

  return (
    <div className="dashboard-internal">
      <div className="dashboard-grid">
        <div className="dashboard-main-content">
          <div className="dashboard-widget dashboard-widget-streaks">
            <div className="streaks-wrapper">
              <StreakCounter
                count={workoutStreak.streak}
                type="workout"
                loading={workoutStreak.loading}
              />
              <StreakCounter
                count={foodStreak.streak}
                type="food"
                loading={foodStreak.loading}
              />
            </div>
          </div>

          <div className="dashboard-widget dashboard-widget-calendar">
            <Calendar />
          </div>

          <div className="dashboard-tasks-subrow">
            <div className="dashboard-widget dashboard-widget-food-todo">
              <DashboardFoodTodoList />
            </div>
            <div className="dashboard-widget dashboard-widget-workout-todo">
              <DashboardWorkoutTodoList />
            </div>
          </div>

          <div className="dashboard-widget dashboard-widget-tasks">
            <DashboardTaskTodoList />
          </div>
        </div>

        <div className="dashboard-side-content">
          <div className="dashboard-widget dashboard-widget-food-chart">
            <TodayFoodChart />
          </div>
          <div className="dashboard-widget dashboard-widget-workout-chart">
            <WorkoutChart defaultWeeks={6} />
          </div>
        </div>
      </div>
    </div>
  );
}
