import { findPaymentByProviderChargeId } from "@/lib/queries";
import { getPixProvider } from "@/lib/pix";
import { markPaymentPaid, registerPaymentEvent } from "@/lib/payments";
import { randomId } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const provider = getPixProvider();
  if (!provider.supportsWebhooks) {
    return Response.json({ error: "Webhook desativado neste provedor." }, { status: 404 });
  }

  const rawBody = await request.text();
  let event;
  try {
    event = await provider.parseWebhook(request, rawBody);
  } catch {
    return Response.json({ error: "Evento inválido." }, { status: 400 });
  }

  if (!event) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const payment = findPaymentByProviderChargeId(event.providerChargeId);
  if (!payment) {
    registerPaymentEvent({
      providerEventId: event.eventId || randomId(8),
      eventType: event.type,
      payload: rawBody.slice(0, 4000),
      paymentId: null,
    });
    return Response.json({ received: true, matched: false });
  }

  const isPaid = event.type.toLowerCase().includes("paid") || Boolean(event.paidAt);
  if (!isPaid) {
    registerPaymentEvent({
      providerEventId: event.eventId || randomId(8),
      eventType: event.type,
      payload: rawBody.slice(0, 4000),
      paymentId: payment.id,
    });
    return Response.json({ received: true, matched: true, applied: false });
  }

  const result = markPaymentPaid({
    paymentId: payment.id,
    providerEventId: event.eventId || `${event.type}:${event.providerChargeId}`,
    eventType: event.type,
    payload: rawBody.slice(0, 4000),
  });

  return Response.json({ received: true, matched: true, applied: result.updated });
}