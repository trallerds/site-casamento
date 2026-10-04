export type PixChargeRequest = {
  amountCents: number;
  reference: string;
  description: string;
  paymentPublicId: string;
  expiresAt: Date | null;
};

export type PixCharge = {
  provider: string;
  providerChargeId: string;
  pixCopyPaste: string;
  expiresAt: string | null;
};

export type PixEvent = {
  eventId: string;
  type: string;
  providerChargeId: string;
  paidAt: string | null;
  amountCents: number | null;
};

export type ProviderHealth = { ok: boolean; message: string };

export interface PixProvider {
  readonly name: string;
  readonly supportsWebhooks: boolean;
  createCharge(input: PixChargeRequest): Promise<PixCharge>;
  parseWebhook(request: Request, rawBody: string): Promise<PixEvent | null>;
  health(): Promise<ProviderHealth>;
}

export class PixError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}