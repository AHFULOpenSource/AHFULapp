import { store } from "../store";
import { setTemplates, setError } from "./PullTemplateSlice";
import { fetchPersonalExercises } from "../QueryFunctions";

export async function pullTemplates() {
  try {

    const res = await fetch(
      `http://localhost:5000/api/AHFULtemplate/user`,{
        credentials: 'include'
      }
    );
    if (!res.ok) {
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch (e) {}
      throw new Error(
        `Server returned ${res.status} ${res.statusText} ${bodyText}`,
      );
    }
    const data = await res.json();
    const metaData = data.map(t => ({
      _id: t._id,
      title: t.title,
      created_at: t.created_at,
      notes: t.notes,
      exercises: t.exercises,
    }));

    store.dispatch(setTemplates(metaData));
  }
  catch (err) {
    store.dispatch(setError("No templates found"));
  }
}
