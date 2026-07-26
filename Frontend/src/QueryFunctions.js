// Shared query and utility functions used by pages/components
export function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}



// ──  Template functions ─────────────────────────────────────────────────────────
export async function fetchTemplate(userId) {
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
  return data;
}

export async function createTemplate(templateData) {
  try {
    const res = await fetch(
      "http://localhost:5000/api/AHFULtemplate/create",
      {
        method: "POST",
        credentials: 'include',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      },
    );
    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || `Server returned ${res.status}` };
    }

    return { success: true, data };
  } catch (err) {
    console.error("createTemplate error:", err);
    const msg = err && err.message ? err.message : "Failed to create template";
    return { error: msg };
  }
}


// ── Gym Functions ─────────────────────────────────────────────────────────

export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AHFULApp/1.0" },
    });
    if (!res.ok) {
      throw new Error(`Geocoding API returned ${res.status}`);
    }
    const data = await res.json();
    return data.display_name || null;
  } catch (err) {
    console.error("reverseGeocode error:", err);
    return null;
  }
}

export async function forwardGeocode(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AHFULApp/1.0" },credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Geocoding API returned ${res.status}`);
    }
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
    return null;
  } catch (err) {
    console.error("forwardGeocode error:", err);
    return null;
  }
}

export async function fetchGym(gymId) {
  try {
    const res = await fetch(`http://localhost:5000/api/AHFULgyms/${gymId}`, {credentials: 'include'});
    if (!res.ok) {
      throw new Error(`Failed to fetch gym: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    console.error("fetchGym error:", err);
    return null;
  }
}
export async function fetchAllGyms() {
  try {
    const res = await fetch("http://localhost:5000/api/AHFULgyms", {
      credentials: "include"
    });
    if (!res.ok) {
      let bodyText = "";
      try { bodyText = await res.text(); } catch (e) { /* ignore */ }
      throw new Error(`Server returned ${res.status} ${res.statusText} ${bodyText}`);
    }
    const data = await res.json();
    let list = [];
    if (Array.isArray(data)) { list = data; }
    else if (data && Array.isArray(data.data)) { list = data.data; }
    else if (data && Array.isArray(data.results)) { list = data.results; }
    else { list = []; }
    return list;
  } catch (err) {
    console.error("fetchAllGyms error:", err);
    const friendly = err && err.name ? `${err.name}: ${err.message}` : String(err);
    throw new Error(friendly || "Unknown error");
  }
}

export async function createGym(gymData) {
  try {
    const res = await fetch("http://localhost:5000/api/AHFULgyms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gymData),
      credentials: "include"
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || `Server returned ${res.status}` };
    }
    return { success: true, data };
  } catch (err) {
    console.error("createGym error:", err);
    return { error: err.message || "Failed to create gym" };
  }
}

export async function deleteGym(gymId) {
  try {
    const res = await fetch(`http://localhost:5000/api/AHFULgyms/delete/${gymId}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to delete gym: ${res.status} ${err}`);
    }
    return { success: true };
  } catch (err) {
    console.error("deleteGym error:", err);
    return { error: err.message || "Failed to delete gym" };
  }
}


export async function fetchAllPromos() {
  try {
    const res = await fetch("http://localhost:5000/api/promotions", {
      credentials: "include"
    });

    if (!res.ok) {
      let bodyText = "";
      try { bodyText = await res.text(); } catch (e) { /* ignore */ }
      throw new Error(`Server returned ${res.status} ${res.statusText} ${bodyText}`);
    }

    const data = await res.json();

    let list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && Array.isArray(data.data)) {
      list = data.data;
    } else if (data && Array.isArray(data.results)) {
      list = data.results;
    } else {
      list = [];
    }

    return list;
  } catch (err) {
    console.error("fetchAllPromos error:", err);
    const friendly =
      err && err.name ? `${err.name}: ${err.message}` : String(err);
    throw new Error(friendly || "Unknown error");
  }
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

export async function fetchExercisesFromBackend() {
  const res = await fetch("http://localhost:5000/api/AHFULexercises", {credentials: 'include'});
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

export async function updateTask(taskId, updates) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULtasks/update/${taskId}`,
      {
        method: "PUT",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
    if (!res.ok) throw new Error("Failed to update task");
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error("updateTask error:", err);
    return { error: err.message || "Failed to update task" };
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


// ── Task Favorite Functions ──────────────────────────────────────────
export async function toggleTaskFavorite(taskId) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULtasks/${taskId}/favorite`,
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
    return { data: data.task, error: null };
  } catch (err) {
    console.error("toggleTaskFavorite error:", err);
    return { data: null, error: err.message };
  }
}

export async function getTaskFavorites(userId) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULtasks/favorites/${userId}`,
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
    console.error("getTaskFavorites error:", err);
    return { data: null, error: err.message };
  }
}