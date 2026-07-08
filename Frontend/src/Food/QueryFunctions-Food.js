const API_BASE = "http://localhost:5000/api/AHFULfoods";

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


//Fetch Specific Food
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

export async function fetchAllFood() {
  try {
    const res = await fetch("http://localhost:5000/api/AHFULfoods", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        error: data.error || "Failed to fetch all foods",
      };
    }
    return data;
  } catch (err) {
    console.error("Failed to fetch all foods:", err);
    return {
      error: err.message || "Failed to fetch all foods",
    };
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