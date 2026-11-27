import { createSlice, createAction } from "@reduxjs/toolkit";

export const resetAppSession = createAction("auth/resetAppSession");

export const authInitialState = {
  status: "checking", // "checking" | "authenticated" | "unverified" | "unauthenticated"
  expiresAt: null, // Unix epoch seconds from backend
  sessionNotice: null,
  isLoggingIn: false,
};

export const AuthSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    setAuthChecking: (state) => {
      state.status = "checking";
    },
    setAuthenticated: (state, action) => {
      state.status = "authenticated";
      state.expiresAt = action.payload?.expiresAt ?? null;
      state.sessionNotice = null;
    },
    setUnverified: (state, action) => {
      state.status = "unverified";
      state.expiresAt = action.payload?.expiresAt ?? null;
      state.sessionNotice = null;
    },
    setUnauthenticated: (state, action) => {
      state.status = "unauthenticated";
      state.expiresAt = null;
      if (action.payload && "sessionNotice" in action.payload) {
        state.sessionNotice = action.payload.sessionNotice;
      }
    },
    setLoggingIn: (state, action) => {
      state.isLoggingIn = Boolean(action.payload);
    },
    clearSessionNotice: (state) => {
      state.sessionNotice = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAppSession, (_state, action) => ({
      ...authInitialState,
      status: "unauthenticated",
      sessionNotice: action.payload?.sessionNotice ?? null,
    }));
  },
});

export const {
  setAuthChecking,
  setAuthenticated,
  setUnverified,
  setUnauthenticated,
  setLoggingIn,
  clearSessionNotice,
} = AuthSlice.actions;

export const selectAuthStatus = (state) => state.auth.status;
export const selectSessionExpiresAt = (state) => state.auth.expiresAt;
export const selectSessionNotice = (state) => state.auth.sessionNotice;
export const selectIsLoggingIn = (state) => state.auth.isLoggingIn;

export default AuthSlice.reducer;
