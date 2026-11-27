import { reload, signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import { FetchUserSettings } from "./FetchUserSettings.js";
import {
  resetAppSession,
  setAuthenticated,
  setUnverified,
} from "./AuthSlice.js";
import { completeBackendLogin } from "./CompleteBackendLogin.js";

/**
 * Verifies the active Firebase user against the backend session cookie on startup/refresh.
 * Preserves the current browser route instead of forcing navigation to /Dashboard.
 */
export async function WhoAmI(dispatch, { currentUser } = {}) {
  const firebaseUser = currentUser ?? auth.currentUser;

  if (!firebaseUser) {
    dispatch(resetAppSession());
    return { status: "unauthenticated" };
  }

  try {
    const backendVerificationResponse = await fetch(
      "http://localhost:5000/api/AHFULauth/whoami",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      }
    );

    if (!backendVerificationResponse.ok) {
      dispatch(resetAppSession());
      await signOut(auth).catch(() => {});
      return { status: "unauthenticated" };
    }

    const backendUserData = await backendVerificationResponse.json();
    if (!backendUserData?.backend_authenticated) {
      // Only show an expiry notice when the backend explicitly reports an expired session
      // (never when cookies are simply absent).
      const sessionNotice = backendUserData?.expired
        ? "Your session expired. Please sign in again."
        : null;
      dispatch(resetAppSession({ sessionNotice }));
      await signOut(auth).catch(() => {});
      return { status: "unauthenticated" };
    }

    if (!firebaseUser.emailVerified) {
      await reload(firebaseUser).catch(() => {});
      if (firebaseUser.emailVerified) {
        const refreshedData = await completeBackendLogin(firebaseUser, dispatch, null);
        return {
          status: "authenticated",
          expiresAt: refreshedData?.expires_at ?? null,
        };
      }

      dispatch(setUnverified({ expiresAt: backendUserData.expires_at ?? null }));
      return {
        status: "unverified",
        expiresAt: backendUserData.expires_at ?? null,
      };
    }

    await FetchUserSettings(dispatch);
    dispatch(setAuthenticated({ expiresAt: backendUserData.expires_at ?? null }));
    return {
      status: "authenticated",
      expiresAt: backendUserData.expires_at ?? null,
    };
  } catch (err) {
    console.error("WhoAmI Failed and Caught this Error:", err);
    dispatch(resetAppSession());
    return { status: "unauthenticated" };
  }
}