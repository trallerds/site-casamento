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
import { run, sql } from "@/lib/db";
import { parseAmountToCents, slugify } from "@/lib/format";
import { markPaymentPaid } from "@/lib/payments";
import { retryFailedPhoto } from "@/lib/photos";
import { getSetting, setSetting, SETTING_KEYS } from "@/lib/settings";

export type LoginState = { error?: string };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminEnabled()) {
    return { error: "O painel ainda não está pronto para acesso. Confira a configuração inicial e tente novamente." };
  }
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { error: "Não foi possível entrar. Confira a senha e tente novamente." };
  }
  const session = await createAdminSession();
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

  if (id) {
    await run(
      `UPDATE gifts
       SET name = $1, description = $2, amount_cents = $3, category = $4, image_key = $5,
           display_order = $6, active = $7, updated_at = now()
       WHERE id = $8`,
      [
        name,
        description,
        amountCents ?? 0,
        category,
        imageKey,
        displayOrder,
        active,
        id,
      ],
    );
  } else {
    const base = slugify(name) || `presente-${Date.now()}`;
    let slug = base;
    let suffix = 2;
    while ((await sql(`SELECT 1 FROM gifts WHERE slug = $1`, [slug])).length > 0) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    await run(
      `INSERT INTO gifts
        (slug, name, description, image_key, amount_cents, category, display_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        slug,
        name,
        description,
        imageKey,
        amountCents ?? 0,
        category,
        displayOrder,
        active,
      ],
    );
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
  await run(
    `UPDATE gifts SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = now() WHERE id = $1`,
    [id],
  );
  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
}

export async function confirmPaymentAction(formData: FormData) {
  await requireAdmin();
  const id = Number(field(formData, "id"));
  if (!id) return;
  const [payment] = await sql<{ gift_id: number; status: string }>(
    `SELECT gift_id, status FROM payments WHERE id = $1`,
    [id],
  );
  if (!payment || payment.status === "paid") return;
  await markPaymentPaid({
    paymentId: id,
    providerEventId: `manual:${id}`,
    eventType: "manual.confirmed",
    payload: "confirmado no painel",
  });
  await run(`UPDATE payments SET confirmed_by_admin = 1 WHERE id = $1`, [id]);
  revalidatePath("/admin/pagamentos");
  revalidatePath("/admin");
  revalidatePath("/presentes");
}

export async function cancelPaymentAction(formData: FormData) {
  await requireAdmin();
  const id = Number(field(formData, "id"));
  if (!id) return;
  // Pago nao se cancela: o dinheiro ja entrou.
  await run(
    `UPDATE payments SET status = 'cancelled', updated_at = now()
     WHERE id = $1 AND status <> 'paid'`,
    [id],
  );
  revalidatePath("/admin/pagamentos");
  revalidatePath("/admin");
}

export async function hidePhotoAction(formData: FormData) {
  await requireAdmin();
  const publicId = field(formData, "public_id");
  if (!publicId) return;
  await run(`UPDATE photo_uploads SET hidden = 1 WHERE public_id = $1`, [publicId]);
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
    if (typeof value === "string") await setSetting(key, value);
  }

  for (const key of SECRET_SETTINGS) {
    const submitted: Record<string, string> = {};
    for (const field of SECRET_FIELDS) {
      const value = formData.get(`${key}[${field}]`);
      if (typeof value === "string" && value.trim() !== "") submitted[field] = value.trim();
    }
    await setSetting(key, mergeSecretConfig(await getSetting(key), submitted));
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
