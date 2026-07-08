import { pullExercises } from "../components/Cache/ExerciseCache/PullExercise";
import { pullPersonalExercises } from "../components/Cache/PersonalExerciseCache/PersonalExercise";
import { pullTemplates } from "../components/Cache/TemplateCache/PullTemplate";
import { pullWorkouts } from "../components/Cache/WorkoutCache/PullWorkout";
import { pullFood } from "../components/Cache/FoodCache/PullUserFood";
import { pullFood as pullAllFood } from "../components/Cache/FoodCache/PullFood";
export function onLoginCache() {
  pullExercises().catch((err) => console.error("Exercise Cache error:", err));
  pullTemplates().catch((err) => console.error("Template Cache error:", err));
  pullWorkouts().catch((err) => console.error("Workout Cache error:", err));
  pullPersonalExercises().catch((err) => console.error("Personal Exercise Cache error:", err));
  pullFood().catch((err) => console.error("Food Cache error:", err));
  pullAllFood().catch((err) => console.error("All Food Cache error:", err));
}