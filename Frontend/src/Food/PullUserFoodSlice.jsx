import { createSlice } from "@reduxjs/toolkit";
const pullUserFoodSlice = createSlice({
  name: "pullUserFood",
  initialState: {
    food: [],
    error: null,
  },
  reducers: {
    setFood: (state, action) => { 
      state.food = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
});
export const { setFood, setError } = pullUserFoodSlice.actions;
export default pullUserFoodSlice.reducer;
