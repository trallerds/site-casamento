import { getDb } from "@/lib/db";
import { findPaymentByPublicId } from "@/lib/queries";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = rateLimit(`claim:${clientIp(request)}`, 20, 60 * 60 * 1000);
  if (!guard.allowed) return tooManyRequests(guard.retryAfterSeconds);

  const { id } = await params;
  const payment = findPaymentByPublicId(id);
  if (!payment) return Response.json({ error: "Cobrança não encontrada." }, { status: 404 });

  getDb()
    .prepare(
      `UPDATE payments SET claimed_at = COALESCE(claimed_at, datetime('now')), updated_at = datetime('now')
       WHERE id = ?`,
    )
    .run(payment.id);

  return Response.json({ registered: true, status: payment.status });
}