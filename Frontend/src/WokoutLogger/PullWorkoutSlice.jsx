import { createSlice } from "@reduxjs/toolkit";
const pullWorkoutSlice = createSlice({
  name: "pullWorkout",
  initialState: {
    workouts: [],
    error: null,
  },
  reducers: {
    setWorkouts: (state, action) => { 
      state.workouts = action.payload;
    },
    addWorkout: (state, action) => {
      state.workouts.push(action.payload);
    },
    updateWorkout: (state, action) => {
      const index = state.workouts.findIndex(w => w._id === action.payload._id);
      if (index !== -1) {
        state.workouts[index] = action.payload;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
});
export const { setWorkouts, addWorkout, updateWorkout, setError } = pullWorkoutSlice.actions;
export default pullWorkoutSlice.reducer;