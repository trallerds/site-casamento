import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, describe, test } from "node:test";
import { run, sql } from "./db";
import { markPaymentPaid, registerPaymentEvent } from "./payments";
import { listActiveGifts } from "./queries";
import { rateLimit } from "./rate-limit";
import { retryFailedPhoto } from "./photos";
import { localStorage } from "./storage/local";

/**
 * Regras de dinheiro do Deixa Aqui. Roda contra um banco de teste: apague as
 * tabelas gift/payment que comecam com "test-" se rodar contra producao.
 */
async function newGift(slug: string) {
  const [row] = await sql<{ id: number }>(
    `INSERT INTO gifts (slug, name, amount_cents, active)
     VALUES ($1, $2, 1000, 1) RETURNING id`,
    [slug, slug],
  );
  return row.id;
}

async function newPayment(giftId: number, tag: string) {
  const [row] = await sql<{ id: number }>(
    `INSERT INTO payments (public_id, gift_id, provider, provider_charge_id, amount_cents, status)
     VALUES ($1, $2, 'test', $1, 1000, 'pending') RETURNING id`,
    [`pub-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, giftId],
  );
  return row.id;
}

const pay = (paymentId: number, eventId: string) =>
  markPaymentPaid({ paymentId, providerEventId: eventId, eventType: "charge.paid", payload: "{}" });

describe("presentes sem limite de quantidade", () => {
  test("contribuicoes nao limitam o presente nem o removem da lista", async () => {
    const giftId = await newGift("test-sem-limite");
    const first = await newPayment(giftId, "a");
    const second = await newPayment(giftId, "b");
    await Promise.all([pay(first, "evt-sem-limite-1"), pay(second, "evt-sem-limite-2")]);

    assert.ok(
      (await listActiveGifts()).some((gift) => gift.slug === "test-sem-limite"),
      "presente ativo continua na lista apos contribuicoes",
    );
  });
});

describe("webhook: idempotencia", () => {
  test("mesmo providerEventId nunca confirma o pagamento duas vezes", async () => {
    const giftId = await newGift("test-idem");
    const paymentId = await newPayment(giftId, "d");

    const first = await pay(paymentId, "evt-idem-1");
    assert.equal(first.updated, true);

    const replay = await pay(paymentId, "evt-idem-1");
    assert.equal(replay.alreadyProcessed, true, "replay do mesmo evento deve ser reconhecido");
    assert.equal(replay.updated, false, "replay nao pode re-aplicar o pagamento");

  });

  test("webhook com valor divergente nao marca como pago", async () => {
    const giftId = await newGift("test-valor");
    const paymentId = await newPayment(giftId, "e");

    // O registro e 1000 centavos; o webhook diz 999.
    const wrong = await markPaymentPaid({
      paymentId,
      providerEventId: "evt-valor-1",
      eventType: "charge.paid",
      payload: "{}",
      amountCents: 999,
    });
    assert.equal(wrong.updated, false, "valor divergente nao pode confirmar");
    assert.equal(wrong.amountMismatch, true);

    const [row] = await sql<{ status: string; error: string | null }>(
      `SELECT status, error FROM payments WHERE id = $1`,
      [paymentId],
    );
    assert.equal(row.status, "pending", "pagamento continua pendente");
    assert.ok(row.error?.includes("999"), "motivo fica visivel para conciliacao");
  });

  test("webhook com valor correto confirma o pagamento", async () => {
    const giftId = await newGift("test-valor-ok");
    const paymentId = await newPayment(giftId, "f");

    const ok = await markPaymentPaid({
      paymentId,
      providerEventId: "evt-valor-ok-1",
      eventType: "charge.paid",
      payload: "{}",
      amountCents: 1000,
    });
    assert.equal(ok.updated, true);
  });

  test("registerPaymentEvent guarda so um registro por evento do provedor", async () => {
    const event = {
      providerEventId: `evt-reg-${Date.now()}`,
      eventType: "charge.updated",
      payload: "{}",
      paymentId: null,
    };
    await registerPaymentEvent(event);
    await registerPaymentEvent(event);

    const [row] = await sql<{ n: number }>(
      `SELECT count(*)::int AS n FROM payment_events WHERE provider_event_id = $1`,
      [event.providerEventId],
    );
    assert.equal(row.n, 1);
  });
});

describe("taxa: janela", () => {
  test("limite segura na janela e reseta em ate 1 hora", async () => {
    const bucket = `test-rate-${Date.now()}`;

    const first = await rateLimit(bucket, 2, 60 * 60 * 1000);
    const second = await rateLimit(bucket, 2, 60 * 60 * 1000);
    assert.equal(first.allowed, true);
    assert.equal(second.allowed, true);
    assert.equal(second.remaining, 0);

    const third = await rateLimit(bucket, 2, 60 * 60 * 1000);
    assert.equal(third.allowed, false, "o limite precisa segurar");
    assert.ok(
      third.retryAfterSeconds > 1 && third.retryAfterSeconds <= 3600,
      `reset deve ser ate 1 hora, foi ${third.retryAfterSeconds}s`,
    );
  });
});

describe("foto: retry", () => {
  test("upload que falhou volta no retry usando a copia em staging", async () => {
    const publicId = `test-retry-${Date.now()}`;
    const stagingDir = path.join(process.cwd(), "data", "staging");
    await fs.mkdir(stagingDir, { recursive: true });
    await fs.writeFile(
      path.join(stagingDir, `${publicId}.jpg`),
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]),
    );

    await run(
      `INSERT INTO photo_uploads
         (public_id, original_filename, mime_type, size_bytes, storage_provider, status, staging_key, error)
       VALUES ($1, 'foto.jpg', 'image/jpeg', 11, 'local', 'failed', $2, 'drive indisponivel')`,
      [publicId, `staging/${publicId}.jpg`],
    );

    // storage explicito: o teste nao depende do provedor configurado no banco
    const result = await retryFailedPhoto(publicId, localStorage);
    assert.equal(result.ok, true, `retry falhou: ${result.message}`);

    const [row] = await sql<{ status: string; error: string | null }>(
      `SELECT status, error FROM photo_uploads WHERE public_id = $1`,
      [publicId],
    );
    assert.equal(row.status, "uploaded");
    assert.equal(row.error, null, "erro anterior precisa ser limpo depois do retry");
  });
});

after(async () => {
  await fs.rm(path.join(process.cwd(), "data", "staging"), { recursive: true, force: true });
  await run(`DELETE FROM photo_uploads WHERE public_id LIKE 'test-retry-%'`);
  // Pagamentos de teste podem vir de qualquer provider (o
  // ensaio cria os dele via API), entao a limpeza apaga
  // primeiro pelos gifts de teste, senao a FK de payments
  // trava o DELETE dos gifts e o residuo se acumula.
  await run(
    `DELETE FROM payment_events WHERE payment_id IN
       (SELECT id FROM payments WHERE gift_id IN
          (SELECT id FROM gifts WHERE slug LIKE 'test-%'))`,
  );
  await run(
    `DELETE FROM payments WHERE gift_id IN
       (SELECT id FROM gifts WHERE slug LIKE 'test-%')`,
  );
  await run(`DELETE FROM payments WHERE provider = 'test'`);
  await run(`DELETE FROM gifts WHERE slug LIKE 'test-%'`);
  await run(`DELETE FROM rate_limit WHERE bucket LIKE 'test-rate-%'`);
});
