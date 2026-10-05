import React from "react";
import { 
  BlanketReasonArt, 
  FirstDinnerArt, 
  FirstCoffeeArt, 
  FirstBillArt, 
  FirstTankArt, 
  FirstPizzaArt, 
  DefaultGiftArt 
} from "./scenes";

export type ArtKey = string;

interface SceneProps {
  interactive?: boolean;
  state?: "rest" | "hover" | "pressed";
}

export interface Scene {
  component: React.ComponentType<SceneProps>;
  palette: string;
}

export const GIFT_ART: Record<string, Scene> = {
  "blanket-reason": { component: BlanketReasonArt, palette: "ivory-navy" },
  "first-dinner": { component: FirstDinnerArt, palette: "ivory-gold" },
  "first-coffee": { component: FirstCoffeeArt, palette: "navy-ivory" },
  "first-bill": { component: FirstBillArt, palette: "ivory-red-accent" },
  "first-tank": { component: FirstTankArt, palette: "ivory-gold" },
  "first-pizza": { component: FirstPizzaArt, palette: "ivory-blush" },
  "default": { component: DefaultGiftArt, palette: "ivory-navy" },
} as const;

export function resolveArtKey(name: string, category: string, currentKey?: string): { key: string; palette: string } {
  if (currentKey && GIFT_ART[currentKey]) {
    return { key: currentKey, palette: GIFT_ART[currentKey].palette };
  }
  return { key: "default", palette: GIFT_ART["default"].palette };
}
