import { setSettings } from './SettingsSlice.jsx';
import { auth } from "../firebase.js"
import { useSelector, useDispatch } from "react-redux";
import { FetchUserSettings } from "./FetchUserSettings.js";


export async function WhoAmI(dispatch, navigate) {
  try {
        // Call the backend to check if the user is authenticated with Cookies.
        const backendVerificationResponse = await fetch('https://www.ahful.app/api/AHFULauth/whoami', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {},
            credentials: 'include'
        });

        //Assign Variables for Backend Response
        const backenUserData = await backendVerificationResponse.json();
        const backendUserAuthenticated = await backenUserData.backend_authenticated;
        const backendUserDataMessage = await backenUserData.message;

        // Assign Variable for Firebase Auth Response
        const firebaseAuth = auth.currentUser;

        // If backend WhoAmI fails to return (network or missing cookies) ,send them to the Login page.
        // If Firebase Auth Fails to return (user not logged in), send them to the Login page.
        if (!backendUserAuthenticated) {
            navigate('/');
            console.error("WhoAmI Backend Authentication Failed response. Nothing came back");
            return;
        } else if (!firebaseAuth) {
            navigate('/');
            console.error("WhoAmI Firebase Authentication Failed response. firebase is empty");
            return;
        }else if (!firebaseAuth.emailVerified) {
            navigate('/NotVerified');
            console.error("WhoAmI Firebase Authentication Failed response. Email is not verified");
            return;
        }else {

            // Fetch User Settings from backend and update Redux
            FetchUserSettings(dispatch); 
            // console.log("User Settings fetched and updated in Redux by WhoAmI successfully.");
            navigate('/Dashboard');

        }
  } catch (err) {
        console.error("WhoAmI Failed and Caught this Error:", err);
  }
}