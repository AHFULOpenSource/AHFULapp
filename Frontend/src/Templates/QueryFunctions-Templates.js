// ──  Template functions ─────────────────────────────────────────────────────────
export async function fetchTemplate(userId) {
  const res = await fetch(
    `https://www.ahful.app/api/AHFULtemplate/user`,{
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
      "https://www.ahful.app/api/AHFULtemplate/create",
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