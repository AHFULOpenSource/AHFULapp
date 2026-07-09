import { store } from "../../../store";
import { setExercises, setError } from "./PullExerciseSlice";
import { fetchExercisesFromBackend } from "../../../QueryFunctions";

export async function pullExercises() {
  try {
    const list = await fetchExercisesFromBackend();
    const metadata = list.map(e => ({
      _id: e._id,
      name: e.name,
      targetMuscles: e.targetMuscles,
      bodyParts: e.bodyParts,
      equipment: e.equipment,
      secondaryMuscles: e.secondaryMuscles,
      instructions: e.instructions,
    }));
    store.dispatch(setExercises(metadata));
  } catch (err) {
    store.dispatch(setError("No exercises found"));
  }
}