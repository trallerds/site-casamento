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

export type SaleResult = {
  soldOut: boolean;
  remaining: number | null;
};

/**
 * Baixa uma cota do presente. A condição no WHERE garante que duas pessoas
 * não comprem a última unidade ao mesmo tempo: só uma requisição afeta linhas.
 */
function claimGiftUnit(giftId: number): SaleResult {
  const db = getDb();
  const updated = db
    .prepare(
      `UPDATE gifts SET sold_quantity = sold_quantity + 1, updated_at = datetime('now')
       WHERE id = ? AND total_quantity - sold_quantity > 0`,
    )
    .run(giftId);

  if (updated.changes > 0) {
    const row = db
      .prepare<[number], { available: number }>(
        `SELECT total_quantity - sold_quantity AS available FROM gifts WHERE id = ?`,
      )
      .get(giftId);
    return { soldOut: false, remaining: row?.available ?? null };
  }

  const row = db
    .prepare<[number], { available: number }>(
      `SELECT total_quantity - sold_quantity AS available FROM gifts WHERE id = ?`,
    )
    .get(giftId);
  return { soldOut: true, remaining: row?.available ?? 0 };
}

export function markPaymentPaid(options: {
  paymentId: number;
  providerEventId: string;
  eventType: string;
  payload: string;
}): { alreadyProcessed: boolean; updated: boolean; sale: SaleResult | null } {
  const db = getDb();

  const run = db.transaction(() => {
    const inserted = db
      .prepare(
        `INSERT OR IGNORE INTO payment_events
          (payment_id, provider_event_id, event_type, payload, processed_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
      )
      .run(options.paymentId, options.providerEventId, options.eventType, options.payload);

    if (inserted.changes === 0) return { alreadyProcessed: true, updated: false, sale: null };

    const payment = db
      .prepare<[number], Payment>(`SELECT * FROM payments WHERE id = ?`)
      .get(options.paymentId);

    if (!payment || payment.status === "paid") {
      return { alreadyProcessed: false, updated: false, sale: null };
    }

    db.prepare(
      `UPDATE payments
       SET status = 'paid', paid_at = COALESCE(paid_at, datetime('now')), updated_at = datetime('now')
       WHERE id = ?`,
    ).run(options.paymentId);

    const sale = claimGiftUnit(payment.gift_id);
    if (sale.soldOut) {
      db.prepare(`UPDATE payments SET oversold = 1 WHERE id = ?`).run(options.paymentId);
    }

    return { alreadyProcessed: false, updated: true, sale };
  });

  return run();
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