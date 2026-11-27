import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer, {
  authInitialState,
  clearSessionNotice,
  resetAppSession,
  setAuthChecking,
  setAuthenticated,
  setLoggingIn,
  setUnauthenticated,
  setUnverified,
} from "../src/Auth/AuthSlice.js";
import {
  createSessionManager,
  formatExpiryNotice,
  inspectAuthResponse,
  isProtectedApiRequest,
  SESSION_WARNING_LEAD_SECONDS,
} from "../src/Auth/SessionManager.js";
import pullWorkoutReducer, { addWorkout } from "../src/WorkoutLogger/PullWorkoutSlice.js";
import socialWallReducer, { syncCacheUser } from "../src/SocialWall/SocialWallSlice.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createTestStore() {
  const withSessionReset = (reducer) => (state, action) => {
    if (action.type === resetAppSession.type) {
      return reducer(undefined, action);
    }
    return reducer(state, action);
  };

  return configureStore({
    reducer: combineReducers({
      auth: authReducer,
      pullWorkout: withSessionReset(pullWorkoutReducer),
      socialWall: withSessionReset(socialWallReducer),
    }),
  });
}

test("AuthSlice state transitions and resetAppSession", async (t) => {
  await t.test("starts in checking status with null expiry and notice", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    assert.deepStrictEqual(state, authInitialState);
    assert.strictEqual(state.status, "checking");
  });

  await t.test("transitions across loggingIn, authenticated, unverified, and unauthenticated", () => {
    let state = authReducer(authInitialState, setLoggingIn(true));
    assert.strictEqual(state.isLoggingIn, true);

    state = authReducer(state, setAuthenticated({ expiresAt: 1764220000 }));
    assert.strictEqual(state.status, "authenticated");
    assert.strictEqual(state.expiresAt, 1764220000);
    assert.strictEqual(state.sessionNotice, null);

    state = authReducer(state, setUnverified({ expiresAt: 1764220000 }));
    assert.strictEqual(state.status, "unverified");

    state = authReducer(
      state,
      setUnauthenticated({ sessionNotice: "Your session expired. Please sign in again." })
    );
    assert.strictEqual(state.status, "unauthenticated");
    assert.strictEqual(state.expiresAt, null);
    assert.strictEqual(state.sessionNotice, "Your session expired. Please sign in again.");

    state = authReducer(state, clearSessionNotice());
    assert.strictEqual(state.sessionNotice, null);

    state = authReducer(state, setAuthChecking());
    assert.strictEqual(state.status, "checking");
  });

  await t.test("resetAppSession clears user-cached slices in store while preserving notice", () => {
    const testStore = createTestStore();
    testStore.dispatch(setAuthenticated({ expiresAt: 1764223600 }));
    testStore.dispatch(addWorkout({ _id: "w1", title: "Leg Day" }));
    testStore.dispatch(syncCacheUser("athlete@example.com"));
    assert.strictEqual(testStore.getState().pullWorkout.workouts.length, 1);
    assert.strictEqual(testStore.getState().socialWall.cachedUserEmail, "athlete@example.com");

    testStore.dispatch(resetAppSession({ sessionNotice: "Session expired." }));
    assert.strictEqual(testStore.getState().auth.status, "unauthenticated");
    assert.strictEqual(testStore.getState().auth.expiresAt, null);
    assert.strictEqual(testStore.getState().auth.sessionNotice, "Session expired.");
    assert.strictEqual(testStore.getState().pullWorkout.workouts.length, 0);
    assert.strictEqual(testStore.getState().socialWall.cachedUserEmail, null);
  });
});

