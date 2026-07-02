import { store } from "../../../store";
import { setFood, setError } from "./PullUserFoodSlice";
import { fetchFood } from "../../../QueryFunctions";

export async function pullFood() {
  const user = store.getState().auth.user;
  if (!user?._id) {
    store.dispatch(setError("No user logged in"));
    return [];
  }
  try {
    const list = await fetchFood(user._id);
    const metadata = list.map(e => ({
      _id: e._id,
      name: e.name,
      calsPerServing: e.calsPerServing,
      servings: e.servings,
      type: e.type,
      time: e.time
    }));
    store.dispatch(setFood(metadata));
  } catch (err) {
    store.dispatch(setError("No food found"));
  }
}
