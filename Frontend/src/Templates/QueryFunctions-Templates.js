// ──  Template functions ─────────────────────────────────────────────────────────
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