import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import { DashboardFoodTodoList } from "../Food/DashboardFoodTodoList";
import { DashboardWorkoutTodoList } from "../ExploreWorkouts/DashboardWorkoutTodoList";
import { DashboardTaskTodoList } from "../Tasks/DashboardTaskTodoList";
import { WorkoutChart } from "../ExploreWorkouts/WorkoutChart";
import { TodayFoodChart } from "../Food/TodayFoodChart";
import { CalendarButton } from "../Calendar/CalendarButton";
import { StreakCounter } from "./StreakCounter";
import "../siteStyles.css";

export function Dashboard() {
  const [workoutStreak, setWorkoutStreak] = useState({
    streak: 0,
    loading: true,
  });
  const [foodStreak, setFoodStreak] = useState({ streak: 0, loading: true });
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user?._id) {
      const fetchStreaks = async () => {
        try {
          const [workoutRes, foodRes] = await Promise.all([
            fetch(`https://www.ahful.app/api/AHFULworkouts/streak/${user._id}`, {credentials: "include"}),
            fetch(`https://www.ahful.app/api/AHFULfoods/streak/${user._id}`, {credentials: "include"}),
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
  }, [user?._id]);

  return (
    <div className="dashboard-internal">
      <div className="dashboard-grid">
        <div className="dashboard-main-content">
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
          <CalendarButton />
          <div className="dashboard-tasks-row">
            <DashboardFoodTodoList />
            <DashboardWorkoutTodoList />
          </div>
          <div className="dashboard-tasks-row">
            <DashboardTaskTodoList />
          </div>
        </div>
        <div className="dashboard-side-content">
          <TodayFoodChart />
          <WorkoutChart defaultWeeks={6} />
        </div>
      </div>
    </div>
  );
}
