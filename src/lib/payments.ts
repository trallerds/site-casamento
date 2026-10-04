import { getDb, type Gift, type Payment } from "@/lib/db";
import { randomId } from "@/lib/format";
import { getPixProvider, PixError } from "@/lib/pix";
import { weddingNames } from "@/lib/settings";

const EXPIRY_HOURS = 24;

export async function createPaymentForGift(gift: Gift) {
  const provider = getPixProvider();
  const publicId = randomId(14);
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

  const charge = await provider.createCharge({
    amountCents: gift.amount_cents,
    reference: publicId,
    description: `${weddingNames()} - ${gift.name}`,
    paymentPublicId: publicId,
    expiresAt: provider.supportsWebhooks ? expiresAt : null,
  });

  const result = await getDb()
    .prepare(
      `INSERT INTO payments
        (public_id, gift_id, provider, provider_charge_id, amount_cents, status, pix_code, expires_at)
       VALUES (@public_id, @gift_id, @provider, @provider_charge_id, @amount_cents, 'pending', @pix_code, @expires_at)
       RETURNING id`,
    )
    .run({
      public_id: publicId,
      gift_id: gift.id,
      provider: charge.provider,
      provider_charge_id: charge.providerChargeId,
      amount_cents: gift.amount_cents,
      pix_code: charge.pixCopyPaste,
      expires_at: charge.expiresAt ?? expiresAt.toISOString(),
    });

  return { id: Number(result.rows[0]?.id), publicId };
}

export type SaleResult = {
  soldOut: boolean;
  remaining: number | null;
};

async function claimGiftUnit(giftId: number): Promise<SaleResult> {
  const db = getDb();
  const updated = await db
    .prepare(
      `UPDATE gifts SET sold_quantity = sold_quantity + 1, updated_at = now()
       WHERE id = ? AND total_quantity - sold_quantity > 0`,
    )
    .run(giftId);

  if (updated.rowCount > 0) {
    const row = await db
      .prepare<[number], { available: number }>(
        `SELECT total_quantity - sold_quantity AS available FROM gifts WHERE id = ?`,
      )
      .get(giftId);
    return { soldOut: false, remaining: row?.available ?? null };
  }

  const row = await db
    .prepare<[number], { available: number }>(
      `SELECT total_quantity - sold_quantity AS available FROM gifts WHERE id = ?`,
    )
    .get(giftId);
  return { soldOut: true, remaining: row?.available ?? 0 };
}

export async function markPaymentPaid(options: {
  paymentId: number;
  providerEventId: string;
  eventType: string;
  payload: string;
}): Promise<{ alreadyProcessed: boolean; updated: boolean; sale: SaleResult | null }> {
  const db = getDb();

  const run = await db.transaction(async (tx) => {
    const inserted = await tx
      .prepare(
        `INSERT INTO payment_events
          (payment_id, provider_event_id, event_type, payload, processed_at)
         VALUES (?, ?, ?, ?, now())
         ON CONFLICT (provider_event_id) DO NOTHING
         RETURNING id`,
      )
      .run(options.paymentId, options.providerEventId, options.eventType, options.payload);

    if (inserted.rowCount === 0) return { alreadyProcessed: true, updated: false, sale: null };

    const payment = await tx
      .prepare<[number], Payment>(`SELECT * FROM payments WHERE id = ?`)
      .get(options.paymentId);

    if (!payment || payment.status === "paid") {
      return { alreadyProcessed: false, updated: false, sale: null };
    }

    await tx
      .prepare(
        `UPDATE payments
         SET status = 'paid', paid_at = COALESCE(paid_at, now()), updated_at = now()
         WHERE id = ?`,
      )
      .run(options.paymentId);

    const sale = await claimGiftUnit(payment.gift_id);
    if (sale.soldOut) {
      await tx.prepare(`UPDATE payments SET oversold = 1 WHERE id = ?`).run(options.paymentId);
    }

    return { alreadyProcessed: false, updated: true, sale };
  });

  return run;
}

export async function registerPaymentEvent(event: {
  providerEventId: string;
  eventType: string;
  payload: string;
  paymentId: number | null;
}) {
  return getDb()
    .prepare(
      `INSERT INTO payment_events
        (payment_id, provider_event_id, event_type, payload, received_at)
       VALUES (?, ?, ?, ?, now())
       ON CONFLICT (provider_event_id) DO NOTHING`,
    )
    .run(event.paymentId, event.providerEventId, event.eventType, event.payload);
}

export { PixError };