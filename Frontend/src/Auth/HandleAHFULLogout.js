import { auth } from "../firebase.js";
import { signOut } from "firebase/auth";
import { store } from "../store.jsx";
import { clearSocialWall } from "../SocialWall/SocialWallSlice.js";
import { resetAppSession } from "./AuthSlice.js";

/**
 * Handles the logout process for AHFUL users. This function performs the following steps:
 * 1. Immediately resets Redux session/user caches so protected routes unmount and stop polling.
 * 2. Sends a POST request to the backend logout endpoint to invalidate the session/cookies.
 * 3. Clears cached Social Wall messages from Redux.
 * 4. Signs out the user from Firebase authentication.
 */
export async function HandleAHFULSignOut({ sessionNotice = null } = {}) {
  const backendPOSTURL = `http://localhost:5000/api/AHFULauth/logout`;

  // Synchronously clear UI session & cached user slices first
  store.dispatch(clearSocialWall());
  store.dispatch(resetAppSession({ sessionNotice }));

  try {
    await fetch(backendPOSTURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      credentials: "include",
    });
  } catch (error) {
    console.error("Backend logout error:", error);
  }

  try {
    await signOut(auth);
  } catch (error) {
    console.error("👻 Logout Error:, ", error);
  }
}