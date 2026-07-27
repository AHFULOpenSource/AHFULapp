export function getDefaultNewExercise() {
  return {
    name: "",
    targetMuscles: [],
    bodyParts: [],
    equipments: [],
    gifUrl: "",
    instructions: "",
  };
}

export async function createExercise(exerciseData) {
  try {
    const res = await fetch("http://localhost:5000/api/AHFULexercises/create/", {
      method: "POST",
      mode: "cors",
      credentials: 'include',
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(exerciseData),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || `Server returned ${res.status}` };
    }

    return { success: true, data };
  } catch (err) {
    console.error("createExercise error:", err);
    const msg = err && err.message ? err.message : "Failed to create exercise";
    return { error: msg };
  }
}

export async function searchExercises(searchQuery) {
  const res = await fetch(
    `http://localhost:5000/api/AHFULexercises/search?search=${encodeURIComponent(searchQuery)}`, {credentials: 'include'}
  );
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