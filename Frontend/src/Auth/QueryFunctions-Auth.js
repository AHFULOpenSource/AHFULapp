// ──  Authentication  functions ─────────────────────────────────────────────────────────


export async function handle_google_login(response) {
  //TODO: need to fetch UserSettings and Set to Redux on Non-localStroage Logins

  try {
    //URL to send POST to later
    const backendPOSTURL = `http://localhost:5000/api/AHFULauth/google-login`;

    const googleButtonIdToken = response;

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
