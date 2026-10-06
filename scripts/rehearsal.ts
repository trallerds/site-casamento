/**
 * Ensaio do casamento: simula o dia no servidor real (local)
 * com o banco de producao, e remove tudo o que criar no final.
 *
 * Rodar com o servidor de pe:
 *   set -a && . ./.env.local && set +a && npm run start -- --port 3100
 *   set -a && . ./.env.local && set +a && node --import tsx scripts/rehearsal.ts
 *
 * Cobre: jornada do convidado, rajada de fotos (limite de
 * taxa), rajada de Pix e conexao ruim. Idempotencia e conciliação
 * sao cobertas por wedding-rules.test.ts.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { sql, run } from "../src/lib/db";
import { parseBrCode } from "../src/lib/pix/brcode";

const BASE = process.env.REHEARSAL_BASE_URL ?? "http://localhost:3100";
const STAGING_DIR = path.join(process.cwd(), "data", "staging");

let failures = 0;
function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`   ✓ ${label}`);
  } else {
    failures++;
    console.log(`   ✗ ${label}${detail ? ` -- ${detail}` : ""}`);
  }
}

async function createTestGift() {
  const [row] = await sql<{ id: number }>(
    `INSERT INTO gifts (slug, name, amount_cents, active, category)
     VALUES ($1, 'Ensaio do casamento (teste)', 50000, 1, 'Pix livre')
     RETURNING id`,
    [`test-rehearsal-${Date.now()}`],
  );
  return row.id;
}

async function postPayment(giftId: number) {
  return fetch(`${BASE}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ giftId }),
  });
}

async function uploadPhoto(jpeg: Buffer) {
  const form = new FormData();
  form.append("photo", new File([new Uint8Array(jpeg)], "ensaio.jpg", { type: "image/jpeg" }));
  return fetch(`${BASE}/api/photos`, { method: "POST", body: form });
}

async function main() {
  const jpeg = await fs.readFile("public/logo.jpg");

  console.log("1/4 jornada do convidado");
  const giftId = await createTestGift();
  const created = await postPayment(giftId);
  const createdBody = (await created.json()) as { publicId?: string };
  check("criacao retorna 201", created.status === 201, `status ${created.status}`);
  const publicId = createdBody.publicId ?? "";
  check("publicId devolvido", publicId.length > 0);

  const statusRes = await fetch(`${BASE}/api/payments/${publicId}`);
  const statusBody = (await statusRes.json()) as {
    status?: string;
    createdAt?: string;
  };
  check(
    "status pendente com data ISO",
    statusBody.status === "pending" &&
      statusBody.createdAt?.endsWith("Z") === true,
    JSON.stringify(statusBody),
  );

  const codeRes = await fetch(`${BASE}/api/payments/${publicId}/pix-code`, {
    method: "POST",
  });
  const codeBody = (await codeRes.json()) as { pixCopyPaste?: string };
  const br = parseBrCode(codeBody.pixCopyPaste ?? "");
  check(
    "BR Code valido (CRC, valor e txid)",
    br.crcValid === true && br.amount === "500.00" && br.txid === publicId,
    `crc=${br.crcValid} amount=${br.amount} txid=${br.txid}`,
  );

  const listHtml = await (await fetch(`${BASE}/presentes`)).text();
  check("presente ativo aparece na lista", listHtml.includes("Ensaio do casamento"));

  console.log("2/4 rajada de fotos: 25 concorrentes (limite 20/h)");
  await run(
    `DELETE FROM rate_limit WHERE bucket ~ '^(photos|payments|pixcode):(::1|127\\.0\\.0\\.1)$'`,
  );
  const photoAttempts = await Promise.all(
    Array.from({ length: 25 }, () => uploadPhoto(jpeg)),
  );
  const accepted = photoAttempts.filter((r) => r.status === 202);
  const rejected = photoAttempts.filter((r) => r.status === 429);
  const rejectedWithRetry = await Promise.all(
    rejected.map((r) => r.headers.get("retry-after")),
  );
  check(
    "20 aceitos (202) + 5 recusados (429)",
    accepted.length === 20 && rejected.length === 5,
    `202=${accepted.length} 429=${rejected.length}`,
  );
  check(
    "429 traz Retry-After",
    rejectedWithRetry.every((value) => value != null && Number(value) > 0),
  );

  const photoIds: string[] = [];
  for (const response of accepted) {
    const body = (await response.json()) as { publicId?: string };
    if (body.publicId) photoIds.push(body.publicId);
  }
  const photoRows = await sql<{ public_id: string; status: string; staging_key: string | null }>(
    `SELECT public_id, status, staging_key FROM photo_uploads WHERE public_id = ANY($1::text[])`,
    [photoIds],
  );
  check(
    "todas as fotos aceitas ficaram em fila (failed, retryaveis)",
    photoRows.length === 20 && photoRows.every((row) => row.status === "failed"),
    `rows=${photoRows.length}`,
  );
  const stagedFiles = await Promise.all(
    photoIds.map((id) =>
      fs.stat(path.join(STAGING_DIR, `${id}.jpg`)).then(
        () => true,
        () => false,
      ),
    ),
  );
  check(
    "cada foto em fila tem copia em staging",
    stagedFiles.every(Boolean),
    `${stagedFiles.filter(Boolean).length}/${stagedFiles.length}`,
  );

  console.log("3/4 rajada de Pix: 45 concorrentes (limite 40/h)");
  await run(
    `DELETE FROM rate_limit WHERE bucket ~ '^(photos|payments|pixcode):(::1|127\\.0\\.0\\.1)$'`,
  );
  const paymentAttempts = await Promise.all(
    Array.from({ length: 45 }, () => postPayment(giftId)),
  );
  const created201 = paymentAttempts.filter((r) => r.status === 201);
  const rejected429 = paymentAttempts.filter((r) => r.status === 429);
  check(
    "40 criados (201) + 5 recusados (429)",
    created201.length === 40 && rejected429.length === 5,
    `201=${created201.length} 429=${rejected429.length}`,
  );
  console.log("4/4 conexao ruim (request abortado no meio)");
  const [beforeRow] = await sql<{ n: number }>(
    `SELECT count(*)::int AS n FROM payments WHERE gift_id = $1`,
    [giftId],
  );
  const controller = new AbortController();
  const abortedPromise = fetch(`${BASE}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ giftId }),
    signal: controller.signal,
  });
  controller.abort();
  await abortedPromise.catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const [afterRow] = await sql<{ n: number; bad: number }>(
    `SELECT count(*)::int AS n, count(*) FILTER (WHERE status <> 'pending')::int AS bad
     FROM payments WHERE gift_id = $1`,
    [giftId],
  );
  const extraCreated = Number(afterRow.n) - Number(beforeRow.n);
  check(
    "aborto nao deixa pagamento confirmado",
    Number(afterRow.bad) === 0,
    `bad=${afterRow.bad}`,
  );
  check(
    "aborto cria no maximo 1 pendente (o handler pode terminar)",
    extraCreated >= 0 && extraCreated <= 1,
    `extra=${extraCreated}`,
  );

  console.log("limpeza");
  const paymentIds = (
    await sql<{ id: number }>(`SELECT id FROM payments WHERE gift_id = $1`, [giftId])
  ).map((row) => row.id);
  if (paymentIds.length > 0) {
    await run(`DELETE FROM payment_events WHERE payment_id = ANY($1::bigint[])`, [paymentIds]);
    await run(`DELETE FROM payments WHERE id = ANY($1::bigint[])`, [paymentIds]);
  }
  await run(`DELETE FROM gifts WHERE id = $1`, [giftId]);
  if (photoIds.length > 0) {
    await run(`DELETE FROM photo_uploads WHERE public_id = ANY($1::text[])`, [photoIds]);
  }
  await fs.rm(STAGING_DIR, { recursive: true, force: true });
  await run(
    `DELETE FROM rate_limit WHERE bucket ~ '^(photos|payments|pixcode):(::1|127\\.0\\.0\\.1)$'`,
  );
  console.log("   ✓ ensaio removido do banco");

  if (failures > 0) {
    console.error(`\nENSAIO FALHOU: ${failures} verificacao(oes)`);
    process.exit(1);
  }
  console.log("\nENSAIO OK: o site aguenta o dia.");
}

main().catch((error) => {
  console.error("ENSAIO FALHOU:", error instanceof Error ? error.message : error);
  process.exit(1);
});
