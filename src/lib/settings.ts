import { cache } from "react";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const getSetting = cache(async (key: string): Promise<string | null> => {
  const db = await getDb();
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row?.value ?? null;
});

export async function getSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  await db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: sql`now()` },
    });
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
