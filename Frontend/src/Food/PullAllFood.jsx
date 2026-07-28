import { store } from "../store";
import { setFood, setError } from "./PullFoodSlice.jsx";
import { fetchAllFood } from "./QueryFunctions-Food.js";

export async function pullAllFood() {
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
    console.log("Pulled food:", metadata);
    store.dispatch(setFood(metadata));
  } catch (err) {
    store.dispatch(setError("No food found"));
  }
}
