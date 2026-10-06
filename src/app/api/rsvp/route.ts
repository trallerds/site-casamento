import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { normalizeRsvpSubmission } from "@/lib/rsvp";
import { weddingNames } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) return Response.json({ error: "Requisição inválida." }, { status: 413 });

  const limit = await rateLimit(`rsvp:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 4096) return Response.json({ error: "Requisição inválida." }, { status: 413 });
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const submission = normalizeRsvpSubmission(body);
  if (!submission) {
    return Response.json(
      { error: "Informe seu nome e sobrenome e use até cinco acompanhantes." },
      { status: 400 },
    );
  }

  const endpoint = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!endpoint || !secret) {
    return Response.json({ error: "Confirmação indisponível." }, { status: 503 });
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "appendRsvp", couple: await weddingNames(), ...submission, secret }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    const result = await response.json() as { ok?: boolean; message?: unknown };
    if (!response.ok || result.ok !== true) {
      console.error("[RSVP] Apps Script rejected confirmation", {
        status: response.status,
        reason: typeof result.message === "string" ? result.message.slice(0, 200) : "No reason returned",
      });
      return Response.json({ error: "Não foi possível registrar a confirmação." }, { status: 502 });
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[RSVP] Submission failed", error);
    return Response.json({ error: "Não foi possível registrar a confirmação." }, { status: 502 });
  }
}
