// ──  Authentication  functions ─────────────────────────────────────────────────────────

export async function updateUserSettings(userId, settings) {
  const res = await fetch(
    `https://www.ahful.app/api/AHFULuserSettings/update/${userId}`,
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
