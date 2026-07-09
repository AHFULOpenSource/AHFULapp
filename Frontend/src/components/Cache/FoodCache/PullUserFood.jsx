import { store } from "../../../store";
import { setFood, setError } from "./PullUserFoodSlice";
import { fetchFood } from "../../../Food/QueryFunctions-Food";

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
      calories: e.calories,
      servings: e.servings,
      type: e.type,
      time: e.time,
      carbs: e.carbs,
      protein: e.protein,
      fat: e.fat,
      fdcID: e.fdcID,
      servingSize: e.servingSize ?? 0, 
      servingUnit: e.servingUnit ?? "",
    }));
    store.dispatch(setFood(metadata));
  } catch (err) {
    store.dispatch(setError("No food found"));
  }
}
