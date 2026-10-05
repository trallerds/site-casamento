import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatDateTime, toIso } from "./format";

/**
 * O pg devolve timestamptz como "2026-10-05 02:10:29.999739+00".
 * Antes da correção, formatDateTime colava "Z" no final e o Date
 * rejeitava — o painel mostrava a string crua do banco.
 */
describe("datas do banco", () => {
  test("timestamptz com offset vira data formatada em pt-BR", () => {
    // 22:17Z = 19:17 em Sao Paulo (horario do casamento).
    const formatted = formatDateTime("2026-10-04 22:17:00.123456+00");
    assert.equal(formatted, "04/10/26, 19:17");
  });

  test("toIso normaliza timestamptz para ISO", () => {
    assert.equal(toIso("2026-10-04 22:17:00.123456+00"), "2026-10-04T22:17:00.123Z");
  });

  test("ISO que ja vem pronto nao e alterado", () => {
    assert.equal(toIso("2026-10-04T22:17:00.000Z"), "2026-10-04T22:17:00.000Z");
  });

  test("offset negativo tambem parseia", () => {
    assert.equal(toIso("2026-10-04 19:17:00-03"), "2026-10-04T22:17:00.000Z");
  });

  test("offset de 4 digitos nao e duplicado", () => {
    assert.equal(toIso("2026-10-04 22:17:00+0000"), "2026-10-04T22:17:00.000Z");
  });

  test("nulo vira nulo, lixo vira a string original", () => {
    assert.equal(toIso(null), null);
    assert.equal(formatDateTime(null), "—");
    assert.equal(formatDateTime("não é data"), "não é data");
  });
});
