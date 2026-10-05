import React from "react";
import { GIFT_ART, resolveArtKey } from "./gifts/art/registry";

interface GiftArtProps {
  imageKey?: string;
  name?: string;
  category?: string;
  className?: string;
  interactive?: boolean;
  state?: "rest" | "hover" | "pressed";
}

export function GiftArt({ 
  imageKey, 
  name = "", 
  category = "", 
  className = "", 
  interactive = true, 
  state = "rest" 
}: GiftArtProps) {
  const { key, palette } = resolveArtKey(name || "", category || "", imageKey);
  const sceneDefinition = GIFT_ART[key] || GIFT_ART["default"];
  const SceneComponent = sceneDefinition.component;

  // Mapeamento de cores de fundo mais contrastantes para diferenciar as cenas
  const bgColors: Record<string, string> = {
    "ivory-navy": "bg-navy-900/10",
    "ivory-gold": "bg-gold-500/20",
    "navy-ivory": "bg-navy-950/20",
    "ivory-red-accent": "bg-red-500/10",
    "ivory-blush": "bg-blush-500/20",
  };

  return (
    <div className={`relative w-full h-full overflow-hidden transition-colors duration-500 ${className} ${bgColors[palette] || "bg-ivory/50"}`}>
      <SceneComponent 
        interactive={interactive} 
        state={state} 
      />
    </div>
  );
}
