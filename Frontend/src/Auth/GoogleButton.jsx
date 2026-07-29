import { GoogleLogin } from "@react-oauth/google";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { handleGoogleLogin, getUserSettings } from "./QueryFunctionsAuth.js";
import { authLogin } from "./AuthSlice.jsx";
import { setSettings } from '../Auth/SettingsSlice.jsx';
import googleIconDay from "../../images/Login/GoogleIcons/web_light_rd_na@2x.png";
import googleIconNotScrolledDay from "../../images/Login/GoogleIcons/web_light_rd_SI@4x.png";
import googleIconNight from "../../images/Login/GoogleIcons/web_dark_rd_na@2x.png";
import googleIconNotScrolledNight from "../../images/Login/GoogleIcons/web_dark_rd_SI@4x.png";
import "./Auth.css";

export function GoogleButton({ onSuccess, onError, isScrolled, browser }) {
  const dispatch = useDispatch();
  const [isNightMode, setIsNightMode] = useState(false);
  const hiddenRef = useRef(null);

  useEffect(() => {
    const check = () => setIsNightMode(new Date().getHours() >= 16 || new Date().getHours() < 5);
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  const handleSuccess = async (response) => {
    try {
      const res = await handleGoogleLogin(response);
      if (!res || res?.ok === false) {
        console.error("Google login failed:", res?.error || res);
        onError?.(res?.error || "Google login failed");
        return;
      }
      const settings = await getUserSettings();
      if (!settings || settings?.ok === false) {
        console.error("Failed to get user settings:", settings?.error || settings);
        onError?.(settings?.error || "Failed to fetch user settings");
        return;
      }
      dispatch(authLogin(res.user_info));
      dispatch(setSettings(settings));
      onSuccess?.();
    } catch (e) {
      console.error("Google login error:", e);
      onError?.(e.message || "Login failed. Please try again.");
    }
  };

  const handleFailure = (error) => {
    console.error("Google Login failed:", error);
    onError?.(error);
  };

  const trigger = () => hiddenRef.current?.querySelector('div[role="button"]')?.click();


  if (browser === "Internet Explorer" || browser === "Google Chrome" || browser === "Microsoft Edge") {
    return(
    <div className={`google-login-centered ${isScrolled ? 'hidden' : 'visible'}`}>
      <div className="google-button-fixed">
        <GoogleLogin
          size="medium"
          text={""}
          shape="circle"
          onSuccess={handleSuccess}
          onError={handleFailure}
        />
      </div>
    </div>
    )
  }
  else{
    return (
      <>
        <div ref={hiddenRef} style={{ position: 'absolute', left: '-9999px' }}>
          <GoogleLogin onSuccess={handleSuccess} onError={handleFailure} />
        </div>

        <button 
          className={`google-login-button ${isScrolled ? 'hidden' : ''}`} 
          onClick={trigger}
        >
          <img src={isNightMode ? googleIconNotScrolledNight : googleIconNotScrolledDay} alt="Google Login" />
        </button>
        <button 
          className={`google-login-button-scrolled ${isScrolled ? 'visible' : 'hidden'}`} 
          onClick={trigger}
        >
          <img src={isNightMode ? googleIconNight : googleIconDay} alt="Google Login" />
        </button>
      </>
    );
  }
}
