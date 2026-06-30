//@author Jonathan Torrence

import React, {useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./FoodLog.css";
import "../siteStyles.css";
import { toggleFoodFavorite } from "../QueryFunctions.js";

const API_BASE = "https://www.ahful.app/api/AHFULfoods";

export function FoodLog() {
    const user = useSelector((state) => state.auth.user);

    const toLocalDateInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const getWeekStart = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay());
        return d;
    };

    const getWeekEnd = (date) => {
        const end = new Date(getWeekStart(date));
        end.setDate(end.getDate() + 7);
        return end;
    };

    // Get userId from Redux or fall back to localStorage
    const getUserId = () => {
        if (user?._id) return user._id;
        try {
            const stored = JSON.parse(localStorage.getItem("user_data"));
            return stored?._id || null;
        } catch { return null; }
    };
    const userId = getUserId();

    const [foods, setFoods] = useState([]);
    const [foodName, setFoodName] = useState("");
    const [calories, setCalories] = useState("");
    const [servings, setServings] = useState("1");
    const [mealType, setMealType] = useState("Lunch");
    const [errors, setErrors] = useState("");
    const [timePeriod, setTimePeriod] = useState("daily");
    const [selectedDate, setSelectedDate] = useState(toLocalDateInput(new Date()));
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // USDA Food Search States
    const [usda_searchInput, setUsda_searchInput] = useState("");
    const [usda_searchResults, setUsda_searchResults] = useState([]);
    const [usda_searching, setUsda_searching] = useState(false);
    const [showUsda_dropdown, setShowUsda_dropdown] = useState(false);
    const [usda_searchTimeout, setUsda_searchTimeout] = useState(null);

    // Normalize backend food document to the shape the UI expects
    const normalizeFood = (doc) => ({
        id: doc._id,
        name: doc.name,
        calories: doc.calsPerServing,
        servings: doc.servings,
        totalCalories: doc.calsPerServing * doc.servings,
        mealType: doc.type,
        loggedAt: new Date(doc.time * 1000),
        timestamp: new Date(doc.time * 1000).toLocaleTimeString(),
        favorite: doc.favorite || false
    });

    // USDA Food Search - with debouncing
    const searchUSDAFoods = async (query) => {
        if (!query || query.length < 2) {
            setUsda_searchResults([]);
            setShowUsda_dropdown(false);
            return;
        }

        setUsda_searching(true);
        try {
            const res = await fetch(`${API_BASE}/search/usda?q=${encodeURIComponent(query)}&limit=8`, {credentials: "include"});
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("USDA Search error:", errData.error);
                setUsda_searchResults([]);
                return;
            }

            const data = await res.json();
            setUsda_searchResults(data.foods || []);
            setShowUsda_dropdown(true);
        } catch (err) {
            console.error("Network error searching USDA:", err);
            setUsda_searchResults([]);
        } finally {
            setUsda_searching(false);
        }
    };

    // Handle USDA Search Input with Debouncing
    const handleUsda_searchInputChange = (value) => {
        setUsda_searchInput(value);

        // Clear previous timeout
        if (usda_searchTimeout) {
            clearTimeout(usda_searchTimeout);
        }

        // Set new timeout to debounce search
        const newTimeout = setTimeout(() => {
            searchUSDAFoods(value);
        }, 500);

        setUsda_searchTimeout(newTimeout);
    };

    // Select a USDA Food and populate the form
    const selectUSDAFood = (food) => {
        setFoodName(food.name || "");

        // If calories are available, use them; otherwise leave blank
        if (food.calories !== null && food.calories !== undefined) {
            setCalories(Math.round(food.calories).toString());
        } else {
            setCalories("");
        }

        setServings("1");
        setUsda_searchInput("");
        setUsda_searchResults([]);
        setShowUsda_dropdown(false);
    };

    // Fetch foods for the logged-in user on mount
    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        fetch(`${API_BASE}/${userId}`, {credentials: "include"})
            .then(async (res) => {
                if (res.status === 404) {
                    return [];
                }

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || res.statusText || "Failed to load foods");
                }

                return res.json();
            })
            .then((data) => {
                const list = Array.isArray(data) ? data : [];
                setFoods(list.map(normalizeFood));
            })
            .catch((err) => {
                setFoods([]);
                console.error("Failed to load foods:", err);
            })
            .finally(() => setLoading(false));
    }, [userId]);

    const selectedDateObj = new Date(`${selectedDate}T00:00:00`);

    const foodsInPeriod = foods.filter((food) => {
        const foodDate = food.loggedAt;

        if (timePeriod === "daily") {
            const selectedStart = startOfDay(selectedDateObj);
            const selectedEnd = new Date(selectedStart);
            selectedEnd.setDate(selectedEnd.getDate() + 1);
            return foodDate >= selectedStart && foodDate < selectedEnd;
        }

        if (timePeriod === "weekly") {
            const weekStart = getWeekStart(selectedDateObj);
            const weekEnd = getWeekEnd(selectedDateObj);
            return foodDate >= weekStart && foodDate < weekEnd;
        }

        if (timePeriod === "monthly") {
            return (
                foodDate.getFullYear() === selectedDateObj.getFullYear() &&
                foodDate.getMonth() === selectedDateObj.getMonth()
            );
        }

        if (timePeriod === "yearly") {
            return foodDate.getFullYear() === selectedDateObj.getFullYear();
        }

        return true;
    });

    // Apply search only within the selected date range
    const filteredFoods = foodsInPeriod.filter((food) =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!showFavoritesOnly || food.favorite)
    );

    const addFood = async (e) => {
        e.preventDefault();
        setErrors("");

        if(!foodName.trim()) {
            setErrors("Please enter a food name");
            return;
        }

        if (!calories.trim() || parseInt(calories) <= 0) {
            setErrors("Please enter a valid calorie amount");
            return;
        }

        if (parseInt(servings) <= 0) {
            setErrors("Please enter a valid number of servings");
            return;
        }

        // If editing, call update instead
        if (editingId) {
            await saveEdit();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/create`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    name: foodName,
                    calsPerServing: parseInt(calories),
                    servings: parseInt(servings),
                    type: mealType,
                    time: Math.trunc(Date.now() / 1000)
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setErrors(errData.error || "Failed to add food");
                return;
            }

            const result = await res.json();
            // Fetch the newly created food from the server to get the full document
            const newRes = await fetch(`${API_BASE}/id/${result.food_id}`, {credentials: "include"});
            if (newRes.ok) {
                const newDoc = await newRes.json();
                setFoods((prev) => [...prev, normalizeFood(newDoc)]);
            }
        } catch (err) {
            setErrors("Network error — could not add food");
            console.error(err);
            return;
        }

        setFoodName("");
        setCalories("");
        setServings("1");
        setMealType("Lunch");
    };

    const removeFood = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/delete/${id}`, { method: "DELETE" }, {credentials: "include"});
            if (!res.ok) {
                console.error("Failed to delete food");
                return;
            }
            setFoods(foods.filter(food => food.id !== id));
        } catch (err) {
            console.error("Network error — could not delete food", err);
        }
    };

    const toggleFavorite = async (id) => {
        console.log("Toggling favorite for food ID:", id);
        const { data, error } = await toggleFoodFavorite(id);
        console.log("Toggle response - data:", data, "error:", error);
        if (!error && data) {
            console.log("Updated favorite status:", data.favorite);
            setFoods((prev) =>
                prev.map((food) =>
                    food.id === id ? { ...food, favorite: data.favorite } : food
                )
            );
        } else {
            console.error("Failed to toggle favorite:", error);
        }
    };

    const [editingId, setEditingId] = useState(null);
    const [editFood, setEditFood] = useState(null);

    const startEdit = (food) => {
        setEditingId(food.id);
        setEditFood({...food});
        setFoodName(food.name);
        setCalories(String(food.calories));
        setServings(String(food.servings));
        setMealType(food.mealType);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditFood(null);
        setFoodName("");
        setCalories("");
        setServings("1");
        setMealType("Lunch");
    };

    const saveEdit = async () => {
        try {
            const res = await fetch(`${API_BASE}/update/${editingId}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: foodName,
                    calsPerServing: parseInt(calories),
                    servings: parseInt(servings),
                    type: mealType,
                    time: Math.trunc(Date.now() / 1000)
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setErrors(errData.error || "Failed to update food");
                return;
            }

            const updated = await res.json();
            setFoods((prev) => prev.map((f) => f.id === editingId ? normalizeFood(updated) : f));
        } catch (err) {
            setErrors("Network error — could not update food");
            console.error(err);
            return;
        }
        cancelEdit();
    };

    const periodTotalCalories = filteredFoods.reduce((sum, food) => sum + food.totalCalories, 0);

    const formatLongDate = (date) =>
        date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric"
        });

    const rangeLabel = (() => {
        if (timePeriod === "daily") {
            return formatLongDate(selectedDateObj);
        }

        if (timePeriod === "weekly") {
            const start = getWeekStart(selectedDateObj);
            const endInclusive = new Date(getWeekEnd(selectedDateObj));
            endInclusive.setDate(endInclusive.getDate() - 1);
            return `${start.toLocaleDateString()} - ${endInclusive.toLocaleDateString()}`;
        }

        if (timePeriod === "monthly") {
            return selectedDateObj.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric"
            });
        }

        return `${selectedDateObj.getFullYear()}`;
    })();

    const shiftSelectedDate = (days) => {
        const shifted = new Date(selectedDateObj);
        shifted.setDate(shifted.getDate() + days);
        setSelectedDate(toLocalDateInput(shifted));
    };

    // Group foods by meal type
    const groupedFoods = () => {
        const meals = ["Breakfast", "Lunch", "Dinner", "Snack"];
        const grouped = {};

        meals.forEach(meal => {
            grouped[meal] = filteredFoods.filter(food => food.mealType === meal);
        });

        return grouped;
    };

    const mealGroups = groupedFoods();
    return (
        <div className="food-log-container">
            <h1>Food Log</h1>

            <div className="food-log-content">
                {/* Add Food Form */}
                <div className="add-food-section">
                    <h2>Log New Food</h2>
                    <form onSubmit={addFood} className="food-form">
                        {/* USDA Food Search */}
                        <div className="form-group usda-search-container">
                            <label htmlFor="usdaSearch">Search USDA Database (Optional)</label>
                            <div className="usda-search-wrapper">
                                <input
                                    id="usdaSearch"
                                    type="text"
                                    placeholder="Search USDA foods... (e.g., 'Apple', 'Chicken Breast')"
                                    value={usda_searchInput}
                                    onChange={(e) => handleUsda_searchInputChange(e.target.value)}
                                    onFocus={() => usda_searchResults.length > 0 && setShowUsda_dropdown(true)}
                                    className="usda-search-input"
                                />
                                {usda_searching && <span className="search-spinner">🔍 Searching...</span>}
                            </div>

                            {/* USDA Search Results Dropdown */}
                            {showUsda_dropdown && usda_searchResults.length > 0 && (
                                <ul className="usda-dropdown-list">
                                    {usda_searchResults.map((food, idx) => (
                                        <li key={idx} className="usda-dropdown-item" onClick={() => selectUSDAFood(food)}>
                                            <div className="food-item-name">{food.name}</div>
                                            {food.calories !== null && (
                                                <div className="food-item-detail">
                                                    {Math.round(food.calories)} cal/serving
                                                    {food.servingSize && ` (${food.servingSize}${food.servingUnit || ""})`}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="usda-info-text">💡 Search above to auto-populate food info from USDA FoodData Central, or enter manually below</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="foodName"> Food Name </label>
                            <input
                                id="foodName"
                                type="text"
                                placeholder="e.g., Apple, Chicken Breast"
                                value={foodName}
                                onChange={(e) => setFoodName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="calories"> Calories per Serving </label>
                            <input
                                id="calories"
                                type="number"
                                placeholder="e.g., 95"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="servings"> Servings </label>
                            <input
                                id="servings"
                                type="number"
                                placeholder="1"
                                min="1"
                                value={servings}
                                onChange={(e) => setServings(e.target.value)}
                            />
                        </div>
                        {errors && <div className="error-message">{errors}</div>}
                        <div className="form-group">
                            <label htmlFor="mealType">Meal Category</label>
                            <select
                                id="mealType"
                                value={mealType}
                                onChange={(e) => setMealType(e.target.value)}
                                className="meal-select"
                                >
                                <option value="Breakfast">Breakfast</option>
                                <option value="Lunch">Lunch</option>
                                <option value="Dinner">Dinner</option>
                                <option value="Snack">Snack</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-add">
                            {editingId ? "Update Food" : "Add Food"}
                        </button>
                        {editingId && <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancel</button>}
                    </form>
                </div>



               {/* Time Period Selector */}
               <div className="time-period-selector">
                <button
                    className={`period-btn ${timePeriod === 'daily' ? 'active' : ''}`}
                    onClick={() => setTimePeriod('daily')}
                >
                    Daily
                </button>
                <button
                    className={`period-btn ${timePeriod === 'weekly' ? 'active' : ''}`}
                    onClick={() => setTimePeriod('weekly')}
                >
                    Weekly
                </button>
                <button
                    className={`period-btn ${timePeriod === 'monthly' ? 'active' : ''}`}
                    onClick={() => setTimePeriod('monthly')}
                >
                    Monthly
                </button>
                <button
                    className={`period-btn ${timePeriod === 'yearly' ? 'active' : ''}`}
                    onClick={() => setTimePeriod('yearly')}
                >
                    Yearly
                </button>
                <button
                    className={`favorite-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    title="Show favorites only"
                >
                    {showFavoritesOnly ? '⭐ Favorites' : '☆ All'}
                </button>
               </div>

                <div className="date-navigation">
                    <button
                        className="period-btn"
                        type="button"
                        onClick={() => shiftSelectedDate(-1)}
                        aria-label="Previous day"
                    >
                        Prev Day
                    </button>
                    <input
                        type="date"
                        className="date-input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <button
                        className="period-btn"
                        type="button"
                        onClick={() => shiftSelectedDate(1)}
                        aria-label="Next day"
                    >
                        Next Day
                    </button>
                </div>

                {/* Nutrition Summary */}
                <div className="daily-summary">
                    <h2>
                        {timePeriod === 'daily' && 'Daily Summary'}
                        {timePeriod === 'weekly' && 'Weekly Summary'}
                        {timePeriod === 'monthly' && 'Monthly Summary'}
                        {timePeriod === 'yearly' && 'Yearly Summary'}
                    </h2>

                    <div className="calorie-totals">
                      <div className="total-display">
                        <span className="label">Total Calories:</span>
                        <span className="value">
                                                        {periodTotalCalories}
                        </span>
                      </div>
                    </div>

                    </div>
                    <div className="food-count">
                        <span className="label">Items Logged:</span>
                                                <span className="value">{filteredFoods.length}</span>
                    </div>
                </div>



        {/* Logged Foods List */}
        <div className="logged-foods-section">
            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search foods..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>
            <h2>{rangeLabel} Logged Foods</h2>
            {filteredFoods.length === 0 ? (
                <p className="empty-message">No foods logged for this date range yet. Try another day or add a food item.</p>
            ) : (
                <div className="foods-list">
                    {["Breakfast", "Lunch", "Dinner", "Snack"].map((meal) => (
                        mealGroups[meal].length > 0 && (
                        <div key={meal} className="meal-section">
                            <h3 className="meal-header">{meal}</h3>
                            <div className="meal-items">
                            {mealGroups[meal].map((food) => (
                                <div key={food.id} className="food-item">
                                    <div className="food-details">
                                        <h3>{food.name}</h3>
                                        <p className="food-meta">
                                            {food.servings} serving{food.servings > 1 ? "s" : ""} x {food.calories} cal/serving
                                        </p>
                                    </div>
                            <div className="food-info">
                                <span className="calories-badge">{food.totalCalories} cal</span>
                                <span className="time-badge">{food.timestamp}</span>
                            </div>
                            <button
                                className="btn-favorite"
                                onClick={() => toggleFavorite(food.id)}
                                title={food.favorite ? "Remove from favorites" : "Add to favorites"}
                            >
                                {food.favorite ? '⭐' : '☆'}
                            </button>
                            <button
                                className="btn-edit"
                                onClick={() => startEdit(food)}
                            >
                                Edit
                            </button>
                            <button
                                className="btn-remove"
                                onClick={() => removeFood(food.id)}
                            >
                                X
                            </button>
                        </div>
                    ))}
                </div>
            </div>
                        )
                    ))}
                </div>
            )}
        </div>
        </div>
    );
}

