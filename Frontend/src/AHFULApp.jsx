import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { WorkoutLogger } from "./WokoutLogger/WorkoutLogger.jsx";
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
import { TOS } from "./TOS.jsx";
import { Layout } from "./Layout.jsx"
import { Settings } from "./Auth/Settings.jsx";
import { ExploreTasks } from "./Tasks/ExploreTasks.jsx";
import { FavoritesHub } from "./Favorites/FavoritesHub.jsx";
// import { useTutorial } from "./Auth/useTutorial.js";
import { TutorialOverlay } from "./Auth/TutorialOverlay.jsx";
import { ExploreFriends } from "./SocialWall/ExploreFriends.jsx";
import { RequireVerifiedEmail } from "./Auth/EnsureEmailVerify.jsx";
import { SocialWorkouts } from "./SocialWall/SocialWorkouts.jsx";
import { Templates } from "./Templates/Templates.jsx";
import { getCurrentUser } from "./firebase.js";
import "./siteStyles.css";
import "./Stylesheets/Themes/Lightmode.css";
import "./Stylesheets/Themes/Darkmode.css";

function AHFULApp() {
  const theme = useSelector((state) => state.setting.theme);
  const userData = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const {
  //   isActive: tutorialActive,
  //   currentStep,
  //   totalSteps,
  //   currentStepData,
  //   skipTutorial,
  //   nextStep,
  //   completeTutorial
  // } = useTutorial();

  // Apply theme globally - runs on all pages
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [theme]);

  // TODO: Apply WhoAmI Check globally - runs on all pages, only want to run this check once on app load, not on every route change.
  useEffect(() => {
    WhoAmI(dispatch, navigate);
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
            <Route path="/HistoryPRs" element={<HistoryPRsPage/>}/>
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

      {/* {tutorialActive && currentStepData && (
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
      )} */}

    </>
  );

}

export default AHFULApp
