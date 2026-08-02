const API_BASE = "http://localhost:5000/api/AHFULfoods";

export async function fetchFood(userId) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULfoods/${userId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        error: data.error || "Failed to fetch foods",
      };
    }

    const sorted = (Array.isArray(data) ? data : [])
      .sort((a, b) => (b.time || 0) - (a.time || 0))
      .slice(0, 15);

    return sorted;

  } catch (err) {
    console.error("Failed to fetch foods:", err);

    return {
      error: err.message || "Failed to fetch foods",
    };
  }
}

export async function searchUSDAFoods(query) {
  try {
    const res = await fetch(`${API_BASE}/search/usda?q=${encodeURIComponent(query)}&limit=8`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) return { data: [], error: data.error || "USDA search failed" };
    return { data: data.foods || [], error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

export async function createFood(foodData) {
  try {
    const res = await fetch(`${API_BASE}/create`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(foodData)
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: data.error || "Failed to create food" };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function fetchFoodById(foodId) {
  try {
    const res = await fetch(`${API_BASE}/id/${foodId}`, { credentials: "include" });
    if (!res.ok) return { data: null, error: "Failed to fetch food" };
    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function updateFood(id, foodData) {
  try {
    const res = await fetch(`${API_BASE}/update/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(foodData)
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: data.error || "Failed to update food" };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function deleteFood(id) {
  try {
    const res = await fetch(`${API_BASE}/delete/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) return { error: "Failed to delete food" };
    return { data: { id }, error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Food Favorite Functions ──────────────────────────────────────────
export async function toggleFoodFavorite(foodId) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULfoods/${foodId}/favorite`,
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
    const food = data.food || data;
    return { data: food, error: null };
  } catch (err) {
    console.error("toggleFoodFavorite error:", err);
    return { data: null, error: err.message };
  }
}

export async function getFoodFavorites(userId) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/AHFULfoods/favorites/${userId}`,
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
    console.error("getFoodFavorites error:", err);
    return { data: null, error: err.message };
  }
}
