// ──  Authentication  functions ─────────────────────────────────────────────────────────
export async function handleLogout() {
  //Define POST URL for Later
  const backendPOSTURL = `http://localhost:5000/api/AHFULauth/logout`;

  //Try to Get LocalStorage Cookie for data
  try {
    // POST response Object to BACKEND API ROUTE for processing.
    const backendResponse = await fetch(backendPOSTURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {},
      credentials: "include",
    });

    //TODO: UPDATE REDUX
    //setIsLoggedIn(false);
    console.log("AHFUL Logout Completed successfully.");
  } catch (error) {
    //Catch Spooky Errors that should never occur because you shouldnt log out before login
    console.log("👻 Logout Error:, ", error);
  }
}

export async function handleGoogleLogin(response) {
  //TODO: need to fetch UserSettings and Set to Redux on Non-localStroage Logins

  try {
    //URL to send POST to later
    const backendPOSTURL = `http://localhost:5000/api/AHFULauth/google-login`;

    //Find ID Token, and maybe details from Google Success Response
    const googleButtonIdToken = response?.credential;
    const googleCSFR = response?.g_csrf_token;
    const googleButtonClientID = response?.client_id;

    //Check IDToken Not Null
    if (googleButtonIdToken) {
      // POST response Object to BACKEND API ROUTE for processing.
      const backendResponse = await fetch(backendPOSTURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleButtonIdToken }),
        credentials: "include",
      });

      let backendUserData = await backendResponse.json();
      return backendUserData;

    }

    console.log("AHFUL context_login Completed successfully.");
  } catch (error) {
    console.log(
      "AHFUL Error in handle_google_login Func Catch.  Not sure how you got here.  But here is a hint: ",
      error,
    );
    throw error;
  }
}

export async function whoami() {
  try {
    const backendVerificationResponse = await fetch('http://localhost:5000/api/AHFULauth/whoami', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {},
      credentials: 'include'
    });

    const data = await backendVerificationResponse.json();

    if (data.authenticated) {
      return { ok: true, data };
    } else {
      return { ok: false, error: data.error };
    }
  } catch (err) {
    console.error("Query Function Session validation failed:", err);
  }
}

// ──  User Settings functions ─────────────────────────────────────────────────────────
export async function getUserSettings() {
  const foundUserSettingsResponse = await fetch(`http://localhost:5000/api/AHFULuserSettings`, {
    method: "GET",
    credentials: "include",
  });

  if (foundUserSettingsResponse.ok){
    return foundUserSettingsResponse.json();
  }else{
    throw new Error(
      "Failed to fetch settings" + foundUserSettingsResponse.status,
    );
  }
}

export async function updateUserSettings(userId, settings) {
  const res = await fetch(
    `http://localhost:5000/api/AHFULuserSettings/update/${userId}`,
    {
      method: "PUT",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    },
  );
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}
