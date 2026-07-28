import { store } from "../store";
import { setExercises, setError } from "./PullExerciseSlice";

async function fetchExercisesFromBackend() {
  const res = await fetch("https://www.ahful.app/api/AHFULexercises", {credentials: 'include'});
  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch (e) {}
    // If 404 or empty response, return empty array for new users
    if (res.status === 404 || res.status === 204) {
      return [];
    }
    throw new Error(
      `Server returned ${res.status} ${res.statusText} ${bodyText}`,
    );
  }
  const data = await res.json();
  let list = [];
  if (Array.isArray(data)) list = data;
  else if (data && Array.isArray(data.data)) list = data.data;
  else if (data && Array.isArray(data.results)) list = data.results;
  else list = [];
  return list;
}

export async function pullExercises() {
  try {
    const list = await fetchExercisesFromBackend();
    const metadata = list.map((e) => ({
      _id: e._id,
      name: e.name,
      targetMuscles: e.targetMuscles,
      secondaryMuscles: e.secondaryMuscles,
      bodyParts: e.bodyParts,
      equipments: e.equipments,
      instructions: e.instructions,
      gifUrl: e.gifUrl,
    }));
    store.dispatch(setExercises(metadata));
  } catch (err) {
    store.dispatch(setError("No exercises found"));
  }
}