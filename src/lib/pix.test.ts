import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildBrCode, crc16, looksLikePixPayload, parseBrCode } from "./pix/brcode";

/**
 * BR Code do Pix. O payload do banco emissor entra como referencia: e o unico
 * exemplo que ja passou na mao de um app de banco de verdade.
 */
const DO_BANCO =
  "00020101021126580014br.gov.bcb.pix013699a05137-dfa8-4a69-9701-f96c8a2b5a53" +
  "5204000053039865802BR5919JESSICA C GONCALVES6009PARANAGUA62070503***63047E08";

const KEY = "99a05137-dfa8-4a69-9701-f96c8a2b5a53";

describe("BR Code", () => {
  test("o CRC do payload do banco fecha com a nossa implementacao", () => {
    assert.equal(crc16(DO_BANCO.slice(0, -4)), "7E08");
  });

  test("le o payload do banco", () => {
    const parsed = parseBrCode(DO_BANCO);
    assert.equal(parsed.crcValid, true);
    assert.equal(parsed.key, KEY);
    assert.equal(parsed.recipientName, "JESSICA C GONCALVES");
    assert.equal(parsed.city, "PARANAGUA");
    assert.equal(parsed.txid, "***");
  });

  test("template do BACCT sai em minusculas, como o banco escreve", () => {
    const payload = buildBrCode({ key: KEY, recipientName: "JESSICA C GONCALVES", amountCents: 9000, txid: "abc123" });
    assert.ok(payload.includes("0014br.gov.bcb.pix"), "template precisa ser br.gov.bcb.pix, em minusculas");
    assert.ok(!payload.includes("BR.GOV.BCB.PIX"), "template em maiuscula quebra reader que compara byte a byte");
  });

  test("nome do casal nao vaza & nem acento para o campo 59", () => {
    const payload = buildBrCode({ key: KEY, recipientName: "Jéssica & Jennifer", amountCents: 9000, txid: "abc123" });
    const { recipientName } = parseBrCode(payload);
    assert.equal(recipientName, "JESSICA JENNIFER");
    assert.ok(recipientName && recipientName.length <= 25, `campo 59 tem limite de 25: ${recipientName}`);
  });

  test("cidade e normalizada", () => {
    const payload = buildBrCode({ key: KEY, recipientName: "Fulano", amountCents: 100, txid: "t1", city: " paranagua " });
    assert.equal(parseBrCode(payload).city, "PARANAGUA");
  });

  test("valor e CRC do que geramos", () => {
    const payload = buildBrCode({ key: KEY, recipientName: "Fulano", amountCents: 12345, txid: "t1" });
    const parsed = parseBrCode(payload);
    assert.equal(parsed.crcValid, true);
    assert.equal(parsed.amount, "123.45");
    assert.equal(parsed.key, KEY);
  });

  test("aceita payload em qualquer caixa nos dois sentidos", () => {
    assert.equal(looksLikePixPayload(DO_BANCO), true);
    assert.equal(looksLikePixPayload(DO_BANCO.toUpperCase()), true);
    assert.equal(looksLikePixPayload("nao-e-pix"), false);
  });
});