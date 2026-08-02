import { store } from "../store"; // adjust to your actual store path
import { pullExercises } from "../ExercisesCard/PullExercise";
import { pullPersonalExercises } from "../HistoryPRs/PullPersonalExerciseSlice.js";
import { pullTemplates } from "../Templates/PullTemplateSlice.js";
import { pullWorkouts } from "../WokoutLogger/PullWorkoutSlice.js";
import { pullUserFood } from "../Food/PullUserFoodSlice.js";

export function onLoginCache() {
  console.log("onLoginCache fired")
  store.dispatch(pullWorkouts());
  store.dispatch(pullPersonalExercises());
  store.dispatch(pullTemplates());
  store.dispatch(pullUserFood());

  pullExercises().catch((err) => console.error("Exercise Cache error:", err));
}