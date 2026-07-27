import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import "./ExploreWorkouts.css";

const API_BASE = "http://localhost:5000/api/AHFULworkouts";
const WEEK_OPTIONS = [4, 6, 8, 12];

function getWeekInfo(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  const month = d.toLocaleString("default", { month: "short" });
  const label = `${month} ${d.getDate()}`;
  const sortKey = d.toISOString().slice(0, 10);
  return { label, sortKey };
}

function aggregateWorkoutsToWeeks(workouts, numWeeks) {
  if (!workouts || workouts.length === 0) return [];

  const now = new Date();
  const weeksAgo = new Date(now);
  weeksAgo.setDate(now.getDate() - (numWeeks * 7));
  weeksAgo.setHours(0, 0, 0, 0);
  const cutoffTimestamp = Math.floor(weeksAgo.getTime() / 1000);

  const buckets = {};
  workouts.forEach((w) => {
    if (!w.startTime) return;
    if (w.startTime < cutoffTimestamp) return;
    
    const { label, sortKey } = getWeekInfo(w.startTime * 1000);
    if (!buckets[sortKey]) buckets[sortKey] = { week: label, count: 0 };
    buckets[sortKey].count += 1;
  });

  return Object.entries(buckets)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, { week, count }]) => ({ week, workouts: count }));
}

export function WorkoutChart({ defaultWeeks = 6 }) {
  const [weeks, setWeeks] = useState(defaultWeeks);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.auth.user);

  const getUserId = () => {
    if (user?._id) return user._id;
    return null
  };
  const userId = getUserId();

  const fetchWorkouts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/${userId}`, {credentials: "include"});
      
      if (!res.ok) {
        if (res.status === 404) {
          setAllWorkouts([]);
          setLoading(false);
          return;
        }
        throw new Error(`Server returned ${res.status}`);
      }
      
      const data = await res.json();
      setAllWorkouts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching workouts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  useEffect(() => {
    const filtered = aggregateWorkoutsToWeeks(allWorkouts, weeks);
    setWeeklyData(filtered);
  }, [allWorkouts, weeks]);

  const handleWeekChange = (newWeeks) => {
    setWeeks(newWeeks);
  };

  if (!userId) {
    return (
      <div className="workout-chart-widget">
        <div className="workout-chart-header">
          <h3>Workout History</h3>
        </div>
        <div className="workout-chart-empty">
          <p>Please log in to view workout history</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="workout-chart-widget">
        <div className="workout-chart-header">
          <h3>Workout History</h3>
        </div>
        <div className="workout-chart-loading">
          <p>Loading workout data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workout-chart-widget">
        <div className="workout-chart-header">
          <h3>Workout History</h3>
        </div>
        <div className="workout-chart-error">
          <p>Error loading workouts</p>
          <button onClick={fetchWorkouts} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-chart-widget">
      <div className="workout-chart-header">
        <h3>Workout History</h3>
        <div className="week-selector">
          <span className="week-label">Weeks:</span>
          {WEEK_OPTIONS.map((w) => (
            <button
              key={w}
              className={`week-btn ${weeks === w ? "active" : ""}`}
              onClick={() => handleWeekChange(w)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {weeklyData.length === 0 ? (
        <div className="workout-chart-empty">
          <p>No workouts recorded in the last {weeks} weeks</p>
        </div>
      ) : (
        <div className="workout-chart-content">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e5e7eb" }}
                formatter={(value) => [`${value} workout${value !== 1 ? 's' : ''}`, 'Count']}
              />
              <Bar
                dataKey="workouts"
                fill="#4f46e5"
                name="Workouts"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="workout-chart-summary">
            Total: {weeklyData.reduce((sum, d) => sum + d.workouts, 0)} workouts in {weeklyData.length} weeks
          </p>
        </div>
      )}
    </div>
  );
}
