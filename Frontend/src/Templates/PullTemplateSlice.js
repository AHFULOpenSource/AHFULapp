// PullTemplateSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const pullTemplates = createAsyncThunk(
  "pullTemplate/pullTemplates",
  async (_, { rejectWithValue }) => {
    const res = await fetch(`http://localhost:5000/api/AHFULtemplate/user`, {
      credentials: "include",
    });

    if (!res.ok) {
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch (e) {}
      return rejectWithValue(`Server returned ${res.status} ${res.statusText} ${bodyText}`);
    }

    const data = await res.json();
    return data.map((t) => ({
      _id: t._id,
      title: t.title,
      created_at: t.created_at,
      notes: t.notes,
      exercises: t.exercises,
    }));
  }
);

const pullTemplateSlice = createSlice({
  name: "pullTemplate",
  initialState: {
    templates: [],
    loading: false,
    error: null,
    hasFetched: false, // tracks whether we've attempted a fetch this session
  },
  reducers: {
    setTemplates: (state, action) => {
      state.templates = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(pullTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(pullTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
        state.loading = false;
        state.hasFetched = true;
      })
      .addCase(pullTemplates.rejected, (state, action) => {
        state.error = action.payload || "No templates found";
        state.loading = false;
        state.hasFetched = true;
      });
  },
});

export const { setTemplates, setError } = pullTemplateSlice.actions;
export default pullTemplateSlice.reducer;