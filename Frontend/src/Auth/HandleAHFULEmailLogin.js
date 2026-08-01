import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";
import { authLogin } from "./AuthSlice.jsx";
import { FetchUserSettings } from "./FetchUserSettings.js";

  /**
   * 
   * Login with email and password using Firebase Authentication.
   * @param {string} email 
   * @param {string} password 
   * @returns userCredential Object to send to backend. 
   */
  export async function HandleAHFULEmailLogin(dispatch, email, password) {
    try{
        const providedEmail = email;
        const providedPassword = password;
        const userCredential = await signInWithEmailAndPassword(auth, providedEmail, providedPassword);

        console.log('User signed in successfully:', userCredential.user);
        //Retrun the userCredential object.
        const user = userCredential.user;

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

            const backendUserData = await backendResponse.json();
            dispatch(authLogin(backendUserData.user_info));

            // Fetch user settings after successful login
            FetchUserSettings(dispatch); 
            }else{
                throw new Error("ID Token is null or undefined. Cannot proceed with HandleAHFULGoogleLogin THROWWWWWWWING.");
            }
            
            console.log("AHFUL context_login Completed successfully with user:", user);
        } catch (error) {
                // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;

            console.error('Error during Google sign-in:', errorCode, errorMessage);


            // The AuthCredential type that was used.
            //   const credential = firebaseAHFULgoogleProvider.credentialFromError(error);
            // ...
            console.log("AHFUL Error in handle_google_login Func Catch.  Not sure how you got here.  But here is a hint: ",error, "Error Code: ", errorCode, "Error Message: ", errorMessage);
            throw error;
        }


      
    } catch (error) {
      console.error('Error during email/password login:', error);
      throw error; // rethrow the error so the caller can handle it
    }
  }