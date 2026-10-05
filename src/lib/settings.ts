import { cache } from "react";
import { run, sql } from "@/lib/db";

/**
 * cache() do React deduplica leituras de settings dentro da mesma
 * requisicao: cabecalho, rodape e metadata liam wedding_names, e
 * o provedor Pix le pix_key — sem isso, cada chamada e uma query.
 */
export const getSetting = cache(async (key: string): Promise<string | null> => {
  const [row] = await sql<{ value: string }>(`SELECT value FROM settings WHERE key = $1`, [key]);
  return row?.value ?? null;
});

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await sql<{ key: string; value: string }>(`SELECT key, value FROM settings`);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function setSetting(key: string, value: string) {
  await run(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`,
    [key, value],
  );
}

export const SETTING_KEYS = [
  "wedding_names",
  "wedding_date",
  "hero_title",
  "story_title",
  "story_text",
  "pix_recipient_name",
  "pix_provider",
  "photo_storage",
  "pix_key_payload",
  "pix_key",
  "pix_recipient_city",
  "pix_provider_config",
  "google_drive_config",
  "google_drive_folder_id",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export async function weddingNames() {
  return (await getSetting("wedding_names")) || process.env.WEDDING_NAMES || "Jéssica & Jennifer";
}

export async function weddingDate() {
  return (await getSetting("wedding_date")) || process.env.WEDDING_DATE || "";
}

export async function weddingDateLabel() {
  const raw = await weddingDate();
  if (!raw) return "";
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}