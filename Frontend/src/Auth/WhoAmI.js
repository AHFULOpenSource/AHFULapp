import { authLogin } from "./AuthSlice.jsx";
import { setSettings } from './SettingsSlice.jsx';
import { getCurrentUser } from "../firebase.js"
import { useSelector, useDispatch } from "react-redux";


export async function WhoAmI(dispatch, navigate) {
  try {
        // Call the backend to check if the user is authenticated with Cookies.
        const backendVerificationResponse = await fetch('http://localhost:5000/api/AHFULauth/whoami', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {},
            credentials: 'include'
        });

        //Assign Variables for Backend Response
        const backenUserData = await backendVerificationResponse.json();
        const backendUserAuthenticated = await backenUserData.authenticated;
        const backendUserDataMessage = await backenUserData.message;
        const backendUserDataUserInfo = await backenUserData.user_info;

        // Assign Variable for Firebase Auth Response
        const firebaseAuth = getCurrentUser();

        // If backend WhoAmI fails to return (network or missing cookies) ,send them to the Login page.
        // If Firebase Auth Fails to return (user not logged in), send them to the Login page.
        if (!backendUserAuthenticated || !firebaseAuth) {
            navigate('/');
            return;
        }

        // If Authenticated with Firebase and Backend
        if (backendUserAuthenticated && firebaseAuth) {
                // Update Redux with User info from backend.
            dispatch(authLogin(backendUserDataUserInfo));

            //Fetch User Settings from Backend and Update Redux
            const foundUserSettingsResponse = await fetch(`http://localhost:5000/api/AHFULuserSettings`, {
                method: "GET",
                credentials: "include",
            });

            if (foundUserSettingsResponse){
                const settingsJson = await foundUserSettingsResponse.json();
                
                console.log("WhoAmI: Found User Settings Response:", settingsJson);
                dispatch(setSettings(settingsJson));
            }else{
                throw new Error(
                "Failed to fetch settings" + foundUserSettingsResponse.status,
                );
            }

        }else{
            navigate('/');
        }
  } catch (err) {
        console.error("WhoAmI Failed and Caught this Error:", err);
  }
}