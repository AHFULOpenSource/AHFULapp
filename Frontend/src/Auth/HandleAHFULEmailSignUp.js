import { auth } from "../firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setLoggingIn } from "./AuthSlice.js";
import { completeBackendLogin } from "./CompleteBackendLogin.js";

/**
 * Creates a user with provided email and password and registers their backend session.
 * @param {Function} navigate
 * @param {Function} dispatch
 * @param {string} email
 * @param {string} password
 */
export const HandleAHFULEmailSignUp = async (navigate, dispatch, email, password) => {
  dispatch(setLoggingIn(true));
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await completeBackendLogin(userCredential.user, dispatch, navigate);
    return userCredential.user;
  } catch (error) {
    console.error("Error during HandleAHFULEmailSignUp Sign up:", error);
    throw error;
  } finally {
    dispatch(setLoggingIn(false));
  }
};