import { StorageError, type PhotoStorage, type SaveInput, type StoredObject } from "./types";

/**
 * Ponte por Apps Script: resolve o caso de quem nao consegue criar credencial
 * no Google Cloud Console. O Web App e publicado "executar como proprietario",
 * entao a autorizacao do Drive fica na conta das noivas e o convidado nao
 * precisa de acesso a pasta.
 *
 * ponytail: Web App do Apps Script consome a cota diaria do script (90 min em
 * conta @gmail.com) e tem ~30 execucoes simultaneas. Se faltar na festa, troque
 * por um bucket proprio (Neon Object Storage) em vez de aumentar a cota.
 */
const ENDPOINT = () => process.env.GOOGLE_APPS_SCRIPT_URL || "";

async function call(body: Record<string, unknown>, timeoutMs = 60_000) {
  const endpoint = ENDPOINT();
  if (!endpoint) {
    throw new StorageError("GOOGLE_APPS_SCRIPT_URL ausente: a ponte do Drive nao esta configurada.", 503);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new StorageError(`Apps Script respondeu ${response.status}: ${text.slice(0, 200)}`);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new StorageError(`Resposta do Apps Script nao e JSON: ${text.slice(0, 200)}`);
  }

  // O ContentService responde HTTP 200 mesmo em erro, entao o ok:false do
  // script precisa virar excecao aqui para a causa real aparecer no painel.
  if (parsed.ok === false) {
    throw new StorageError(`Apps Script: ${String(parsed.message ?? "erro sem mensagem")}`, 502);
  }
  return parsed;
}

export function isAppsScriptConfigured() {
  return Boolean(ENDPOINT());
}

export const appsScriptStorage: PhotoStorage = {
  name: "drive",

  async save(input: SaveInput): Promise<StoredObject> {
    const body = await call({
      action: "save",
      name: `${input.publicId}.${input.mimeType === "image/png" ? "png" : "jpg"}`,
      mimeType: input.mimeType,
      bytes: input.buffer.toString("base64"),
    });

    const id = String(body.id ?? "");
    if (!id) throw new StorageError("Apps Script salvou mas nao devolveu o id do arquivo.");
    return { key: id, externalId: id };
  },

  async read(key: string) {
    if (!key) return null;
    try {
      const body = await call({ action: "read", id: key });
      const bytes = String(body.bytes ?? "");
      if (!bytes) return null;
      return {
        buffer: Buffer.from(bytes, "base64"),
        mimeType: String(body.mimeType ?? "image/jpeg"),
      };
    } catch {
      return null;
    }
  },

  async delete(stored: StoredObject) {
    const id = stored.externalId ?? stored.key;
    if (!id) return;
    try {
      await call({ action: "delete", id });
    } catch {
      return;
    }
  },

  async health() {
    if (!isAppsScriptConfigured()) {
      return { ok: false, message: "GOOGLE_APPS_SCRIPT_URL ausente." };
    }
    try {
      const body = await call({ action: "health" }, 20_000);
      return body.ok === true
        ? { ok: true, message: `Ponte do Drive ativa (${String(body.count ?? "?")} fotos).` }
        : { ok: false, message: String(body.message ?? "Apps Script respondeu sem ok.") };
    } catch (error) {
      return { ok: false, message: `Ponte do Drive inacessível: ${(error as Error).message}` };
    }
  },
};