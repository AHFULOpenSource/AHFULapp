// PersonalExerciseSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const pullPersonalExercises = createAsyncThunk(
  "pullExercise/pullPersonalExercises",
  async (_, { rejectWithValue }) => {

    try {
      const res = await fetch(`http://localhost:5000/api/AHFULpersonalEx/userid`, {
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

      // API has returned data in a few different shapes historically — handle all of them
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data && Array.isArray(data.exercises)) list = data.exercises;
      else if (data && Array.isArray(data.data)) list = data.data;

      return list.map((e) => ({
        _id: e._id,
        reps: e.reps,
        sets: e.sets,
        weight: e.weight,
        duration: e.duration,
        distance: e.distance,
        complete: e.complete,
        exercise_id: e.exercise_id,
        user_id: e.user_id,
        workout_id: e.workout_id,
      }));
    } catch (err) {
      console.error("pullPersonalExercises error:", err);
      return rejectWithValue(err.message || "No personal exercises found");
    }
  }
);

const pullExerciseSlice = createSlice({
  name: "pullExercise",
  initialState: {
    personalExercises: [],
    loading: false,
    error: null,
    hasFetched: false, // tracks whether we've attempted a fetch this session
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(pullPersonalExercises.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(pullPersonalExercises.fulfilled, (state, action) => {
        state.personalExercises = action.payload;
        state.loading = false;
        state.hasFetched = true;
      })
      .addCase(pullPersonalExercises.rejected, (state, action) => {
        state.error = action.payload || "No personal exercises found";
        state.loading = false;
        state.hasFetched = true;
      });
  },
});

// Selectors
export const selectPersonalExercises = (state) => state.pullExercise.personalExercises;
export const selectPersonalExercisesLoading = (state) => state.pullExercise.loading;
export const selectPersonalExercisesError = (state) => state.pullExercise.error;

export default pullExerciseSlice.reducer;