import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.js";

export async function HandleAHFULPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    // Password reset email sent!
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
  }
}