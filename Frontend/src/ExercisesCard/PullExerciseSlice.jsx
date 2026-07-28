import { createSlice } from "@reduxjs/toolkit";
const pullExerciseSlice = createSlice({
  name: "pullExercise",
  initialState: {
    exercises: [],
    error: null,
  },
  reducers: {
    setExercises: (state, action) => { 
      state.exercises = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
});
export const { setExercises, setError } = pullExerciseSlice.actions;
export default pullExerciseSlice.reducer;