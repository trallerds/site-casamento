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
  // Cobertor / Quarto
  "cobertor": { key: "blanket-reason", palette: "ivory-navy" },
  "lençol": { key: "blanket-reason", palette: "ivory-navy" },
  "travesseiro": { key: "blanket-reason", palette: "ivory-navy" },
  "quarto": { key: "blanket-reason", palette: "ivory-navy" },
  
  // Café / Cozinha / Manhã
  "café": { key: "first-coffee", palette: "navy-ivory" },
  "cafe": { key: "first-coffee", palette: "navy-ivory" },
  "cafeteira": { key: "first-coffee", palette: "navy-ivory" },
  "cozinha": { key: "first-coffee", palette: "navy-ivory" },
  "torradeira": { key: "first-coffee", palette: "navy-ivory" },
  "panela": { key: "first-coffee", palette: "navy-ivory" },
  "frigideira": { key: "first-coffee", palette: "navy-ivory" },
  "manhã": { key: "first-coffee", palette: "navy-ivory" },
  "manha": { key: "first-coffee", palette: "navy-ivory" },

  // Boletos / Contas / Sobrevivência
  "boleto": { key: "first-bill", palette: "ivory-red-accent" },
  "conta": { key: "first-bill", palette: "ivory-red-accent" },
  "sobrevivência": { key: "first-bill", palette: "ivory-red-accent" },
  "sobrevivencia": { key: "first-bill", palette: "ivory-red-accent" },
  "dinheiro": { key: "first-bill", palette: "ivory-red-accent" },
  "pagamento": { key: "first-bill", palette: "ivory-red-accent" },

  // Jantar / Restaurante / Romance
  "jantar": { key: "first-dinner", palette: "ivory-gold" },
  "restaurante": { key: "first-dinner", palette: "ivory-gold" },
  "vinho": { key: "first-dinner", palette: "ivory-gold" },
  "champanhe": { key: "first-dinner", palette: "ivory-gold" },
  "taça": { key: "first-dinner", palette: "ivory-gold" },
  "velas": { key: "first-dinner", palette: "ivory-gold" },

  // Viagem / Lua de Mel / Aventura
  "viagem": { key: "travel", palette: "ivory-gold" },
  "lua de mel": { key: "travel", palette: "ivory-gold" },
  "mala": { key: "travel", palette: "ivory-gold" },
  "passagem": { key: "travel", palette: "ivory-gold" },
  "carro": { key: "travel", palette: "ivory-gold" },
  "hotel": { key: "travel", palette: "ivory-gold" },

  // Amor / Afeto / Coração
  "amor": { key: "love", palette: "ivory-blush" },
  "coração": { key: "love", palette: "ivory-blush" },
  "coracao": { key: "love", palette: "ivory-blush" },
  "carinho": { key: "love", palette: "ivory-blush" },
  "presente": { key: "love", palette: "ivory-blush" },
};

const CATEGORY_FALLBACKS: Record<string, { key: string; palette: string }> = {
  "Sobrevivência do casamento": { key: "first-bill", palette: "ivory-red-accent" },
  "Boletos do amor": { key: "first-bill", palette: "ivory-red-accent" },
  "Lua de mel": { key: "travel", palette: "ivory-gold" },
  "Amor": { key: "love", palette: "ivory-blush" },
  "Pix livre": { key: "default", palette: "ivory-navy" },
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
  if (currentKey && GIFT_ART[currentKey]) {
    return { key: currentKey, palette: GIFT_ART[currentKey].palette };
  }

  const text = `${name} ${category}`.toLowerCase();
  
  for (const [keyword, config] of Object.entries(SEMANTIC_MAP)) {
    if (text.includes(keyword)) {
      return config;
    }
  }

  if (CATEGORY_FALLBACKS[category]) {
    return CATEGORY_FALLBACKS[category];
  }

  return { key: "default", palette: GIFT_ART["default"].palette };
}
