import { pullExercises } from "../ExercisesCard/PullExercise";
import { pullPersonalExercises } from "../components/Cache/PersonalExerciseCache/PersonalExercise";
import { pullTemplates } from "../Templates/PullTemplate.jsx";
import { pullWorkouts } from "../WokoutLogger/PullWorkout.jsx";
import { pullUserFood } from "../Food/PullUserFood.jsx";
import { pullAllFood } from "../Food/PullAllFood.jsx";
export function onLoginCache() {
  pullExercises().catch((err) => console.error("Exercise Cache error:", err));
  pullTemplates().catch((err) => console.error("Template Cache error:", err));
  pullWorkouts().catch((err) => console.error("Workout Cache error:", err));
  pullPersonalExercises().catch((err) => console.error("Personal Exercise Cache error:", err));
  pullUserFood().catch((err) => console.error("Food Cache error:", err));
  pullAllFood().catch((err) => console.error("All Food Cache error:", err));
}