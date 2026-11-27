import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { WorkoutLogger } from "./WorkoutLogger/WorkoutLogger.jsx";
import { HistoryPRsPage } from "./HistoryPRs/HistoryPRs.jsx";
import { FoodLog } from "./Food/FoodLog.jsx";
import { Dashboard } from "./Dashboard/Dashboard.jsx";
import { Login } from "./Auth/Login.jsx";
import { VerifyEmail } from "./Auth/VerifyEmail.jsx";
import { NotVerified } from "./Auth/NotVerified.jsx";
import { Map } from "./Gyms/Map.jsx";
import { AIChat } from "./AIChat/AIChat.jsx";
import { MeasurementLogger } from "./MeasurementLogger/MeasurementLogger.jsx";
import { Profile } from "./Auth/Profile.jsx";
import { WhoAmI } from "./Auth/WhoAmI.js";
import { Layout } from "./Layout.jsx";
import { ExploreTasks } from "./Tasks/ExploreTasks.jsx";
import { FavoritesHub } from "./Favorites/FavoritesHub.jsx";
import { ExploreFriends } from "./SocialWall/ExploreFriends.jsx";
import { SocialWorkouts } from "./SocialWall/SocialWorkouts.jsx";
import { Templates } from "./Templates/Templates.jsx";
import "./siteStyles.css";
import "./Stylesheets/Themes/Lightmode.css";
import "./Stylesheets/Themes/Darkmode.css";
import { GetFirebaseUser } from "./Auth/GetFirebaseUser.js";
import { Loading } from "./Loading.jsx";
import {
  resetAppSession,
  selectAuthStatus,
  selectIsLoggingIn,
} from "./Auth/AuthSlice.js";
import { SessionExpiryModal } from "./Auth/SessionExpiryModal.jsx";

function AHFULApp() {
  const theme = useSelector((state) => state.setting.theme);
  const authStatus = useSelector(selectAuthStatus);
  const isLoggingIn = useSelector(selectIsLoggingIn);
  const dispatch = useDispatch();
  const { user, loading: authLoading } = GetFirebaseUser();

  // Apply theme globally - runs on all pages
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [theme]);

  // Verify backend cookie session on startup/refresh and react to external Firebase sign-out
  useEffect(() => {
    if (authLoading || isLoggingIn) return;

    if (!user) {
      if (authStatus !== "unauthenticated") {
        dispatch(resetAppSession());
      }
      return;
    }

    if (authStatus === "checking") {
      WhoAmI(dispatch, { currentUser: user });
    }
  }, [authLoading, user, isLoggingIn, authStatus, dispatch]);

  if (authLoading || authStatus === "checking") {
    return <Loading />;
  }

  if (authStatus === "unauthenticated") {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/EmailVerification" element={<VerifyEmail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (authStatus === "unverified") {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/NotVerified" element={<NotVerified />} />
          <Route path="/EmailVerification" element={<VerifyEmail />} />
        </Route>
        <Route path="*" element={<Navigate to="/NotVerified" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <SessionExpiryModal />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/Profile" element={<Profile />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Favorites" element={<FavoritesHub />} />
          <Route path="/WorkoutLogger" element={<WorkoutLogger />} />
          <Route path="/Templates" element={<Templates />} />
          <Route path="/HistoryPRs" element={<HistoryPRsPage />} />
          <Route path="/FoodLog" element={<FoodLog />} />
          <Route path="/EmailVerification" element={<VerifyEmail />} />
          <Route path="/AIChat" element={<AIChat />} />
          <Route path="/Map" element={<Map />} />
          <Route path="/ExploreFriends" element={<ExploreFriends />} />
          <Route path="/MeasurementLogger" element={<MeasurementLogger />} />
          <Route path="/ExploreTasks" element={<ExploreTasks />} />
          <Route path="/SocialWorkouts" element={<SocialWorkouts />} />
        </Route>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/NotVerified" element={<Navigate to="/Dashboard" replace />} />
        <Route path="*" element={<Navigate to="/Dashboard" replace />} />
      </Routes>
    </>
  );
}

export default AHFULApp;
