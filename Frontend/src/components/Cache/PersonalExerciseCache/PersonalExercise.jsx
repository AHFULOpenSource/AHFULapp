import { store } from "../../../store";
import { setPersonalExercises, setError } from "./PersonalExerciseSlice";
import { fetchPersonalExerciseById } from "../../../QueryFunctions";

export async function pullPersonalExercises() {
  const user = store.getState().auth.user;
  if (!user?._id) {
    store.dispatch(setError("No user logged in"));
    return [];
  }
  try {
    const list = await fetchPersonalExerciseById(user._id);
    const metadata = list.map(e => ({
      _id: e._id,
      reps: e.reps,
      sets: e.sets,
      weight: e.weight,
      duration: e.duration,
      distance: e.distance,
      complete: e.complete,
      exercise_id: e.exercise_id,
      user_id: e.user_id,
      workout_id: e.workout_id,
    }));
    store.dispatch(setPersonalExercises(metadata));
  } catch (err) {
    store.dispatch(setError("No personal exercises found"));
  }
}