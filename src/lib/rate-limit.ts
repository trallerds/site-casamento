import { run, sql } from "@/lib/db";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number; remaining: number };

/**
 * Contador de janela fixa no Postgres: sobrevive a cold start e e
 * compartilhado entre as instancias da Vercel, ao contrario de um
 * Map em memoria.
 *
 * A janela e calculada aqui em segundos e passada como parametro:
 * o epoch do Postgres e em segundos, e misturar com a janela em
 * milissegundos gerava janelas de ~41 dias em vez de 1 hora --
 * num WiFi de festa, 20 fotos bloqueavam todos por semanas.
 *
 * ponytail: janela fixa permite ate 2x o limite na virada da
 * janela. Troque por janela movel ou Redis se aparecer abuso de
 * verdade.
 */
export async function rateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.floor(windowMs / 1000));
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStartSeconds =
    Math.floor(nowSeconds / windowSeconds) * windowSeconds;

  const [row] = await sql<{ hits: number; reset_at: string }>(
    `INSERT INTO rate_limit (bucket, window_start, hits)
     VALUES ($1, to_timestamp($2), 1)
     ON CONFLICT (bucket, window_start) DO UPDATE SET hits = rate_limit.hits + 1
     RETURNING hits, to_timestamp($2 + $3) AS reset_at`,
    [bucket, windowStartSeconds, windowSeconds],
  );

  const hits = Number(row.hits);
  const allowed = hits <= limit;
  const resetAt = new Date(row.reset_at).getTime();

  return {
    allowed,
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
    remaining: Math.max(0, limit - hits),
  };
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequests(retryAfterSeconds: number) {
  return Response.json(
    { error: "Estamos recebendo muitos envios deste aparelho. Aguarde um instante e tente novamente." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export async function purgeRateLimitBuckets() {
  await run(`DELETE FROM rate_limit WHERE window_start < now() - interval '2 days'`);
}
