// ──  Authentication  functions ─────────────────────────────────────────────────────────

export async function updateUserSettings(userId, settings) {
  const res = await fetch(
    `http://localhost:5000/api/AHFULuserSettings/update/${userId}`,
    {
      method: "PUT",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    },
  );
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}
