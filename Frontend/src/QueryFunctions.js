// Shared query and utility functions used by pages/components
export function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

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

export function getDefaultNewExercise() {
  return {
    name: "",
    targetMuscles: [],
    bodyParts: [],
    equipment: [],
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

// ── Workout Functions ───────────────────────────────────────────────────────────

export async function createWorkout(workoutData) {
  const res = await fetch("http://localhost:5000/api/AHFULworkouts/create", {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workoutData),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create workout: ${res.status} ${err}`);
  }
  return res.json();
}

export async function fetchWorkout(userId) {
  try {
    const res = await fetch(`http://localhost:5000/api/AHFULworkouts/${userId}`, {credentials: 'include'});

    // Handle empty or not found responses for new users
    if (res.status === 404 || res.status === 204) {
      return [];
    }

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      throw new Error(
        `Server returned ${res.status} ${res.statusText} ${bodyText}`,
      );
    }

    const data = await res.json();
    return data

  } catch (err) {
    console.error("fetchWorkout error:", err);
    // Return empty array for network errors on new user accounts
    throw err;
  }
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
    console.error("fetchWorkout error:", err);
    throw err;
  }
}


export async function updateWorkout(workoutId, data) {
  const res = await fetch(
    `http://localhost:5000/api/AHFULworkouts/update/${workoutId}`,
    {
      method: "PUT",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update workout: ${res.status} ${err}`);
  }
  return res.json();
}

export async function deleteWorkout(workoutId) {
  const backendResponse = await fetch(
    `http://localhost:5000/api/AHFULworkouts/delete/${workoutId}`,
    {
      method: "DELETE",
      credentials: 'include',
    }
  );
  if (!backendResponse.ok) {
    const err = await backendResponse.text();
    throw new Error(`Failed to delete workout: ${backendResponse.status} ${err}`);
  }
  return backendResponse.json();
}

// ── Personal Exercise Functions ─────────────────────────────────────────────────

export async function fetchPersonalExerciseById(userId) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULpersonalEx/${userId}`, {credentials: 'include'}
    );
    if (res.status === 404 || res.status === 204) {
      return [];
    }
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      throw new Error(`Server returned ${res.status} ${res.statusText} ${bodyText}`);
    }
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.exercises)) return data.exercises;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  } catch (err) {
    console.error("fetchPersonalExerciseById error:", err);
    return [];
  }
}

export async function fetchPersonalExercises(workoutId) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULpersonalEx/workout/${workoutId}`, {credentials: 'include'}
    );

    // Handle empty or not found responses
    if (res.status === 404 || res.status === 204) {
      return [];
    }

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      throw new Error(
        `Server returned ${res.status} ${res.statusText} ${bodyText}`,
      );
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.exercises)) return data.exercises;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  } catch (err) {
    console.error("fetchPersonalExercises error:", err);
    return [];
  }
}

export async function createPersonalExercise(data) {
  const res = await fetch("http://localhost:5000/api/AHFULpersonalEx/create", {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create personal exercise: ${res.status} ${err}`);
  }
  return res.json();
}

export async function updatePersonalExercise(exerciseId, data) {
  const res = await fetch(
    `http://localhost:5000/api/AHFULpersonalEx/update/${exerciseId}`,
    {
      method: "PUT",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update personal exercise: ${res.status} ${err}`);
  }
  return res.json();
}

export async function deletePersonalExercise(exerciseId) {
  const res = await fetch(
    `http://localhost:5000/api/AHFULpersonalEx/delete/${exerciseId}`,
    {
      method: "DELETE",
      credentials: 'include',
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete personal exercise: ${res.status} ${err}`);
  }
  return res.json();
}

//Personal Exercise Data
export async function createPersonalExercises(peData) {
  try {
    const res = await fetch("http://localhost:5000/api/AHFULpersonalEx/create", {
      method: "POST",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(peData),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || `Server returned ${res.status}` };
    }

    return { success: true, data };
  } catch (err) {
    console.error("createPersonalExercise error:", err);
    return { error: err.message || "Failed to create personal exercise" };
  }
}

export async function updatePersonalExercises(peId, peData) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULpersonalEx/update/${peId}`,
      {
        method: "PUT",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(peData),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || `Server returned ${res.status}` };
    }

    return { success: true, data };
  } catch (err) {
    console.error("updatePersonalExercise error:", err);
    return { error: err.message || "Failed to update personal exercise" };
  }
}



// ── Workout Favorite Functions ──────────────────────────────────────────
export async function toggleWorkoutFavorite(workoutId) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULworkouts/${workoutId}/favorite`,
      {
        method: "PUT",
        mode: "cors",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to toggle favorite: ${res.statusText}`);
    }

    const data = await res.json();
    return { data: data.workout, error: null };
  } catch (err) {
    console.error("toggleWorkoutFavorite error:", err);
    return { data: null, error: err.message };
  }
}

export async function getWorkoutFavorites(userId) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULworkouts/favorites/${userId}`,
      {
        method: "GET",
        mode: "cors",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch favorites: ${res.statusText}`);
    }

    const data = await res.json();
    return { data: data, error: null };
  } catch (err) {
    console.error("getWorkoutFavorites error:", err);
    return { data: null, error: err.message };
  }
}




