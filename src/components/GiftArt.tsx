import React from "react";
import { GIFT_ART } from "./gifts/art/registry";

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
  name, 
  category, 
  className = "", 
  interactive = true, 
  state = "rest" 
}: GiftArtProps) {
  // Se houver imageKey, usamos o novo sistema de cenas dinâmicas
  if (imageKey) {
    const sceneDefinition = GIFT_ART[imageKey] || GIFT_ART["default"];
    const SceneComponent = sceneDefinition.component;

    return (
      <div className={`relative w-full h-full overflow-hidden ${className} transition-colors duration-500 ${
        sceneDefinition.palette === "ivory-navy" ? "bg-ivory/50" : "bg-gold/20"
      }`}>
        <SceneComponent 
          interactive={interactive} 
          state={state} 
        />
      </div>
    );
  }

  // Fallback para a arte botânica antiga se não houver imageKey
  // (Mantido apenas para evitar quebras, mas o objetivo é migrar tudo para cenas)
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className} bg-ivory/50`}>
      <div className="text-navy-900/20 text-xs uppercase tracking-widest">Arte Padrão</div>
    </div>
  );
}
