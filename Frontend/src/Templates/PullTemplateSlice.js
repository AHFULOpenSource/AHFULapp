// PullTemplateSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const pullTemplates = createAsyncThunk(
  "pullTemplate/pullTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`http://localhost:5000/api/AHFULtemplate/user`, {
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
      return data.map((t) => ({
        _id: t._id,
        title: t.title,
        created_at: t.created_at,
        notes: t.notes,
        exercises: t.exercises,
      }));
    } catch (err) {
      console.error("pullTemplates RAW ERROR:", err);
      return rejectWithValue(err.message || `Unhandled error: ${String(err)}`);
    }
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

// Selectors
export const selectTemplates = (state) => state.pullTemplate.templates;
export const selectTemplatesLoading = (state) => state.pullTemplate.loading;
export const selectTemplatesError = (state) => state.pullTemplate.error;

export const { setTemplates, setError } = pullTemplateSlice.actions;
export default pullTemplateSlice.reducer;