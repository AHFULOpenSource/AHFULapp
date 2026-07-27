export async function updateTask(taskId, updates) {
  try {
    const res = await fetch(
      `https://www.ahful.app/api/AHFULtasks/update/${taskId}`,
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

// ── Task Favorite Functions ──────────────────────────────────────────
export async function toggleTaskFavorite(taskId) {
  try {
    const res = await fetch(
      `https://www.ahful.app/api/AHFULtasks/${taskId}/favorite`,
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
      `https://www.ahful.app/api/AHFULtasks/favorites/${userId}`,
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