import { auth, firebaseAHFULgoogleProvider } from "../firebase.js";
import { signInWithPopup } from "firebase/auth";
import { setLoggingIn } from "./AuthSlice.js";
import { completeBackendLogin } from "./CompleteBackendLogin.js";

export async function HandleAHFULGoogleLogin(navigate, dispatch) {
  dispatch(setLoggingIn(true));
  try {
    const popupResponse = await signInWithPopup(auth, firebaseAHFULgoogleProvider);
    await completeBackendLogin(popupResponse.user, dispatch, navigate);
    return popupResponse.user;
  } catch (error) {
    console.error("Error during Google sign-in:", error.code, error.message);
    throw error;
  } finally {
    dispatch(setLoggingIn(false));
  }
}