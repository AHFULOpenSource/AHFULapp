// PullUserFoodSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

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
        fdcID: e.fdcID,
        servingSize: e.servingSize ?? 0,
        servingUnit: e.servingUnit ?? "",
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
  reducers: {},
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

// Selectors
export const selectFood = (state) => state.pullUserFood.food;
export const selectFoodLoading = (state) => state.pullUserFood.loading;
export const selectFoodError = (state) => state.pullUserFood.error;

export default pullUserFoodSlice.reducer;