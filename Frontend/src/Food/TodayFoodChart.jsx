import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./TodayFoodChart.css";

const API_BASE = "https://www.ahful.app/api/AHFULfoods";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

export function TodayFoodChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCalories, setTotalCalories] = useState(0);
  const user = useSelector((state) => state.auth.user);

  const getUserId = () => {
    if (user?._id) return user._id;
    try {
      const stored = JSON.parse(localStorage.getItem("user_data"));
      return stored?._id || null;
    } catch {
      return null;
    }
  };
  const userId = getUserId();

  useEffect(() => {
    fetchTodayFood();
  }, [userId]);

  function fetchTodayFood() {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }

      fetch(`${API_BASE}/${userId}`, {credentials: "include"})
        .then(async (res) => {
          if (!res.ok) return [];
          return res.json();
        })
        .then((foods) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const todayStart = Math.floor(today.getTime() / 1000);
          const tomorrowStart = Math.floor(tomorrow.getTime() / 1000);

          const todayFoods = foods.filter((food) => {
            const foodTime = food.time || 0;
            return foodTime >= todayStart && foodTime < tomorrowStart;
          });

          const meals = ["Breakfast", "Lunch", "Dinner", "Snack"];
          const chartData = meals
            .map((meal) => {
              const mealFoods = todayFoods.filter((f) => f.type === meal);
              const calories = mealFoods.reduce(
                (sum, f) => sum + f.calsPerServing * f.servings,
                0
              );
              return { name: meal, calories };
            })
            .filter((d) => d.calories > 0);

          setData(chartData);
          setTotalCalories(chartData.reduce((sum, d) => sum + d.calories, 0));
        })
        .catch((err) => {
          console.error("Failed to load food data:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="today-food-chart"><p>Loading...</p></div>;
  }

  if (data.length === 0) {
    return (
      <div className="today-food-chart">
        <h3>Today's Calorie Breakdown</h3>
        <p className="empty-message">No foods logged today</p>
        <p className="total-calories">0 cal</p>
      </div>
    );
  }

  const legendData = data.map((item) => {
    const percent = totalCalories > 0 ? Math.round((item.calories / totalCalories) * 100) : 0;
    return {
      ...item,
      percent
    };
  });

  return (
    <div className="today-food-chart">
      <h3>Today's Calorie Breakdown</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="calories"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={64}
            labelLine={false}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} cal`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="today-food-legend">
        {legendData.map((item, index) => (
          <div className="today-food-legend-item" key={item.name}>
            <span
              className="today-food-legend-dot"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
              aria-hidden="true"
            />
            <span className="today-food-legend-text">
              {item.name}: {item.percent}% ({item.calories} cal)
            </span>
          </div>
        ))}
      </div>
      <p className="total-calories">{totalCalories} cal total</p>
    </div>
  );
}
