import { store } from "../../../store";
import { setWorkouts, addWorkout, updateWorkout, setError } from "./PullWorkoutSlice";
import { fetchWorkout } from "../../../QueryFunctions";

export async function pullWorkouts() {
  try {
    const user = store.getState().auth.user;
    if (!user?._id) {
      store.dispatch(setError("No user logged in"));
      return;
    }
    
    const list = await fetchWorkout(user._id);
    const metadata = list.map(w => ({
      _id: w._id,
      startTime: w.startTime,
      endTime: w.endTime,
      title: w.title,
    }));
    store.dispatch(setWorkouts(metadata));
  } 
  catch (err) {
    store.dispatch(setError("No workouts found"));
  }
}