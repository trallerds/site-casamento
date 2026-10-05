import crypto from "node:crypto";
import { cookies } from "next/headers";
import { run, sql } from "@/lib/db";

const COOKIE_NAME = "deixa_aqui_admin";
const SESSION_DAYS = 7;

export function hashSecret(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function timingSafeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export function isAdminEnabled() {
  return Boolean(process.env.ADMIN_PASSWORD_HASH);
}

export function verifyAdminPassword(password: string) {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored || !password) return false;
  return timingSafeEqual(hashSecret(password), stored.trim());
}

export async function createAdminSession() {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashSecret(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  // Cada login reaproveita a limpeza: sessoes expiradas
  // nao se acumulam na tabela.
  await purgeExpiredSessions();
  await run(`INSERT INTO admin_sessions (token_hash, expires_at) VALUES ($1, $2)`, [
    tokenHash,
    expiresAt.toISOString(),
  ]);
  return { token, expiresAt };
}

export async function deleteAdminSession(token: string) {
  await run(`DELETE FROM admin_sessions WHERE token_hash = $1`, [hashSecret(token)]);
}

export async function purgeExpiredSessions() {
  await run(`DELETE FROM admin_sessions WHERE expires_at < now()`);
}

export async function getAdminSessionToken() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function isAuthenticated() {
  if (!isAdminEnabled()) return false;
  const token = await getAdminSessionToken();
  if (!token) return false;
  const [row] = await sql<{ expires_at: string }>(
    `SELECT expires_at FROM admin_sessions WHERE token_hash = $1`,
    [hashSecret(token)],
  );
  if (!row) return false;
  return new Date(row.expires_at).getTime() > Date.now();
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const token = await getAdminSessionToken();
  if (token) await deleteAdminSession(token);
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function unauthorized() {
  return Response.json({ error: "Não autorizado" }, { status: 401 });
}