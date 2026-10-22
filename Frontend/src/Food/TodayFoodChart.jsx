import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./TodayFoodChart.css";
import { pullUserFood } from "./PullUserFoodSlice.js";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

export function TodayFoodChart() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);

  const cachedFoods = useSelector((state) => state.pullUserFood?.food || []);
  const foodLoading = useSelector((state) => state.pullUserFood?.loading);
  const userId = useSelector((state) => state.setting?.user_id);

  useEffect(() => {
    if (cachedFoods.length === 0) {
      dispatch(pullUserFood());
    }
  }, [dispatch, cachedFoods.length]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStart = Math.floor(today.getTime() / 1000);
    const tomorrowStart = Math.floor(tomorrow.getTime() / 1000);

    const todayFoods = (Array.isArray(cachedFoods) ? cachedFoods : []).filter((food) => {
      const foodTime = food.time || 0;
      return foodTime >= todayStart && foodTime < tomorrowStart;
    });

    const meals = ["Breakfast", "Lunch", "Dinner", "Snack"];
    const chartData = meals
      .map((meal) => {
        const mealFoods = todayFoods.filter((f) => f.type === meal);
        const calories = mealFoods.reduce(
          (sum, f) => sum + (Number(f.calories) || 0) * (Number(f.servings) || 1),
          0
        );
        return { name: meal, calories };
      })
      .filter((d) => d.calories > 0);

    setData(chartData);
    setTotalCalories(chartData.reduce((sum, d) => sum + d.calories, 0));
  }, [cachedFoods]);

  const loading = foodLoading && cachedFoods.length === 0;

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
