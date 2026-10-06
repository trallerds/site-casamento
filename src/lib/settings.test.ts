import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getPhotoStorage, photoStorageName } from "./storage";
import { SETTING_KEYS } from "./settings";

describe("settings", () => {
  test("google_drive_folder_id e persistivel pelo painel", () => {
    // O form de Configuracoes manda google_drive_folder_id; se a
    // chave nao estiver aqui, o campo e mudo e a pasta nunca muda.
    assert.ok(SETTING_KEYS.includes("google_drive_folder_id"));
  });

  test("novos envios sempre usam o Google Drive", async () => {
    assert.equal(await photoStorageName(), "drive");
    assert.equal((await getPhotoStorage()).name, "drive");
  });
});
