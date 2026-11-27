import { setAuthenticated, setUnverified } from "./AuthSlice.js";
import { FetchUserSettings } from "./FetchUserSettings.js";
import { API_BASE_URL } from "./SessionManager.js";

export async function completeBackendLogin(user, dispatch, navigate = null) {
  const idToken = await user.getIdToken(true);
  if (!idToken) {
    throw new Error("ID Token is null or undefined. Cannot complete backend login.");
  }

  const backendResponse = await fetch(`${API_BASE_URL}/AHFULauth/firebase-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: idToken }),
    credentials: "include",
  });

  if (!backendResponse.ok) {
    throw new Error(`Backend login failed with status ${backendResponse.status}`);
  }

  const backendData = await backendResponse.json();
  if (!backendData.backend_authenticated) {
    throw new Error(backendData.error || "Backend authentication failed.");
  }

  if (user.emailVerified) {
    await FetchUserSettings(dispatch);
    dispatch(setAuthenticated({ expiresAt: backendData.expires_at ?? null }));
    if (navigate) {
      navigate("/Dashboard");
    }
  } else {
    dispatch(setUnverified({ expiresAt: backendData.expires_at ?? null }));
    if (navigate) {
      navigate("/NotVerified");
    }
  }

  return backendData;
}
