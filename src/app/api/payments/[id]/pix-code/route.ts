import { findPaymentByPublicId } from "@/lib/queries";
import { looksLikePixPayload } from "@/lib/pix/brcode";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await rateLimit(`pixcode:${clientIp(request)}`, 30, 60 * 60 * 1000);
  if (!guard.allowed) return tooManyRequests(guard.retryAfterSeconds);

  const { id } = await params;
  const payment = await findPaymentByPublicId(id);
  if (!payment) return Response.json({ error: "Cobrança não encontrada." }, { status: 404 });

  if (!payment.pix_code || !looksLikePixPayload(payment.pix_code)) {
    return Response.json({ error: "Pix indisponível para esta cobrança." }, { status: 503 });
  }

  return Response.json(
    { pixCopyPaste: payment.pix_code, status: payment.status },
    { headers: { "Cache-Control": "no-store" } },
  );
}