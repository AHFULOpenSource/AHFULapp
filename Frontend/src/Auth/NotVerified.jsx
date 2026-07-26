import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams} from "react-router-dom";
import { useState, useEffect } from "react";

export function NotVerified() {
  // ----- Verification STATE MANAGEMENT ---------------------------------------------------------------------------
  //Redux Site Wide Auth State
  const theme = useSelector((state) => state.setting?.theme || "light");

  const [statusText, setStatusText] = useState("");
  const user = useSelector((state) => state.auth.user);

  const handleVerifyEmail = async () => {
    try {
      const res = await fetch(
        "https://www.ahful.app/api/AHFULverify/verify/email/user_id/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user._id,
          }),
        }
      );

      //const data = await res.json();
      const data = await res.json(); // parse JSON
      console.log("Response JSON:", data);

      if (!res.ok) {
        alert(data.error || "Failed to send verification email");
        return;
      }

      if (data.message) {
        alert(data.message);
      }
      else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Verify email failed:", err);
      alert("Network error sending verification email");
    }
  };

// ----- Verification Page HTML ---------------------------------------------------------------------------
  return (
    <div className="not-verified-page">
        <h1>AHFUL App Email Verification Page</h1>   
        <h2>Your email is not verified</h2>   
        <h2>Click the button below to send a verification email</h2>
        <p>After you receive the email click the link in it and log out and log back in to access all features.</p>

        {/* Manually verify user email*/}
          <div className="profile-email-verify-section">
            <button
              className="profile-email-verify-btn"
              onClick={handleVerifyEmail}
            >
              Verify Email
            </button>
          </div>
    </div>
  );
}
