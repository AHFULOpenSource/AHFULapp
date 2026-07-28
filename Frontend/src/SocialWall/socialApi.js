// Small wrapper around social-related backend endpoints
const BASE = "https://www.ahful.app/api/AHFULsocial";

async function safeJson(res) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function getPendingForCurrentUser() {
  try {
    const res = await fetch(`${BASE}/pending`, {
      method: "GET",
      credentials: "include",
      mode: "cors",
      headers: { Accept: "application/json" },
    });
    const data = await safeJson(res);
    if (!res.ok) return { error: (data && data.error) || `Server ${res.status}` };
    return { success: true, data };
  } catch (err) {
    console.error("getPendingForCurrentUser error:", err);
    return { error: err.message || "Network error" };
  }
}

export async function getFriendsForCurrentUser() {
  try {
    const res = await fetch(`${BASE}/user`, {
      method: "GET",
      credentials: "include",
      mode: "cors",
      headers: { Accept: "application/json" },
    });
    const data = await safeJson(res);
    if (!res.ok) return { error: (data && data.error) || `Server ${res.status}` };
    return { success: true, data };
  } catch (err) {
    console.error("getFriendsForCurrentUser error:", err);
    return { error: err.message || "Network error" };
  }
}

export async function createFriendRequest(email) {
  try {
    const res = await fetch(`${BASE}/request`, {
      method: "POST",
      credentials: "include",
      mode: "cors",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await safeJson(res);
    if (!res.ok) return { error: (data && data.error) || `Server ${res.status}` };
    return { success: true, data };
  } catch (err) {
    console.error("createFriendRequest error:", err);
    return { error: err.message || "Network error" };
  }
}

export async function acceptFriendRequest(friendshipId) {
  try {
    const res = await fetch(`${BASE}/accept/${friendshipId}`, {
      method: "PUT",
      credentials: "include",
      mode: "cors",
      headers: { Accept: "application/json" },
    });
    const data = await safeJson(res);
    if (!res.ok) return { error: (data && data.error) || `Server ${res.status}` };
    return { success: true, data };
  } catch (err) {
    console.error("acceptFriendRequest error:", err);
    return { error: err.message || "Network error" };
  }
}

export async function deleteFriendship(friendshipId) {
  try {
    const res = await fetch(`${BASE}/delete/${friendshipId}`, {
      method: "DELETE",
      credentials: "include",
      mode: "cors",
      headers: { Accept: "application/json" },
    });
    const data = await safeJson(res);
    if (!res.ok) return { error: (data && data.error) || `Server ${res.status}` };
    return { success: true, data };
  } catch (err) {
    console.error("deleteFriendship error:", err);
    return { error: err.message || "Network error" };
  }
}

export default {
  getPendingForCurrentUser,
  getFriendsForCurrentUser,
  createFriendRequest,
  acceptFriendRequest,
  deleteFriendship,
};
