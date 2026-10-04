import { getDb } from "@/lib/db";

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare<[string], { value: string }>(`SELECT value FROM settings WHERE key = ?`)
    .get(key);
  return row?.value ?? null;
}

export function getSettings(): Record<string, string> {
  const rows = getDb()
    .prepare<[], { key: string; value: string }>(`SELECT key, value FROM settings`)
    .all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    )
    .run(key, value);
}

export const SETTING_KEYS = [
  "wedding_names",
  "wedding_date",
  "hero_title",
  "story_title",
  "story_text",
  "pix_recipient_name",
  "site_active",
  "pix_provider",
  "photo_storage",
  "pix_key_payload",
  "pix_key",
  "pix_recipient_city",
  "pix_provider_config",
  "google_drive_config",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export function weddingNames() {
  return getSetting("wedding_names") || process.env.WEDDING_NAMES || "Jéssica & Jennifer";
}

export function weddingDate() {
  return getSetting("wedding_date") || process.env.WEDDING_DATE || "";
}

export function weddingDateLabel() {
  const raw = weddingDate();
  if (!raw) return "";
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}