import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalizeRsvpSubmission } from "./rsvp";

describe("normalizacao do RSVP", () => {
  test("sanitiza nomes e aceita ate cinco acompanhantes", () => {
    assert.deepEqual(
      normalizeRsvpSubmission({ name: "  Joana\n Silva ", companions: [" Alex ", null, "Bia"] }),
      { name: "Joana Silva", companions: ["Alex", "Bia"] },
    );
  });

  test("rejeita nome incompleto, forma invalida e mais de cinco acompanhantes", () => {
    assert.equal(normalizeRsvpSubmission({ name: " \n " }), null);
    assert.equal(normalizeRsvpSubmission({ name: "Joana" }), null);
    assert.equal(normalizeRsvpSubmission(null), null);
    assert.equal(normalizeRsvpSubmission({ name: "Joana", companions: "Bia" }), null);
    assert.equal(normalizeRsvpSubmission({ name: "Joana", companions: ["1", "2", "3", "4", "5", "6"] }), null);
  });
});
