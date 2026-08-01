import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";
import { FetchUserSettings } from "./FetchUserSettings.js";

  /**
   * 
   * Login with email and password using Firebase Authentication.
   * @param {string} email 
   * @param {string} password 
   * @returns userCredential Object to send to backend. 
   */
  export async function HandleAHFULEmailLogin(navigate, dispatch, email, password) {
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

                if (!backendResponse.ok) {

                    throw new Error(`Backend login failed from frontend with status ${backendResponse.status}`);
                }else{
                    // Fetch user settings after successful login
                    const backendData = await backendResponse.json();

                    if(backendData.backend_authenticated){
                        FetchUserSettings(dispatch);

                        if (user.emailVerified) {
                            console.log("Email is verified. Navigating to Dashboard.");
                            navigate("/Dashboard");
                        } else {
                            console.log("Email is not verified. Navigating to NotVerified page.");
                            navigate("/NotVerified");
                        }
                        
                    } else{
                        throw new Error('FetchUserSettings failed: backend_authenticated false.');
                    }
                }

            }else{
                throw new Error("ID Token is null or undefined. Cannot proceed with HandleAHFULEmailLogin THROWWWWWWWING.");
            }
            
            console.log("HandleAHFULEmailLogin Completed successfully with user:", user);
        } catch (error) {
                // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;

            console.error('Error during Google sign-in:', errorCode, errorMessage);


            // The AuthCredential type that was used.
            //   const credential = firebaseAHFULgoogleProvider.credentialFromError(error);
            // ...
            console.log("AHFUL Error in HandleAHFULEmailLogin Func Catch.  Not sure how you got here.  But here is a hint: ",error, "Error Code: ", errorCode, "Error Message: ", errorMessage);
            throw error;
        }


      
    } catch (error) {
      console.error('Error during HandleAHFULEmailLogin login:', error);
      throw error; // rethrow the error so the caller can handle it
    }
  }