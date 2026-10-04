import { getDb, type Gift } from "@/lib/db";
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

  const result = getDb()
    .prepare(
      `INSERT INTO payments
        (public_id, gift_id, provider, provider_charge_id, amount_cents, status, pix_code, expires_at)
       VALUES (@public_id, @gift_id, @provider, @provider_charge_id, @amount_cents, 'pending', @pix_code, @expires_at)`,
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

  return { id: Number(result.lastInsertRowid), publicId };
}

export function markPaymentPaid(
  options: { paymentId: number; providerEventId: string; eventType: string; payload: string },
) {
  const db = getDb();
  const record = db.transaction(() => {
    const inserted = db
      .prepare(
        `INSERT OR IGNORE INTO payment_events (payment_id, provider_event_id, event_type, payload, processed_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
      )
      .run(options.paymentId, options.providerEventId, options.eventType, options.payload);

    if (inserted.changes === 0) return { alreadyProcessed: true, updated: false };

    db.prepare(
      `UPDATE payments
       SET status = 'paid', paid_at = COALESCE(paid_at, datetime('now')), updated_at = datetime('now')
       WHERE id = ? AND status != 'paid'`,
    ).run(options.paymentId);

    return { alreadyProcessed: false, updated: true };
  });
  return record();
}

export function registerPaymentEvent(event: {
  providerEventId: string;
  eventType: string;
  payload: string;
  paymentId: number | null;
}) {
  return getDb()
    .prepare(
      `INSERT OR IGNORE INTO payment_events
        (payment_id, provider_event_id, event_type, payload, received_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    )
    .run(event.paymentId, event.providerEventId, event.eventType, event.payload);
}

export { PixError };