test("SessionManager URL scoping, response inspection, interceptor, and extension", async (t) => {
  await t.test("isProtectedApiRequest only matches non-auth backend API routes", () => {
    assert.strictEqual(
      isProtectedApiRequest("http://localhost:5000/api/AHFULworkouts/userid"),
      true
    );
    assert.strictEqual(
      isProtectedApiRequest("http://localhost:5000/api/AHFULsocial/conversations"),
      true
    );
    assert.strictEqual(
      isProtectedApiRequest("http://localhost:5000/api/AHFULauth/whoami"),
      false
    );
    assert.strictEqual(
      isProtectedApiRequest("http://localhost:5000/api/AHFULauth/firebase-login"),
      false
    );
    assert.strictEqual(
      isProtectedApiRequest("http://localhost:5000/api/AHFULauth/logout"),
      false
    );
    assert.strictEqual(isProtectedApiRequest("https://example.com/api/test"), false);
  });

  await t.test("inspectAuthResponse detects 401 and authenticated:false payloads", async () => {
    const res401 = new Response(
      JSON.stringify({ authenticated: false, error: "We require goodies to enter." }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
    const check401 = await inspectAuthResponse(res401);
    assert.strictEqual(check401.unauthorized, true);
    assert.strictEqual(check401.errorMessage, "We require goodies to enter.");

    const res200False = new Response(
      JSON.stringify({ authenticated: false, error: "These bits are too old :,(" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
    const check200False = await inspectAuthResponse(res200False);
    assert.strictEqual(check200False.unauthorized, true);
    assert.strictEqual(check200False.errorMessage, "These bits are too old :,(");

    const resOk = new Response(JSON.stringify([{ _id: "w1" }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const checkOk = await inspectAuthResponse(resOk);
    assert.strictEqual(checkOk.unauthorized, false);
  });

  await t.test("formatExpiryNotice preserves deactivation notice and uses friendly expiry copy", () => {
    assert.strictEqual(
      formatExpiryNotice("Your account has been deactivated :("),
      "Your account has been deactivated."
    );
    assert.strictEqual(
      formatExpiryNotice("We require goodies to enter."),
      "Your session expired. Please sign in again."
    );
  });

  await t.test("fetch interceptor triggers single deduplicated logout on concurrent 401s", async () => {
    const testStore = createTestStore();
    testStore.dispatch(setAuthenticated({ expiresAt: 1764223600 }));
    let signOutCalls = 0;
    let logoutFetchCalls = 0;

    const fakeTarget = {
      fetch: async (url) => {
        if (url.endsWith("/AHFULauth/logout")) {
          logoutFetchCalls += 1;
          return new Response(JSON.stringify({ message: "Logout successful" }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ authenticated: false, error: "We require goodies to enter." }),
          { status: 401, headers: { "content-type": "application/json" } }
        );
      },
    };

    const manager = createSessionManager({
      store: testStore,
      signOutHandler: async () => {
        signOutCalls += 1;
      },
      getFreshIdToken: async () => "fresh-token-123",
      fetchImpl: fakeTarget.fetch,
    });

    manager.installFetchInterceptor(fakeTarget);

    await Promise.all([
      fakeTarget.fetch("http://localhost:5000/api/AHFULworkouts/userid"),
      fakeTarget.fetch("http://localhost:5000/api/AHFULfoods/userid"),
    ]);

    assert.strictEqual(testStore.getState().auth.status, "unauthenticated");
    assert.strictEqual(
      testStore.getState().auth.sessionNotice,
      "Your session expired. Please sign in again."
    );
    assert.strictEqual(signOutCalls, 1);
    assert.strictEqual(logoutFetchCalls, 1);
  });

  await t.test("extendSession refreshes backend session and updates expiresAt", async () => {
    const testStore = createTestStore();
    testStore.dispatch(setAuthenticated({ expiresAt: 1000 }));
    const manager = createSessionManager({
      store: testStore,
      signOutHandler: async () => {},
      getFreshIdToken: async () => "new-id-token",
      fetchImpl: async (url, init) => {
        assert.strictEqual(url, "http://localhost:5000/api/AHFULauth/firebase-login");
        assert.strictEqual(JSON.parse(init.body).token, "new-id-token");
        return new Response(
          JSON.stringify({
            backend_authenticated: true,
            email_verified: true,
            expires_at: 4600,
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      },
    });

    await manager.extendSession();
    assert.strictEqual(testStore.getState().auth.status, "authenticated");
    assert.strictEqual(testStore.getState().auth.expiresAt, 4600);
  });

  await t.test("SESSION_WARNING_LEAD_SECONDS is configured to 5 minutes (300s)", () => {
    assert.strictEqual(SESSION_WARNING_LEAD_SECONDS, 300);
  });
});

test("Route gate, WhoAmI, and Backend 401 structural invariants", () => {
  const appJsx = fs.readFileSync(path.join(__dirname, "../src/AHFULApp.jsx"), "utf8");
  const whoAmIJs = fs.readFileSync(path.join(__dirname, "../src/Auth/WhoAmI.js"), "utf8");
  const modalJsx = fs.readFileSync(
    path.join(__dirname, "../src/Auth/SessionExpiryModal.jsx"),
    "utf8"
  );
  const verificationPy = fs.readFileSync(
    path.join(__dirname, "../../Backend/Auth/verification.py"),
    "utf8"
  );
  const storeJsx = fs.readFileSync(path.join(__dirname, "../src/store.jsx"), "utf8");

  assert.ok(appJsx.includes('authStatus === "unauthenticated"'));
  assert.ok(appJsx.includes('authStatus === "unverified"'));
  assert.ok(appJsx.includes("<SessionExpiryModal />"));
  assert.ok(!whoAmIJs.includes("navigate('/Dashboard')"));
  assert.ok(!whoAmIJs.includes('navigate("/Dashboard")'));
  assert.ok(modalJsx.includes("I am still here"));
  assert.ok(verificationPy.includes("401"));
  assert.ok(!verificationPy.includes(", 200"));
  assert.ok(storeJsx.includes("withSessionReset"));
  assert.ok(storeJsx.includes("auth: authReducer"));
});
