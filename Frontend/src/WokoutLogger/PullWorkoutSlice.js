// PullWorkoutSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const pullWorkouts = createAsyncThunk(
  "pullWorkout/pullWorkouts",
  async (_, { rejectWithValue }) => {
    
    try {
      const res = await fetch(`http://localhost:5000/api/AHFULworkouts/userid`, {
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
      return data.map((w) => ({
        _id: w._id,
        startTime: w.startTime,
        endTime: w.endTime,
        title: w.title,
      }));
    } catch (err) {
    console.error("pullWorkouts RAW ERROR:", err); // <- check this in browser console
    return rejectWithValue(err.message || `Unhandled error: ${String(err)}`);
    }
  }
);

const pullWorkoutSlice = createSlice({
  name: "pullWorkout",
  initialState: {
    workouts: [],
    loading: false,
    error: null,
    hasFetched: false, // tracks whether we've attempted a fetch this session
  },
  reducers: {
    addWorkout: (state, action) => {
      state.workouts.push(action.payload);
    },
    updateWorkout: (state, action) => {
      const index = state.workouts.findIndex((w) => w._id === action.payload._id);
      if (index !== -1) {
        state.workouts[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(pullWorkouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(pullWorkouts.fulfilled, (state, action) => {
        state.workouts = action.payload;
        state.loading = false;
        state.hasFetched = true;
      })
      .addCase(pullWorkouts.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
        state.hasFetched = true;
      });
  },
});

export const { addWorkout, updateWorkout } = pullWorkoutSlice.actions;

// Selectors — keeps components from reaching into state.pullWorkout.* directly
export const selectWorkouts = (state) => state.pullWorkout.workouts;
export const selectWorkoutsLoading = (state) => state.pullWorkout.loading;
export const selectWorkoutsError = (state) => state.pullWorkout.error;

export default pullWorkoutSlice.reducer;