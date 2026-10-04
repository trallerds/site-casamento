import { getDb, type Gift, type Payment, type PhotoUpload } from "@/lib/db";

export type GiftRow = Gift;
export type PaymentRow = Payment;
export type PhotoRow = PhotoUpload;
export type GiftTotalsRow = {
  gift_id: number;
  name: string;
  slug: string;
  amount_cents: number;
  active: number;
  total_quantity: number;
  sold_quantity: number;
  contributions: number;
  paid_cents: number;
  pending_count: number;
};
export type StatsRow = {
  photos_total: number;
  photos_uploaded: number;
  photos_failed: number;
  payments_paid: number;
  payments_pending: number;
  gifts_sold_out: number;
  payments_oversold: number;
  payments_unreconciled: number;
  paid_cents: number;
};
export type PaymentJoinedRow = Payment & { gift_name: string; gift_slug: string };

export function listActiveGifts() {
  return getDb()
    .prepare<[], GiftRow>(
      `SELECT * FROM gifts
       WHERE active = 1 AND total_quantity - sold_quantity > 0
       ORDER BY display_order ASC, id ASC`,
    )
    .all();
}

export function isGiftAvailable(gift: GiftRow) {
  return gift.active === 1 && gift.total_quantity - gift.sold_quantity > 0;
}

export function listAllGifts() {
  return getDb()
    .prepare<[], GiftRow>(`SELECT * FROM gifts ORDER BY display_order ASC, id ASC`)
    .all();
}

export function listGiftsGrouped() {
  const groups = new Map<string, GiftRow[]>();
  for (const gift of listActiveGifts()) {
    const list = groups.get(gift.category) ?? [];
    list.push(gift);
    groups.set(gift.category, list);
  }
  return [...groups.entries()];
}

export function findGiftBySlug(slug: string) {
  return getDb()
    .prepare<[string], GiftRow>(`SELECT * FROM gifts WHERE slug = ?`)
    .get(slug);
}

export function findGiftById(id: number) {
  return getDb()
    .prepare<[number], GiftRow>(`SELECT * FROM gifts WHERE id = ?`)
    .get(id);
}

export function findPaymentByPublicId(publicId: string) {
  return getDb()
    .prepare<[string], PaymentRow>(`SELECT * FROM payments WHERE public_id = ?`)
    .get(publicId);
}

export function findPaymentByProviderChargeId(providerChargeId: string) {
  return getDb()
    .prepare<[string], PaymentRow>(`SELECT * FROM payments WHERE provider_charge_id = ?`)
    .get(providerChargeId);
}

export function giftPaymentTotals() {
  return getDb()
    .prepare<[], GiftTotalsRow>(`
      SELECT g.id AS gift_id,
             g.name AS name,
             g.slug AS slug,
             g.amount_cents AS amount_cents,
             g.active AS active,
             g.total_quantity AS total_quantity,
             g.sold_quantity AS sold_quantity,
             COUNT(p.id) AS contributions,
             COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_cents ELSE 0 END), 0) AS paid_cents,
             COALESCE(SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count
      FROM gifts g
      LEFT JOIN payments p ON p.gift_id = g.id
      GROUP BY g.id
      ORDER BY g.display_order ASC, g.id ASC
    `)
    .all();
}

export function dashboardStats(): StatsRow {
  const row = getDb()
    .prepare<[], StatsRow>(`
      SELECT
        (SELECT COUNT(*) FROM photo_uploads WHERE hidden = 0) AS photos_total,
        (SELECT COUNT(*) FROM photo_uploads WHERE hidden = 0 AND status = 'uploaded') AS photos_uploaded,
        (SELECT COUNT(*) FROM photo_uploads WHERE hidden = 0 AND status = 'failed') AS photos_failed,
        (SELECT COUNT(*) FROM payments WHERE status = 'paid') AS payments_paid,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending') AS payments_pending,
        (SELECT COUNT(*) FROM gifts WHERE total_quantity - sold_quantity <= 0) AS gifts_sold_out,
        (SELECT COUNT(*) FROM payments WHERE oversold = 1) AS payments_oversold,
        (SELECT COUNT(*) FROM payments WHERE claimed_at IS NOT NULL AND status != 'paid') AS payments_unreconciled,
        (SELECT COALESCE(SUM(amount_cents), 0) FROM payments WHERE status = 'paid') AS paid_cents
    `)
    .get();

  return (
    row ?? {
      photos_total: 0,
      photos_uploaded: 0,
      photos_failed: 0,
      payments_paid: 0,
      payments_pending: 0,
      gifts_sold_out: 0,
      payments_oversold: 0,
      payments_unreconciled: 0,
      paid_cents: 0,
    }
  );
}

export function listPayments(limit = 200) {
  return getDb()
    .prepare<[number], PaymentJoinedRow>(
      `SELECT p.*, g.name AS gift_name, g.slug AS gift_slug
       FROM payments p
       JOIN gifts g ON g.id = p.gift_id
       ORDER BY p.id DESC
       LIMIT ?`,
    )
    .all(limit);
}

export function listPhotos(limit = 200) {
  return getDb()
    .prepare<[number], PhotoRow>(
      `SELECT * FROM photo_uploads WHERE hidden = 0 ORDER BY id DESC LIMIT ?`,
    )
    .all(limit);
}