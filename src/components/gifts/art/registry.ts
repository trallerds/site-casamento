export type ArtKey = string;

export interface GiftArtConfig {
  palette: string;
}

export const GIFT_ART_CONFIG: Record<string, GiftArtConfig> = {
  "blanket-reason": { palette: "ivory-navy" },
  "first-dinner": { palette: "ivory-gold" },
  "first-coffee": { palette: "navy-ivory" },
  "first-bill": { palette: "ivory-red-accent" },
  "first-tank": { palette: "ivory-gold" },
  "first-pizza": { palette: "ivory-blush" },
  "default": { palette: "ivory-navy" },
} as const;

export function resolveArtPalette(imageKey?: string): string {
  const config = GIFT_ART_CONFIG[imageKey || "default"] || GIFT_ART_CONFIG["default"];
  return config.palette;
}
