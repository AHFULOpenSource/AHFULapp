import { store } from "../../../store";
import { setFood, setError } from "./PullFoodSlice";
import { fetchAllFood } from "../../../Food/QueryFunctions-Food";

export async function pullFood() {
  const user = store.getState().auth.user;
  if (!user?._id) {
    store.dispatch(setError("No user logged in"));
    return [];
  }
  try {
    const list = await fetchAllFood();
    const metadata = list.map(e => ({
      _id: e._id,
      name: e.name,
      calsPerServing: e.calsPerServing,
      servings: e.servings,
      type: e.type,
      time: e.time
    }));
    console.log("Pulled food:", metadata);
    store.dispatch(setFood(metadata));
  } catch (err) {
    store.dispatch(setError("No food found"));
  }
}
