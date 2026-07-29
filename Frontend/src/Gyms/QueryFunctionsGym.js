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