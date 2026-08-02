// PullUserFoodSlice.js
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";

export const pullUserFood = createAsyncThunk(
  "pullUserFood/pullUserFood",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`http://localhost:5000/api/AHFULfoods/userid`, {
        method: "GET",
        credentials: "include",
      });

      // Handle empty or not found responses for new users
      if (res.status === 404 || res.status === 204) {
        return [];
      }

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        return rejectWithValue(
          `Server returned ${res.status} ${res.statusText} ${bodyText}`
        );
      }

      const data = await res.json();

      // Sort most recent first — no cap, caches the full list
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a, b) => (b.time || 0) - (a.time || 0)
      );

      return sorted.map((e) => ({
        _id: e._id,
        name: e.name,
        calories: e.calories,
        servings: e.servings,
        type: e.type,
        time: e.time,
        carbs: e.carbs,
        protein: e.protein,
        fat: e.fat,
        fdcID: e.fdcId,
        servingSize: e.servingSize ?? 0,
        servingUnit: e.servingUnit ?? "",
        favorite: e.favorite ?? false,
      }));
    } catch (err) {
      console.error("pullUserFood RAW ERROR:", err);
      return rejectWithValue(err.message || `Unhandled error: ${String(err)}`);
    }
  }
);

const pullUserFoodSlice = createSlice({
  name: "pullUserFood",
  initialState: {
    food: [],
    loading: false,
    error: null,
    hasFetched: false, // tracks whether we've attempted a fetch this session
  },
  reducers:{
    addFood: (state, action) => {
      state.food.push(action.payload);
    },
    updateSliceFood: (state, action) => {
      const index = state.food.findIndex((f) => f._id === action.payload._id);
      if (index !== -1) {
        state.food[index] = action.payload;
      }
    },
    removeFood: (state, action) => {
      state.food = state.food.filter((f) => f._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(pullUserFood.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(pullUserFood.fulfilled, (state, action) => {
        state.food = action.payload;
        state.loading = false;
        state.hasFetched = true;
      })
      .addCase(pullUserFood.rejected, (state, action) => {
        state.error = action.payload || "No food found";
        state.loading = false;
        state.hasFetched = true;
      });
  },
});

export const { addFood, updateFood, removeFood } = pullUserFoodSlice.actions;

// Selectors
export const selectFood = (state) => state.pullUserFood.food;
export const selectFoodLoading = (state) => state.pullUserFood.loading;
export const selectFoodError = (state) => state.pullUserFood.error;

// Derived/normalized selector — computes display-ready fields (including Date
// objects) on read, so the Redux store itself only ever holds serializable data.
// createSelector memoizes: it only recomputes when selectFood's result actually changes.
export const selectNormalizedFood = createSelector([selectFood], (food) =>
  food.map((doc) => ({
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
    servingUnit: doc.servingUnit,
  }))
);

export default pullUserFoodSlice.reducer;