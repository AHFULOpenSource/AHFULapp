import {  useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { WorkoutLogger } from "./WokoutLogger/WorkoutLogger.jsx";
import { ExploreWorkouts } from "./ExploreWorkouts/ExploreWorkouts.jsx";
import { FoodLog } from "./Food/FoodLog.jsx";
import { Dashboard } from "./Dashboard/Dashboard.jsx";
import { Login } from "./Auth/Login.jsx";
import { VerifyEmail } from "./Auth/VerifyEmail.jsx";
import { NotVerified } from "./Auth/NotVerified.jsx";
import { Map } from "./Gyms/Map.jsx";
import { AIChat } from "./AIChat/AIChat.jsx";
import { MeasurementLogger } from "./MeasurementLogger/MeasurementLogger.jsx";
import { Profile } from "./Auth/Profile.jsx";
import { TOS } from "./TOS.jsx";
import { Layout } from "./Layout.jsx"
import { Settings } from "./Auth/Settings.jsx";
import { ExploreTasks } from "./Tasks/ExploreTasks.jsx";
import { FavoritesHub } from "./Favorites/FavoritesHub.jsx";
import { useTutorial } from "./Auth/useTutorial.js";
import { TutorialOverlay } from "./Auth/TutorialOverlay.jsx";
import "./siteStyles.css";
import "./Stylesheets/Themes/Lightmode.css";
import "./Stylesheets/Themes/Darkmode.css";
import { whoami, getUserSettings } from "./QueryFunctions.js";
import { setSettings } from './Auth/SettingsSlice.jsx';
import { authLogin } from "./Auth/AuthSlice.jsx";
import { ExploreFriends } from "./Social/ExploreFriends.jsx";
import { RequireVerifiedEmail } from "./Auth/EnsureEmailVerify.jsx";
import { SocialWorkouts } from "./Social/SocialWorkouts.jsx";
import { Templates } from "./WokoutLogger/Templates.jsx";


function AHFULApp() {
  const theme = useSelector((state) => state.setting.theme);
  const userData = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    isActive: tutorialActive,
    currentStep,
    totalSteps,
    currentStepData,
    skipTutorial,
    nextStep,
    completeTutorial
  } = useTutorial();

  // Apply theme globally - runs on all pages
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [theme]);

  // Apply WhoAmI Check globally - runs on all pages
  useEffect(() => {
    const checkCookies = async () => {
      // We only want to run this check once on app load, not on every route change.
      const whomstResponse = await whoami();
      const path = window.location.pathname || '/';

      // If whoami fails to return (network or missing cookies),
      // don't force a redirect when the user is already on the public
      // root path ('/'). But if they're trying to visit any other
      // route, send them to the Login page.
      if (!whomstResponse) {
        navigate('/');
        return;
      }

      if (whomstResponse.ok){
        dispatch(authLogin(whomstResponse.data.user_info));

        const userSettingsResponse = await getUserSettings();
        dispatch(setSettings(userSettingsResponse));
      }else{
        navigate('/');
      }
    }

    checkCookies();
  }, []);


  return (
    <>
      <Routes>
        <Route element={<Layout/>}>
          <Route path="/Profile" element={<Profile/>}/>
          <Route path="/NotVerified" element={<NotVerified/>}/>
          <Route element={<RequireVerifiedEmail />}>
            <Route path="/Dashboard" element={<Dashboard/>}/>
            <Route path="/Favorites" element={<FavoritesHub/>}/>
            <Route path="/WorkoutLogger" element={<WorkoutLogger/>} />
            <Route path="/Templates" element={<Templates/>} />
            <Route path="/ExploreWorkout" element={<ExploreWorkouts/>}/>
            <Route path="/FoodLog" element={<FoodLog/>}/>
            <Route path="/EmailVerification" element={<VerifyEmail/>}/>
            <Route path="/AIChat" element={<AIChat/>}/>
            <Route path="/Map" element={<Map/>}/>
            <Route path="/ExploreFriends" element={<ExploreFriends/>}/>
            <Route path="/MeasurementLogger" element={<MeasurementLogger/>}/>
            <Route path="/ExploreTasks" element={<ExploreTasks/>}/>
            <Route path="Settings" element={<Settings/>} />
            <Route path="/SocialWorkouts" element={<SocialWorkouts/>}/>
            </Route>
        </Route>
        {/* Put outside of the Layout so it doesn't show the header/navbar */}
        <Route path="/" element={<Login/>}/>
      </Routes>

      {tutorialActive && currentStepData && (
        <TutorialOverlay
          step={currentStep}
          totalSteps={totalSteps}
          title={currentStepData.title}
          message={currentStepData.message}
          highlightSelector={currentStepData.highlightSelector}
          onNext={nextStep}
          onSkip={skipTutorial}
          onComplete={completeTutorial}
        />
      )}

    </>
  );

}

export default AHFULApp
