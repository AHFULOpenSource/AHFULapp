import { store } from "../store"; // adjust to your actual store path
import { pullExercises } from "../ExercisesCard/PullExercise";
import { pullPersonalExercises } from "../HistoryPRs/PullPersonalExerciseSlice.js";
import { pullTemplates } from "../Templates/PullTemplateSlice.js";
import { pullWorkouts } from "../WokoutLogger/PullWorkoutSlice.js";
import { pullUserFood } from "../Food/PullUserFood.jsx";
import { pullAllFood } from "../Food/PullAllFood.jsx";

export function onLoginCache() {
  console.log("onLoginCache fired")
  store.dispatch(pullWorkouts());
  store.dispatch(pullPersonalExercises());
  store.dispatch(PullTemplates());

  pullExercises().catch((err) => console.error("Exercise Cache error:", err));
  pullUserFood().catch((err) => console.error("Food Cache error:", err));
  pullAllFood().catch((err) => console.error("All Food Cache error:", err));
}