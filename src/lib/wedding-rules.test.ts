import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { run, sql } from "./db";
import { markPaymentPaid, registerPaymentEvent } from "./payments";
import { listActiveGifts } from "./queries";
import { retryFailedPhoto } from "./photos";

/**
 * Regras de dinheiro do Deixa Aqui. Roda contra um banco de teste: apague as
 * tabelas gift/payment que comecam com "test-" se rodar contra producao.
 */
async function newGift(slug: string, total: number) {
  const [row] = await sql<{ id: number }>(
    `INSERT INTO gifts (slug, name, amount_cents, total_quantity, active)
     VALUES ($1, $2, 1000, $3, 1) RETURNING id`,
    [slug, slug, total],
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

async function available(giftId: number) {
  const [row] = await sql<{ d: number }>(
    `SELECT total_quantity - sold_quantity AS d FROM gifts WHERE id = $1`,
    [giftId],
  );
  return Number(row.d);
}

const pay = (paymentId: number, eventId: string) =>
  markPaymentPaid({ paymentId, providerEventId: eventId, eventType: "charge.paid", payload: "{}" });

describe("presente: cota", () => {
  test("ultima cota vendida a um so nao permite compra dupla", async () => {
    const giftId = await newGift("test-cota-unica", 1);
    const first = await newPayment(giftId, "a");
    const second = await newPayment(giftId, "b");

    // Disparado em paralelo de proposito: e a corrida real de duas requisicoes
    // em instancias distintas da Vercel, nao duas chamadas em fila.
    const [winner, loser] = await Promise.all([pay(first, "evt-cota-1"), pay(second, "evt-cota-2")]);

    const soldOut = [winner, loser].filter((result) => result.sale?.soldOut === true);
    assert.equal(soldOut.length, 1, "exatamente um dos dois deve ficar fora das cotas");
    assert.equal(await available(giftId), 0, "nenhuma cota pode sobrar nem ser vendida duas vezes");

    const oversold = await sql<{ id: number }>(
      `SELECT id FROM payments WHERE id = ANY($1::bigint[]) AND oversold = 1`,
      [[first, second]],
    );
    assert.equal(oversold.length, 1, "o pagamento fora das cotas precisa ficar visivel no painel");
  });

  test("presente pago some da lista de disponiveis", async () => {
    const slug = "test-sai-da-lista";
    const giftId = await newGift(slug, 1);

    assert.ok(
      (await listActiveGifts()).some((gift) => gift.slug === slug),
      "presente com cota deve aparecer antes do pagamento",
    );

    await pay(await newPayment(giftId, "c"), "evt-lista-1");

    assert.ok(
      !(await listActiveGifts()).some((gift) => gift.slug === slug),
      "presente esgotado nao pode continuar sendo ofertado",
    );
  });
});

describe("webhook: idempotencia", () => {
  test("mesmo providerEventId nunca baixa a cota duas vezes", async () => {
    const giftId = await newGift("test-idem", 3);
    const paymentId = await newPayment(giftId, "d");

    const first = await pay(paymentId, "evt-idem-1");
    assert.equal(first.updated, true);

    const replay = await pay(paymentId, "evt-idem-1");
    assert.equal(replay.alreadyProcessed, true, "replay do mesmo evento deve ser reconhecido");
    assert.equal(replay.updated, false, "replay nao pode re-aplicar o pagamento");

    assert.equal(await available(giftId), 2, "cota deve ter baixado uma unica vez");
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

    const result = await retryFailedPhoto(publicId);
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
  await run(`DELETE FROM photo_uploads WHERE public_id LIKE 'test-retry-%'`);
  await run(`DELETE FROM payment_events WHERE provider_event_id LIKE 'evt-%'`);
  await run(`DELETE FROM payments WHERE provider = 'test'`);
  await run(`DELETE FROM gifts WHERE slug LIKE 'test-%'`);
});