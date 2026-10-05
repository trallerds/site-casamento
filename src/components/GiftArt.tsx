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
  // Resolve a chave da arte semanticamente (Banco -> Nome/Categoria -> Default)
  const { key, palette } = resolveArtKey(name || "", category || "", imageKey);
  
  const sceneDefinition = GIFT_ART[key] || GIFT_ART["default"];
  const SceneComponent = sceneDefinition.component;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className} transition-colors duration-500 ${
      palette === "ivory-navy" ? "bg-ivory/50" : 
      palette === "ivory-gold" ? "bg-gold/20" : 
      palette === "navy-ivory" ? "bg-navy-900/10" : 
      "bg-blush/20"
    }`}>
      <SceneComponent 
        interactive={interactive} 
        state={state} 
      />
    </div>
  );
}
