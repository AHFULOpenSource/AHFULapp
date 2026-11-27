import { auth } from "../firebase.js";
import { signOut } from "firebase/auth";
import { store } from "../store.jsx";
import { clearSocialWall } from "../SocialWall/SocialWallSlice.js";

/**
 * Handles the logout process for AHFUL users. This function performs the following steps:
 * 1. Sends a POST request to the backend logout endpoint to invalidate the session/cookie.
 * 2. Clears cached Social Wall messages from Redux.
 * 3. Signs out the user from Firebase authentication.
 */
export async function HandleAHFULSignOut() {
  // Backend logout endpoint
  const backendPOSTURL = `http://localhost:5000/api/AHFULauth/logout`;

  try {
    // Notify backend to invalidate the session/cookie
    const backendResponse = await fetch(backendPOSTURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {},
      credentials: "include",
    });

    // Clear Social Wall cache on logout
    store.dispatch(clearSocialWall());

    // Sign out of Firebase auth as well
    await signOut(auth);

    // console.log("AHFUL Logout Completed successfully.");
  } catch (error) {
    //Catch Spooky Errors that should never occur because you shouldnt log out before login
    console.error("👻 Logout Error:, ", error);
  }
}