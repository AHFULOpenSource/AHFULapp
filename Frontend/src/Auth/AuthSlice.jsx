import { createSlice } from "@reduxjs/toolkit";
import { HandleAHFULSignOut } from "./HandleAHFULLogout.js";

const authSlice = createSlice({
  //Namespace for the slice, used in action types
  name: "auth",

  //Define the initial state of the slice
  initialState: {
    isAuthenticated: false,
    user: null,
  },
  //Define reducers or Functions that handle state changes
  reducers: {

    // Redux Login Reducer: Sets isAuthenticated to true and stores user data in the state
    authLogin: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },

    // Redux Logout Reducer: Resets isAuthenticated to false and clears user data from the state
    authLogout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      HandleAHFULSignOut();
    },
  },
});
  
// Export the reducers as constant actions.
export const { authLogin, authLogout } = authSlice.actions;

//Export the reducer function to be used in the Redux store
export default authSlice.reducer;