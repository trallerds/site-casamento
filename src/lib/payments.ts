import type { PoolClient } from "pg";
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

export type SaleResult = {
  soldOut: boolean;
  remaining: number | null;
};

/**
 * Baixa uma cota do presente. A condição no WHERE garante que duas pessoas
 * não comprem a última unidade ao mesmo tempo: só uma requisição afeta linhas.
 */
async function claimGiftUnit(client: PoolClient, giftId: number): Promise<SaleResult> {
  const updated = await client.query(
    `UPDATE gifts SET sold_quantity = sold_quantity + 1, updated_at = now()
     WHERE id = $1 AND total_quantity - sold_quantity > 0`,
    [giftId],
  );

  if ((updated.rowCount ?? 0) > 0) {
    const { rows } = await client.query<{ available: number }>(
      `SELECT total_quantity - sold_quantity AS available FROM gifts WHERE id = $1`,
      [giftId],
    );
    return { soldOut: false, remaining: rows[0]?.available ?? null };
  }

  const { rows } = await client.query<{ available: number }>(
    `SELECT total_quantity - sold_quantity AS available FROM gifts WHERE id = $1`,
    [giftId],
  );
  return { soldOut: true, remaining: rows[0]?.available ?? 0 };
}

export async function markPaymentPaid(options: {
  paymentId: number;
  providerEventId: string;
  eventType: string;
  payload: string;
}): Promise<{ alreadyProcessed: boolean; updated: boolean; sale: SaleResult | null }> {
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

    await client.query(
      `UPDATE payments
       SET status = 'paid', paid_at = COALESCE(paid_at, now()), updated_at = now()
       WHERE id = $1`,
      [options.paymentId],
    );

    const sale = await claimGiftUnit(client, payment.gift_id);
    if (sale.soldOut) {
      await client.query(`UPDATE payments SET oversold = 1 WHERE id = $1`, [options.paymentId]);
    }

    return { alreadyProcessed: false, updated: true, sale };
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