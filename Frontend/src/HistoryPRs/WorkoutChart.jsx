import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import "./ExploreWorkouts.css";
import { pullWorkouts } from "../WokoutLogger/PullWorkoutSlice.js";
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

export function WorkoutChart({ defaultWeeks = 6, workouts: propWorkouts = null }) {
  const dispatch = useDispatch();
  const [weeks, setWeeks] = useState(defaultWeeks);
  const [fetchError, setFetchError] = useState(null);

  const reduxWorkouts = useSelector((state) => state.pullWorkout?.workouts);
  const reduxLoading = useSelector((state) => state.pullWorkout?.loading);
  const userId = useSelector((state) => state.setting?.user_id);

  // Use props if provided, otherwise Redux store
  const allWorkouts = useMemo(() => {
    if (Array.isArray(propWorkouts)) return propWorkouts;
    if (Array.isArray(reduxWorkouts)) return reduxWorkouts;
    return [];
  }, [propWorkouts, reduxWorkouts]);

  // If Redux has no workouts yet, dispatch pullWorkouts()
  useEffect(() => {
    if (!propWorkouts && (!reduxWorkouts || reduxWorkouts.length === 0)) {
      dispatch(pullWorkouts());
    }
  }, [dispatch, propWorkouts, reduxWorkouts]);

  // Fallback direct fetch if requested
  const handleRetry = useCallback(async () => {
    try {
      setFetchError(null);
      await dispatch(pullWorkouts()).unwrap();
    } catch (err) {
      setFetchError(err?.message || "Failed to load workouts");
    }
  }, [dispatch]);

  const weeklyData = useMemo(() => {
    return aggregateWorkoutsToWeeks(allWorkouts, weeks);
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

  const isLoading = reduxLoading && allWorkouts.length === 0;

  if (isLoading) {
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

  if (fetchError) {
    return (
      <div className="workout-chart-widget">
        <div className="workout-chart-header">
          <h3>Workout History</h3>
        </div>
        <div className="workout-chart-error">
          <p>Error loading workouts</p>
          <button onClick={handleRetry} className="retry-btn">Retry</button>
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
