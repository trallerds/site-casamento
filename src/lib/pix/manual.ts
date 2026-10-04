import { getSetting, weddingNames } from "@/lib/settings";
import { buildBrCode } from "./brcode";
import { PixError, type PixCharge, type PixChargeRequest, type PixEvent, type PixProvider } from "./types";

async function pixKey() {
  return ((await getSetting("pix_key")) || process.env.PIX_KEY || "").trim();
}

async function staticPayload() {
  return ((await getSetting("pix_key_payload")) || process.env.PIX_KEY_PAYLOAD || "").trim();
}

async function payloadFor(amountCents: number, txid: string) {
  const key = await pixKey();
  if (key) {
    return buildBrCode({
      key,
      recipientName: (await getSetting("pix_recipient_name")) || (await weddingNames()),
      amountCents,
      txid,
      city: (await getSetting("pix_recipient_city")) || "SAO PAULO",
    });
  }
  return staticPayload();
}

export const manualPixProvider: PixProvider = {
  name: "manual",
  supportsWebhooks: false,

  async createCharge(input: PixChargeRequest): Promise<PixCharge> {
    const payload = await payloadFor(input.amountCents, input.paymentPublicId);
    if (!payload) {
      throw new PixError("Chave Pix não configurada. Defina pix_key no painel.", 503);
    }
    return {
      provider: "manual",
      providerChargeId: `manual_${input.paymentPublicId}`,
      pixCopyPaste: payload,
      expiresAt: null,
    };
  },

  async parseWebhook(): Promise<PixEvent | null> {
    return null;
  },

  async health() {
    if (await pixKey()) {
      return {
        ok: true,
        message: "Chave Pix com valor já preenchido por presente. A confirmação é manual no painel.",
      };
    }
    if (await staticPayload()) {
      return {
        ok: true,
        message:
          "Payload Pix estático em uso: o convidado precisa confirmar o valor no aplicativo do banco.",
      };
    }
    return { ok: false, message: "Chave Pix não configurada (Configurações → Pix)." };
  },
};

export { pixKey };