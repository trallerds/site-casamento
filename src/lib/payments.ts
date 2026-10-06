import { run, sql, tx, type Gift, type Payment } from "@/lib/db";
import { randomId } from "@/lib/format";
import { getPixProvider, PixError } from "@/lib/pix";
import { weddingNames } from "@/lib/settings";

const EXPIRY_HOURS = 24;

export async function createPaymentForGift(gift: Gift) {
  const provider = await getPixProvider();
  const publicId = randomId(14);
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

  const charge = await provider.createCharge({
    amountCents: gift.amount_cents,
    reference: publicId,
    description: `${await weddingNames()} - ${gift.name}`,
    paymentPublicId: publicId,
    expiresAt: provider.supportsWebhooks ? expiresAt : null,
  });

  const [row] = await sql<{ id: number }>(
    `INSERT INTO payments
      (public_id, gift_id, provider, provider_charge_id, amount_cents, status, pix_code, expires_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
     RETURNING id`,
    [
      publicId,
      gift.id,
      charge.provider,
      charge.providerChargeId,
      gift.amount_cents,
      charge.pixCopyPaste,
      charge.expiresAt ?? expiresAt.toISOString(),
    ],
  );

  return { id: row.id, publicId };
}

export async function markPaymentPaid(options: {
  paymentId: number;
  providerEventId: string;
  eventType: string;
  payload: string;
  amountCents?: number | null;
}): Promise<{
  alreadyProcessed: boolean;
  updated: boolean;
  amountMismatch?: boolean;
}> {
  return tx(async (client) => {
    const inserted = await client.query(
      `INSERT INTO payment_events
        (payment_id, provider_event_id, event_type, payload, processed_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (provider_event_id) DO NOTHING`,
      [options.paymentId, options.providerEventId, options.eventType, options.payload],
    );

    if ((inserted.rowCount ?? 0) === 0) return { alreadyProcessed: true, updated: false, sale: null };

    const { rows: paymentRows } = await client.query<Payment>(
      `SELECT * FROM payments WHERE id = $1`,
      [options.paymentId],
    );
    const payment = paymentRows[0];

    if (!payment || payment.status === "paid") {
      return { alreadyProcessed: false, updated: false, sale: null };
    }

    // O valor verdadeiro e o do banco, nao o que o front-end manda.
    // Webhook com valor divergente fica visivel no painel para conciliacao manual.
    if (
      options.amountCents != null &&
      Number(options.amountCents) !== payment.amount_cents
    ) {
      await client.query(
        `UPDATE payments SET error = $2, updated_at = now() WHERE id = $1`,
        [
          payment.id,
          `Webhook reportou ${Number(options.amountCents)} centavos, esperados ${payment.amount_cents}. Confirmado manualmente?`,
        ],
      );
      return { alreadyProcessed: false, updated: false, sale: null, amountMismatch: true };
    }

    await client.query(
      `UPDATE payments
       SET status = 'paid', paid_at = COALESCE(paid_at, now()), updated_at = now()
       WHERE id = $1`,
      [options.paymentId],
    );

    return { alreadyProcessed: false, updated: true, sale: null };
  });
}

export async function registerPaymentEvent(event: {
  providerEventId: string;
  eventType: string;
  payload: string;
  paymentId: number | null;
}) {
  await run(
    `INSERT INTO payment_events
      (payment_id, provider_event_id, event_type, payload, received_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (provider_event_id) DO NOTHING`,
    [event.paymentId, event.providerEventId, event.eventType, event.payload],
  );
}

export { PixError };
