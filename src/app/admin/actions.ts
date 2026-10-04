"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  createAdminSession,
  isAdminEnabled,
  isAuthenticated,
  setSessionCookie,
  verifyAdminPassword,
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseAmountToCents, slugify } from "@/lib/format";
import { retryFailedPhoto } from "@/lib/photos";
import { getSetting, setSetting, SETTING_KEYS } from "@/lib/settings";

export type LoginState = { error?: string };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminEnabled()) {
    return { error: "A área administrativa está desativada: defina ADMIN_PASSWORD_HASH." };
  }
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { error: "Senha incorreta." };
  }
  const session = createAdminSession();
  await setSessionCookie(session.token, session.expiresAt);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}

async function requireAdmin() {
  if (!(await isAuthenticated())) redirect("/admin/login");
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function saveGiftAction(formData: FormData) {
  await requireAdmin();

  const id = Number(field(formData, "id") || 0);
  const name = field(formData, "name");
  const description = field(formData, "description");
  const amountCents = parseAmountToCents(field(formData, "amount"));
  const category = field(formData, "category") || "Momentos da festa";
  const imageKey = field(formData, "image_key") || "default";
  const displayOrder = Number(field(formData, "display_order") || 0);
  const active = formData.get("active") ? 1 : 0;

  if (!name || amountCents === null) {
    redirect("/admin/presentes?erro=nome-valor");
  }

  const db = getDb();
  if (id) {
    db.prepare(
      `UPDATE gifts
       SET name = ?, description = ?, amount_cents = ?, category = ?, image_key = ?,
           display_order = ?, active = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(name, description, amountCents ?? 0, category, imageKey, displayOrder, active, id);
  } else {
    const base = slugify(name) || `presente-${Date.now()}`;
    let slug = base;
    let suffix = 2;
    while (db.prepare(`SELECT 1 FROM gifts WHERE slug = ?`).get(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    db.prepare(
      `INSERT INTO gifts (slug, name, description, image_key, amount_cents, category, display_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(slug, name, description, imageKey, amountCents ?? 0, category, displayOrder, active);
  }

  revalidatePath("/admin/presentes");
  revalidatePath("/admin");
  revalidatePath("/presentes");
  redirect("/admin/presentes?salvo=1");
}

export async function toggleGiftAction(formData: FormData) {
  await requireAdmin();
  const id = Number(field(formData, "id"));
  if (!id) return;
  getDb()
    .prepare(`UPDATE gifts SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?`)
    .run(id);
  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
}

export async function confirmPaymentAction(formData: FormData) {
  await requireAdmin();
  const id = Number(field(formData, "id"));
  if (!id) return;
  const db = getDb();
  const marked = db.transaction(() => {
    db.prepare(
      `INSERT OR IGNORE INTO payment_events
        (payment_id, provider_event_id, event_type, payload, processed_at)
       VALUES (?, ?, 'manual.confirmed', 'confirmado no painel', datetime('now'))`,
    ).run(id, `manual:${id}`);
    db.prepare(
      `UPDATE payments
       SET status = 'paid', confirmed_by_admin = 1, paid_at = COALESCE(paid_at, datetime('now')),
           updated_at = datetime('now')
       WHERE id = ?`,
    ).run(id);
  });
  marked();
  revalidatePath("/admin/pagamentos");
  revalidatePath("/admin");
}

export async function cancelPaymentAction(formData: FormData) {
  await requireAdmin();
  const id = Number(field(formData, "id"));
  if (!id) return;
  getDb()
    .prepare(`UPDATE payments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`)
    .run(id);
  revalidatePath("/admin/pagamentos");
  revalidatePath("/admin");
}

export async function hidePhotoAction(formData: FormData) {
  await requireAdmin();
  const publicId = field(formData, "public_id");
  if (!publicId) return;
  getDb().prepare(`UPDATE photo_uploads SET hidden = 1 WHERE public_id = ?`).run(publicId);
  revalidatePath("/admin/fotos");
  revalidatePath("/admin");
}

export async function retryPhotoAction(formData: FormData) {
  await requireAdmin();
  const publicId = field(formData, "public_id");
  if (publicId) await retryFailedPhoto(publicId);
  revalidatePath("/admin/fotos");
  revalidatePath("/admin");
}

const SECRET_FIELDS = ["apiKey", "clientId", "clientSecret", "refreshToken", "folderId"];
const SECRET_SETTINGS = ["pix_provider_config", "google_drive_config"] as const;

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();

  for (const key of SETTING_KEYS) {
    if (SECRET_SETTINGS.includes(key as (typeof SECRET_SETTINGS)[number])) continue;
    const value = formData.get(key);
    if (typeof value === "string") setSetting(key, value);
  }

  for (const key of SECRET_SETTINGS) {
    const submitted: Record<string, string> = {};
    for (const field of SECRET_FIELDS) {
      const value = formData.get(`${key}[${field}]`);
      if (typeof value === "string" && value.trim() !== "") submitted[field] = value.trim();
    }
    setSetting(key, mergeSecretConfig(getSetting(key), submitted));
  }

  revalidatePath("/");
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin");
  redirect("/admin/configuracoes?salvo=1");
}

function mergeSecretConfig(current: string | null, incoming: Record<string, string>) {
  const previous = (() => {
    if (!current) return {} as Record<string, string>;
    try {
      return JSON.parse(current) as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  })();

  const merged = { ...previous, ...incoming };
  return Object.keys(merged).length === 0 ? "" : JSON.stringify(merged);
}