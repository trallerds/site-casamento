function cleanName(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100)
    : "";
}

export function normalizeRsvpSubmission(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const payload = body as { name?: unknown; companions?: unknown };
  if (payload.companions != null && !Array.isArray(payload.companions)) return null;
  const name = cleanName(payload.name);
  const rawCompanions = Array.isArray(payload.companions) ? payload.companions : [];
  const companions = rawCompanions.map(cleanName).filter(Boolean);
  if (!name || rawCompanions.length > 5 || companions.length > 5) return null;
  return { name, companions };
}
