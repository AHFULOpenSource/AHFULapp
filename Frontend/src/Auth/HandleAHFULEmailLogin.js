import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";
import { setLoggingIn } from "./AuthSlice.js";
import { completeBackendLogin } from "./CompleteBackendLogin.js";

/**
 * Login with email and password using Firebase Authentication.
 * @param {Function} navigate
 * @param {Function} dispatch
 * @param {string} email
 * @param {string} password
 */
export async function HandleAHFULEmailLogin(navigate, dispatch, email, password) {
  dispatch(setLoggingIn(true));
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await completeBackendLogin(userCredential.user, dispatch, navigate);
    return userCredential.user;
  } catch (error) {
    console.error("Error during HandleAHFULEmailLogin login:", error);
    throw error;
  } finally {
    dispatch(setLoggingIn(false));
  }
}