//@author Jonathan Torrence & AuGust Ringelstetter
//updated 7/6/2026

import React, {useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./FoodLog.css";
import "../siteStyles.css";
import DateNavigation from "../Calendar/DateNavigation";
import { selectSelectedDateOrToday } from "../Calendar/CalendarSlicer";
import {
  toggleFoodFavorite,
  searchUSDAFoods,
  fetchFoodsByUser,
  createFood,
  fetchFoodById,
  updateFood,
  deleteFood
} from "../Food/QueryFunctions-Food";

export function FoodLog() {
    const user = useSelector((state) => state.auth.user);

    //Define Variables for Date Range Filtering based off of the Current Selected Date on the Calendar.
    const selectedDate = useSelector(selectSelectedDateOrToday);
    //Start of currently selected Day - ROOT DATE OBJECT for Page. 
    const startOfDay = new Date(selectedDate);
    //Start of currently selected Week
    const weekStart = new Date(startOfDay);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    //End of currently selected Week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);


    const [foods, setFoods] = useState([]);
    const [foodName, setFoodName] = useState("");
    const [calories, setCalories] = useState("");
    const [servings, setServings] = useState("1");
    const [mealType, setMealType] = useState("Lunch");
    const [errors, setErrors] = useState("");
    const [timePeriod, setTimePeriod] = useState("daily");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // USDA Food Search States
    const [usda_searchInput, setUsda_searchInput] = useState("");
    const [usda_searchResults, setUsda_searchResults] = useState([]);
    const [usda_searching, setUsda_searching] = useState(false);
    const [showUsda_dropdown, setShowUsda_dropdown] = useState(false);
    const [usda_searchTimeout, setUsda_searchTimeout] = useState(null);
    const [selectedUSDAFood, setSelectedUSDAFood] = useState(null);


    const normalizeFood = (doc) => ({
        id: doc._id,
        name: doc.name,
        calories: doc.calories,
        servings: doc.servings,
        totalCalories: doc.calories * doc.servings,
        mealType: doc.type,
        loggedAt: new Date(doc.time * 1000),
        timestamp: new Date(doc.time * 1000).toLocaleTimeString(),
        favorite: doc.favorite || false,
        carbs: doc.carbs,
        fat: doc.fat,
        protein: doc.protein,
        fdcId: doc.fdcId,
        servingSize: doc.servingSize,
        servingUnit: doc.servingUnit
    });

    // USDA Food Search - with debouncing
    const searchUSDAFoodsWrapper = async (query) => {
        if (!query || query.length < 2) {
            setUsda_searchResults([]);
            setShowUsda_dropdown(false);
            return;
        }

        setUsda_searching(true);
        const { data, error } = await searchUSDAFoods(query);
        if (error) {
            console.error("USDA Search error:", error);
            setUsda_searchResults([]);
        } else {
            setUsda_searchResults(data);
            setShowUsda_dropdown(true);
        }
        setUsda_searching(false);
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
            searchUSDAFoodsWrapper(value);
        }, 500);

        setUsda_searchTimeout(newTimeout);
    };

    // Select a USDA Food and populate the form
    const selectUSDAFood = (food) => {
        setFoodName(food.name || "");
        if (food.calories != null) {
            setCalories(Math.round(food.calories).toString());
        } else {
            setCalories("");
        }
        setSelectedUSDAFood(food);
        setServings("1");
        setUsda_searchInput("");
        setUsda_searchResults([]);
        setShowUsda_dropdown(false);
    };

    // Fetch foods for the logged-in user on mount
    useEffect(() => {
        if (!user._id) return;
        setLoading(true);
        (async () => {
            const { data, error } = await fetchFoodsByUser(user._id);
            if (error) {
                setFoods([]);
                console.error("Failed to load foods:", error);
            } else {
                setFoods(data.map(normalizeFood));
            }
            setLoading(false);
        })();
    }, [user._id]);

    const foodsInPeriod = foods.filter((food) => {
        const foodDate = food.loggedAt;

        if (timePeriod === "daily") {
            const selectedStart = new Date(selectedDate);
            const selectedEnd = new Date(selectedStart);
            selectedEnd.setDate(selectedEnd.getDate() + 1);
            return foodDate >= selectedStart && foodDate < selectedEnd;
        }

        if (timePeriod === "weekly") {
            return foodDate >= weekStart && foodDate < weekEnd;
        }

        if (timePeriod === "monthly") {
            return (
                foodDate.getFullYear() === startOfDay.getFullYear() &&
                foodDate.getMonth() === startOfDay.getMonth()
            );
        }

        if (timePeriod === "yearly") {
            return foodDate.getFullYear() === startOfDay.getFullYear();
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
            const payload = {
                name: foodName,
                calories: parseInt(calories),
                servings: parseInt(servings),
                type: mealType,
                carbs: selectedUSDAFood?.carbs ?? null,
                fat: selectedUSDAFood?.fat ?? null,
                protein: selectedUSDAFood?.protein ?? null,
                fdcId: selectedUSDAFood?.fdcId ?? null,
                servingSize: selectedUSDAFood?.servingSize ?? null,
                servingUnit: selectedUSDAFood?.servingUnit ?? null,
            };

            const { data: createResult, error: createError } = await createFood(payload);
            if (createError) {
                setErrors(createError);
                return;
            }

            const { data: newDoc, error: fetchError } = await fetchFoodById(createResult.food_id);
            if (!fetchError && newDoc) {
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
        const { error } = await deleteFood(id);
        if (error) {
            console.error("Failed to delete food:", error);
            return;
        }
        setFoods(foods.filter(food => food.id !== id));
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
        const payload = {
            name: foodName,
            calories: parseInt(calories),
            servings: parseInt(servings),
            type: mealType,
            carbs: editFood?.carbs ?? null,
            fat: editFood?.fat ?? null,
            protein: editFood?.protein ?? null,
            fdcId: editFood?.fdcId ?? null,
            servingSize: editFood?.servingSize ?? null,
            servingUnit: editFood?.servingUnit ?? null,
        };

        const { data: updated, error } = await updateFood(editingId, payload);
        if (error) {
            setErrors(error);
            return;
        }
        if (updated) {
            setFoods((prev) => prev.map((f) => f.id === editingId ? normalizeFood(updated) : f));
        }
        cancelEdit();
    };

    const periodTotalCalories = filteredFoods.reduce((sum, food) => sum + food.totalCalories, 0);



    const rangeLabel = (() => {

        if (timePeriod === "daily") {
            return startOfDay.toLocaleString('en-US').slice(0,10);
        }

        if (timePeriod === "weekly") {
            const endInclusive = new Date(weekEnd);
            endInclusive.setDate(endInclusive.getDate() - 1);
            
            return `${startOfDay.toLocaleString('en-US')} - ${endInclusive.toLocaleString('en-US')}`;
        }

        if (timePeriod === "monthly") {
            return `${startOfDay.getMonth()}-${startOfDay.getFullYear()}`;
        }

        return `${startOfDay.getFullYear()}`;
    })();

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


                {/* Add Food Form -------------------------------------------- */}
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
                                                    Serving Size: {food.servingSize && ` (${food.servingSize}${food.servingUnit || ""})`} 
                                                    <br />
                                                    {Math.round(food.calories)} calories
                                                    <br />
                                                    {food.carbs != null ? `Carbs: ${food.carbs}g , ` : ""}{food.fat != null ? `Fat: ${food.fat}g , ` : ""}{food.protein != null ? `Protein: ${food.protein}g` : ""}

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



               {/* Time Period Selector -------------------------------------------- */}
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

                <DateNavigation />

                {/* Nutrition Summary -------------------------------------------- */}
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
                                        {(food.carbs != null || food.fat != null || food.protein != null) && (
                                            <p className="food-macros">
                                                {food.carbs != null && <span>Carbs: {food.carbs}g</span>}
                                                {food.fat != null && <span> Fat: {food.fat}g</span>}
                                                {food.protein != null && <span> Protein: {food.protein}g</span>}
                                            </p>
                                        )}
                                        {food.servingSize != null && (
                                            <p className="food-serving">Serving: {food.servingSize}{food.servingUnit || ""}</p>
                                        )}
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
                        </div>))}
                    </div>
                </div>)))}
            </div>)}
        </div>
     </div>
    );
}

