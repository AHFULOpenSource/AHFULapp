//Section Exercise Selector Query Functions

export async function loadEquipment() {
  try {
    const res = await fetch(
      "http://localhost:5000/api/AHFULexercises/equipments/",
      {
        method: "GET",
        mode: "cors",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Equipment API returned ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    let arr = data;
    if (data && Array.isArray(data.data)) arr = data.data;

    const normalized = (arr || []).map((item, idx) => {
      if (item && typeof item === "object") {
        const value =
          item.id ?? item._id ?? item.value ?? item.name ?? String(idx);
        const label =
          item.name ?? item.title ?? item.equipment ?? String(value);
        return { value: String(value), label: String(label) };
      }
      const v = String(item);
      return { value: v, label: v };
    });

    return { data: normalized };
  } catch (err) {
    console.error("loadEquipment error:", err);
    const msg =
      err && err.message
        ? `Could not load equipment list: ${err.message}`
        : "Could not load equipment list";
    return { data: null, error: msg };
  }
}

export async function loadBodyParts() {
  try {
    const res = await fetch("http://localhost:5000/api/AHFULexercises/bodyparts/", {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`BodyPart API returned ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    let arr = data;
    if (data && Array.isArray(data.data)) arr = data.data;

    const normalized = (arr || []).map((item, idx) => {
      if (item && typeof item === "object") {
        const value =
          item.id ?? item._id ?? item.value ?? item.name ?? String(idx);
        const label =
          item.name ?? item.title ?? item.equipment ?? String(value);
        return { value: String(value), label: String(label) };
      }
      const v = String(item);
      return { value: v, label: v };
    });

    return { data: normalized };
  } catch (err) {
    console.error("loadBodyPart error:", err);
    const msg =
      err && err.message
        ? `Could not load body part list: ${err.message}`
        : "Could not load body part list";
    return { data: null, error: msg };
  }
}

export async function loadTargetMuscles() {
  try {
    const res = await fetch("http://localhost:5000/api/AHFULexercises/muscles/", {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Muscle API returned ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    let arr = data;
    if (data && Array.isArray(data.data)) arr = data.data;

    const normalized = (arr || []).map((item, idx) => {
      if (item && typeof item === "object") {
        const value =
          item.id ?? item._id ?? item.value ?? item.name ?? String(idx);
        const label =
          item.name ?? item.title ?? item.equipment ?? String(value);
        return { value: String(value), label: String(label) };
      }
      const v = String(item);
      return { value: v, label: v };
    });

    return { data: normalized };
  } catch (err) {
    console.error("loadTargetMuscles error:", err);
    const msg =
      err && err.message
        ? `Could not load equipment list: ${err.message}`
        : "Could not load equipment list";
    return { data: null, error: msg };
  }
}

//. END Section Exercise Selector Query Functions

// ── Exercise Functions ─────────────────────────────────────────────────────────

export async function fetchExerciseById(exerciseId) {
  const res = await fetch(
    `http://localhost:5000/api/AHFULexercises/id/${exerciseId}`, {credentials: 'include'}
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch exercise: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function fetchWorkoutById(workoutId) {
  try {
    const res = await fetch(`http://localhost:5000/api/AHFULworkouts/id/${workoutId}`, {credentials: 'include'});

    if (res.status === 404 || res.status === 204) {
      return null;
    }

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      throw new Error(
        `Server returned ${res.status} ${res.statusText} ${bodyText}`,
      );
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchWorkoutById error:", err);
    throw err;
  }
}