import { getSetting } from "@/lib/settings";
import { PixError, type PixCharge, type PixChargeRequest, type PixEvent, type PixProvider } from "./types";

type OpenPixChargeResponse = {
  id?: string;
  correlationID?: string;
  brCode?: string;
  brCodeBase64?: string;
  expiresDate?: string;
};

type OpenPixWebhookPayload = {
  id?: string;
  event?: string;
  createdAt?: string;
  data?: {
    object?: {
      id?: string;
      correlationID?: string;
      status?: string;
      value?: number;
      paidAmount?: number;
    };
  };
};

async function config() {
  const apiKey = ((await getSetting("pix_provider_config")) || process.env.OPENPIX_API_KEY || "").trim();
  const baseUrl = (process.env.OPENPIX_BASE_URL || "https://api.openpix.dev/v1").replace(/\/$/, "");
  const webhookToken = (process.env.OPENPIX_WEBHOOK_TOKEN || "").trim();
  return { apiKey, baseUrl, webhookToken };
}

export const openPixProvider: PixProvider = {
  name: "openpix",
  supportsWebhooks: true,

  async createCharge(input: PixChargeRequest): Promise<PixCharge> {
    const { apiKey, baseUrl } = await config();
    if (!apiKey) throw new PixError("OpenPix sem credencial (OPENPIX_API_KEY).", 503);

    const response = await fetch(`${baseUrl}/charge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correlationID: input.reference,
        expiresDate: (input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000)).toISOString(),
        value: input.amountCents,
        comment: input.description.slice(0, 120),
        customer: {},
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new PixError(`OpenPix recusou a cobrança (${response.status}): ${detail.slice(0, 200)}`);
    }

    const body = (await response.json()) as OpenPixChargeResponse;
    if (!body.brCode || !body.id) {
      throw new PixError("Resposta da OpenPix sem brCode.");
    }

    return {
      provider: "openpix",
      providerChargeId: body.id,
      pixCopyPaste: body.brCode,
      expiresAt: body.expiresDate ?? null,
    };
  },

  async parseWebhook(request: Request, rawBody: string): Promise<PixEvent | null> {
    const { webhookToken } = await config();
    if (!webhookToken) return null;

    const provided =
      request.headers.get("x-webhook-id") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      "";
    if (provided !== webhookToken) return null;

    let payload: OpenPixWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as OpenPixWebhookPayload;
    } catch {
      throw new PixError("Payload de webhook inválido.", 400);
    }

    const object = payload.data?.object ?? {};
    const chargeId = object.id ?? payload.id;
    if (!chargeId) return null;

    const paid = (object.status ?? "").toUpperCase() === "PAID";
    return {
      eventId: String(payload.id ?? `${payload.event}:${chargeId}:${payload.createdAt ?? ""}`),
      type: payload.event ?? (paid ? "charge.paid" : "charge.updated"),
      providerChargeId: String(chargeId),
      paidAt: paid ? (payload.createdAt ?? new Date().toISOString()) : null,
      amountCents: typeof object.paidAmount === "number" ? object.paidAmount : (object.value ?? null),
    };
  },

  async health() {
    const { apiKey, baseUrl } = await config();
    if (!apiKey) return { ok: false, message: "OPENPIX_API_KEY não configurada." };
    try {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      });
      if (!response.ok) return { ok: false, message: `OpenPix respondeu ${response.status}.` };
      return { ok: true, message: "OpenPix conectada." };
    } catch (error) {
      return { ok: false, message: `OpenPix inacessível: ${(error as Error).message}` };
    }
  },
};