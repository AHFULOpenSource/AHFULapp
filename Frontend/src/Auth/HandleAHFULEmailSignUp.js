import { auth } from "../firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";

/**
 * Creates a user with provided email and password and logs them in. 
 * @param {*} email 
 * @param {*} password 
 * @returns A userCredential object
 */
export const HandleAHFULEmailSignUp = async (navigate, email, password) => {
  try{
    const providedEmail = email;
    const providedPassword = password;
    const userCredential = await createUserWithEmailAndPassword(auth, providedEmail, providedPassword);

    // console.log('User created successfully:', userCredential.user);
    const user = userCredential.user;

    //Retrun the userCredential object.
        const idToken = await user.getIdToken(true)
        try {
            //Check IDToken Not Null
            if (idToken) {
                // POST response Object to BACKEND API ROUTE for processing.
                const backendResponse = await fetch("https://www.ahful.app/api/AHFULauth/firebase-login", {
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
                        //TODO: Create User Setting Function. 
                        navigate("/NotVerified");
                        
                    } else{
                        throw new Error('CreateUserSettings failed: backend_authenticated false.');
                    }
                }

            }else{
                throw new Error("ID Token is null or undefined. Cannot proceed with HandleAHFULEmailSignUp THROWWWWWWWING.");
            }
            
            // console.log("HandleAHFULEmailSignUp Completed successfully with user:", user);

        }catch (error) {
                // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;

            console.error('Error during Google sign-in:', errorCode, errorMessage);


            // The AuthCredential type that was used.
            //   const credential = firebaseAHFULgoogleProvider.credentialFromError(error);
            // ...
            console.error("AHFUL Error in HandleAHFULEmailSignUp Func Catch.  Not sure how you got here.  But here is a hint: ",error, "Error Code: ", errorCode, "Error Message: ", errorMessage);
            throw error;
        }
  } catch (error) {
    console.error('Error during HandleAHFULEmailSignUp Sign up:', error);
    throw error; // rethrow the error so the caller can handle it
  }
}