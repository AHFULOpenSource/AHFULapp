import { auth, firebaseAHFULgoogleProvider } from "../firebase.js";
import { signInWithPopup } from "firebase/auth";
import { FetchUserSettings } from "./FetchUserSettings.js";

export async function HandleAHFULGoogleLogin(navigate, dispatch) {

  // Sign in with Google using a Firebase popup
  const popupResponse = await signInWithPopup(auth, firebaseAHFULgoogleProvider);

  // This gives you a Google Access Token. You can use it to access the Google API.
//   const credential = firebaseAHFULgoogleProvider.credentialFromResult(popupResponse)
  // The signed-in user info we will actually use to send to the backend for processing.
  const user = popupResponse.user;

  const idToken = await user.getIdToken(true)
  try {
    //Check IDToken Not Null
    if (idToken) {
      // POST response Object to BACKEND API ROUTE for processing.
      const backendResponse = await fetch("http://localhost:5000/api/AHFULauth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
        credentials: "include",
      });

      if (!backendResponse.ok) {
          throw new Error(`Backend login failed with status ${backendResponse.status}`);
      }else{
          const backendData = await backendResponse.json();
          if(backendData.backend_authenticated){
            FetchUserSettings(dispatch); 
          }
      }
    }else{
        throw new Error("ID Token is null or undefined. Cannot proceed with HandleAHFULGoogleLogin THROWWWWWWWING.");
    }
    
    console.log("HandleAHFULGoogleLogin Completed successfully with user:", user);
    navigate('/Dashboard');
  } catch (error) {
        // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;

      console.error('Error during Google sign-in:', errorCode, errorMessage);


      // The AuthCredential type that was used.
    //   const credential = firebaseAHFULgoogleProvider.credentialFromError(error);
      // ...
    console.log("AHFUL Error in HandleAHFULGoogleLogin Func Catch.  Not sure how you got here.  But here is a hint: ",error, "Error Code: ", errorCode, "Error Message: ", errorMessage);
    throw error;
  }
}