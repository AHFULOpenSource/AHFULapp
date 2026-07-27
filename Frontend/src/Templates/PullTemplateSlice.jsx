import { createSlice } from "@reduxjs/toolkit";
const pullTemplateSlice = createSlice({
  name: "pullTemplate",
  initialState: {
    templates: [],
    error: null,
  },
  reducers: {
    setTemplates: (state, action) => { 
      state.templates = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
});
export const { setTemplates, setError } = pullTemplateSlice.actions;
export default pullTemplateSlice.reducer;