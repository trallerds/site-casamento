import Database from "better-sqlite3";

const db = new Database("data/deixa-aqui.db");

db.prepare(
  `INSERT OR REPLACE INTO gifts
    (slug, name, description, image_key, amount_cents, category, display_order, total_quantity, sold_quantity, active)
   VALUES ('teste-cota', 'Teste Cota', 'x', 'default', 1000, 'Teste', 999, 1, 0, 0)`,
).run();

const gift = db.prepare(`SELECT * FROM gifts WHERE slug = 'teste-cota'`).get();

for (let i = 1; i <= 3; i += 1) {
  const publicId = `pg${i}`;
  db.prepare(
    `INSERT INTO payments (public_id, gift_id, provider, provider_charge_id, amount_cents, status, pix_code)
     VALUES (?, ?, 'manual', ?, 1000, 'pending', 'x')`,
  ).run(publicId, gift.id, `manual_${publicId}`);

  const row = db.prepare(`SELECT id FROM payments WHERE public_id = ?`).get(publicId);
  const result = db
    .prepare(
      `UPDATE gifts SET sold_quantity = sold_quantity + 1, updated_at = datetime('now')
       WHERE id = ? AND total_quantity - sold_quantity > 0`,
    )
    .run(gift.id);

  if (result.changes === 0) {
    db.prepare(`UPDATE payments SET oversold = 1 WHERE id = ?`).run(row.id);
  }

  const verdict =
    result.changes === 1 ? "cota vendida" : "sem cota -> oversold sinalizado";
  console.log(`concorrencia ${i}: linhas afetadas=${result.changes} -> ${verdict}`);
}

const final = db
  .prepare(`SELECT total_quantity, sold_quantity FROM gifts WHERE slug = 'teste-cota'`)
  .get();
const oversold = db.prepare(`SELECT COUNT(*) AS c FROM payments WHERE oversold = 1`).get().c;

console.log(`final: vendido ${final.sold_quantity}/${final.total_quantity} | oversold=${oversold}`);
console.log(
  `visivel na lista publica? ${final.total_quantity - final.sold_quantity > 0 ? "SIM (ERRO)" : "NAO (correto)"}`,
);

db.prepare(`DELETE FROM gifts WHERE slug = 'teste-cota'`).run();
db.prepare(`DELETE FROM payments WHERE public_id IN ('pg1', 'pg2', 'pg3')`).run();
console.log("teste limpo");