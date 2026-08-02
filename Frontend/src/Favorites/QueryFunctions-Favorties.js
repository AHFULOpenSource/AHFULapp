export async function getWorkoutFavorites(userId) {
  try {
    const res = await fetch(
      `https://www.ahful.app/api/AHFULworkouts/favorites/${userId}`,
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
