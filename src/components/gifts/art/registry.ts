import React from "react";

export type ArtKey = string;

interface Scene {
  src: string;
  palette: string;
}

export const GIFT_ART: Record<string, Scene> = {
  "blanket-reason": { src: "/gifts/blanket-reason.riv", palette: "ivory-navy" },
  "first-dinner": { src: "/gifts/first-dinner.riv", palette: "ivory-gold" },
  "first-coffee": { src: "/gifts/first-coffee.riv", palette: "navy-ivory" },
  "first-bill": { src: "/gifts/first-bill.riv", palette: "ivory-red-accent" },
  "first-tank": { src: "/gifts/first-tank.riv", palette: "ivory-gold" },
  "first-pizza": { src: "/gifts/first-pizza.riv", palette: "ivory-blush" },
  "default": { src: "/gifts/default.riv", palette: "ivory-navy" },
} as const;

export function resolveArtKey(name: string, category: string, currentKey?: string): { key: string; palette: string } {
  // Prioridade total: a chave explícita do banco.
  // Não há mais inferência semântica ou adivinhação por categoria.
  if (currentKey && GIFT_ART[currentKey]) {
    return { key: currentKey, palette: GIFT_ART[currentKey].palette };
  }
  return { key: "default", palette: GIFT_ART["default"].palette };
}
