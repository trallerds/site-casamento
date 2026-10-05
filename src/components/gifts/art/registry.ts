import React from "react";
import { illustrationTokens } from "./tokens";
import { 
  BlanketReasonScene, 
  FirstCoffeeScene, 
  FirstBillScene, 
  DinnerScene, 
  TravelScene, 
  LoveScene, 
  DefaultWeddingScene 
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

const SEMANTIC_MAP: Record<string, { key: string; palette: string }> = {
  "cobertor": { key: "blanket-reason", palette: "ivory-navy" },
  "café": { key: "first-coffee", palette: "navy-ivory" },
  "cafe": { key: "first-coffee", palette: "navy-ivory" },
  "boleto": { key: "first-bill", palette: "ivory-red-accent" },
  "conta": { key: "first-bill", palette: "ivory-red-accent" },
  "jantar": { key: "first-dinner", palette: "ivory-gold" },
  "restaurante": { key: "first-dinner", palette: "ivory-gold" },
  "viagem": { key: "travel", palette: "ivory-gold" },
  "mala": { key: "travel", palette: "ivory-gold" },
  "amor": { key: "love", palette: "ivory-blush" },
  "coração": { key: "love", palette: "ivory-blush" },
  "coracao": { key: "love", palette: "ivory-blush" },
};

export const GIFT_ART: Record<string, Scene> = {
  "blanket-reason": { component: BlanketReasonScene, palette: "ivory-navy" },
  "first-coffee": { component: FirstCoffeeScene, palette: "navy-ivory" },
  "first-bill": { component: FirstBillScene, palette: "ivory-red-accent" },
  "first-dinner": { component: DinnerScene, palette: "ivory-gold" },
  "travel": { component: TravelScene, palette: "ivory-gold" },
  "love": { component: LoveScene, palette: "ivory-blush" },
  "default": { component: DefaultWeddingScene, palette: "ivory-navy" },
} as const;

export function resolveArtKey(name: string, category: string, currentKey?: string): { key: string; palette: string } {
  // 1. Prioridade máxima: Chave explícita do banco
  if (currentKey && GIFT_ART[currentKey]) {
    return { key: currentKey, palette: GIFT_ART[currentKey].palette };
  }

  const text = `${name} ${category}`.toLowerCase();
  
  // 2. Busca semântica por palavras-chave
  for (const [keyword, config] of Object.entries(SEMANTIC_MAP)) {
    if (text.includes(keyword)) {
      return config;
    }
  }

  // 3. Fallback total
  return { key: "default", palette: GIFT_ART["default"].palette };
}
