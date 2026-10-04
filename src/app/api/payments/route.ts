import { findGiftById, isGiftAvailable } from "@/lib/queries";
import { createPaymentForGift } from "@/lib/payments";
import { PixError } from "@/lib/pix";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function limit() {
  const parsed = Number(process.env.RATE_LIMIT_PAYMENTS_PER_HOUR);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 40;
}

export async function POST(request: Request) {
  const guard = await rateLimit(`payments:${clientIp(request)}`, limit(), 60 * 60 * 1000);
  if (!guard.allowed) return tooManyRequests(guard.retryAfterSeconds);

  let giftId = 0;
  try {
    const body = (await request.json()) as { giftId?: unknown };
    giftId = Number(body.giftId);
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!Number.isInteger(giftId) || giftId <= 0) {
    return Response.json({ error: "Presente inválido." }, { status: 400 });
  }

  const gift = await findGiftById(giftId);
  if (!gift || !gift.active) {
    return Response.json({ error: "Presente indisponível." }, { status: 404 });
  }

  if (!isGiftAvailable(gift)) {
    return Response.json(
      { error: "Este presente já acabou de esgotar. Escolha outro na lista." },
      { status: 409 },
    );
  }

  if (gift.amount_cents <= 0) {
    return Response.json(
      { error: "Este presente aceita qualquer valor. Fale com a gente no dia." },
      { status: 409 },
    );
  }

  try {
    const payment = await createPaymentForGift(gift);
    return Response.json({ publicId: payment.publicId }, { status: 201 });
  } catch (error) {
    if (error instanceof PixError) {
      return Response.json(
        { error: "Não conseguimos gerar o Pix agora. Tente novamente em alguns instantes." },
        { status: error.status },
      );
    }
    return Response.json(
      { error: "Não conseguimos gerar o Pix agora. Tente novamente em alguns instantes." },
      { status: 502 },
    );
  }
}