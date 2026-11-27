import { resetAppSession, setAuthenticated, setUnverified } from "./AuthSlice.js";

export const API_BASE_URL = "http://localhost:5000/api";
export const SESSION_WARNING_LEAD_SECONDS = 300; // 5 minutes before expiry

const EXCLUDED_AUTH_PATHS = [
  "/AHFULauth/firebase-login",
  "/AHFULauth/whoami",
  "/AHFULauth/logout",
];

let managerInstance = null;

export function isProtectedApiRequest(input) {
  const url = typeof input === "string" ? input : input?.url || "";
  if (!url.startsWith(API_BASE_URL)) {
    return false;
  }
  const path = url.slice(API_BASE_URL.length);
  return !EXCLUDED_AUTH_PATHS.some((excluded) => path.startsWith(excluded));
}

export async function inspectAuthResponse(response) {
  let parsed = null;
  try {
    const contentType = response.headers?.get?.("content-type") || "";
    if (!contentType || contentType.includes("application/json")) {
      parsed = await response.clone().json();
    }
  } catch {
    parsed = null;
  }

  const unauthorized = response.status === 401 || parsed?.authenticated === false;
  return {
    unauthorized,
    errorMessage: parsed?.error || (response.status === 401 ? "Session expired." : null),
  };
}

export function formatExpiryNotice(backendError) {
  if (typeof backendError === "string" && backendError.toLowerCase().includes("deactivated")) {
    return "Your account has been deactivated.";
  }
  return "Your session expired. Please sign in again.";
}

export function createSessionManager({
  store,
  signOutHandler,
  getFreshIdToken,
  fetchImpl = globalThis.fetch?.bind(globalThis),
}) {
  const rawFetch = fetchImpl;
  let isHandlingExpiry = false;
  let expiryPromise = null;
  let interceptorInstalled = false;

  async function handleSessionExpired(notice = "Your session expired. Please sign in again.") {
    if (isHandlingExpiry && expiryPromise) {
      return expiryPromise;
    }

    const currentStatus = store.getState()?.auth?.status;
    if (currentStatus === "unauthenticated") {
      return;
    }

    isHandlingExpiry = true;
    // Synchronously mark unauthenticated and reset user caches first so
    // protected layouts/pollers unmount immediately before async cleanup.
    store.dispatch(resetAppSession({ sessionNotice: notice }));

    expiryPromise = (async () => {
      try {
        if (rawFetch) {
          await rawFetch(`${API_BASE_URL}/AHFULauth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
            credentials: "include",
          }).catch(() => {});
        }
        if (typeof signOutHandler === "function") {
          await signOutHandler();
        }
      } catch (err) {
        console.error("Error during expired session cleanup:", err);
      } finally {
        isHandlingExpiry = false;
        expiryPromise = null;
      }
    })();

    return expiryPromise;
  }

  async function extendSession() {
    if (typeof getFreshIdToken !== "function") {
      throw new Error("Session extension handler not configured.");
    }
    const idToken = await getFreshIdToken();
    if (!idToken) {
      throw new Error("No active Firebase session available to extend.");
    }

    const res = await rawFetch(`${API_BASE_URL}/AHFULauth/firebase-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: idToken }),
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Failed to extend session (status ${res.status})`);
    }

    const data = await res.json();
    if (!data?.backend_authenticated) {
      throw new Error(data?.error || "Backend failed to extend session.");
    }

    if (data.email_verified === false) {
      store.dispatch(setUnverified({ expiresAt: data.expires_at ?? null }));
    } else {
      store.dispatch(setAuthenticated({ expiresAt: data.expires_at ?? null }));
    }

    return data;
  }

  function installFetchInterceptor(targetGlobal = globalThis) {
    if (interceptorInstalled || typeof targetGlobal?.fetch !== "function") {
      return;
    }
    const originalFetch = targetGlobal.fetch.bind(targetGlobal);
    interceptorInstalled = true;

    targetGlobal.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      if (isProtectedApiRequest(input)) {
        const currentStatus = store.getState()?.auth?.status;
        if (currentStatus === "authenticated" || currentStatus === "unverified") {
          const { unauthorized, errorMessage } = await inspectAuthResponse(response);
          if (unauthorized) {
            console.warn("Backend unauthorized response intercepted:", errorMessage);
            await handleSessionExpired(formatExpiryNotice(errorMessage));
          }
        }
      }
      return response;
    };
  }

  return {
    handleSessionExpired,
    extendSession,
    installFetchInterceptor,
  };
}

export function configureSessionManager(options) {
  managerInstance = createSessionManager(options);
  return managerInstance;
}

export function installAuthFetchInterceptor() {
  if (!managerInstance) {
    throw new Error("configureSessionManager must be called before installAuthFetchInterceptor");
  }
  managerInstance.installFetchInterceptor(globalThis);
}

export function handleSessionExpired(notice) {
  if (!managerInstance) return Promise.resolve();
  return managerInstance.handleSessionExpired(notice);
}

export function extendSession() {
  if (!managerInstance) {
    return Promise.reject(new Error("Session manager not configured"));
  }
  return managerInstance.extendSession();
}
