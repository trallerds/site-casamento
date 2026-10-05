import React from "react";
import { illustrationTokens } from "./tokens";
import { BlanketReasonScene, FirstCoffeeScene, FirstBillScene, DefaultWeddingScene } from "./scenes";

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
  "blanket-reason": {
    component: BlanketReasonScene,
    palette: "ivory-navy",
  },
  "first-coffee": {
    component: FirstCoffeeScene,
    palette: "navy-ivory",
  },
  "first-bill": {
    component: FirstBillScene,
    palette: "ivory-red-accent",
  },
  "default": {
    component: DefaultWeddingScene,
    palette: "ivory-navy",
  },
} as const;
