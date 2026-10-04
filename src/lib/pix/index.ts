import { getSetting } from "@/lib/settings";
import { manualPixProvider } from "./manual";
import { openPixProvider } from "./openpix";
import { PixError, type PixProvider } from "./types";

export type { PixCharge, PixChargeRequest, PixEvent, PixProvider, ProviderHealth } from "./types";
export { PixError } from "./types";

export async function pixProviderName() {
  const configured = (
    (await getSetting("pix_provider")) ||
    process.env.PIX_PROVIDER ||
    "manual"
  ).trim();
  return configured === "openpix" ? "openpix" : "manual";
}

export async function getPixProvider(): Promise<PixProvider> {
  return (await pixProviderName()) === "openpix" ? openPixProvider : manualPixProvider;
}

export async function pixProviderHealth() {
  const provider = await getPixProvider();
  const result = await provider.health();
  return { provider: provider.name, ...result };
}

export async function assertPixReady() {
  const provider = await getPixProvider();
  const health = await provider.health();
  if (!health.ok) {
    throw new PixError(health.message, 503);
  }
  return provider;
}