import React from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { GIFT_ART, resolveArtKey } from "./gifts/art/registry";

interface GiftArtProps {
  imageKey?: string;
  name?: string;
  category?: string;
  className?: string;
  interactive?: boolean;
}

export function GiftArt({ 
  imageKey, 
  name = "", 
  category = "", 
  className = "", 
  interactive = true 
}: GiftArtProps) {
  const { key, palette } = resolveArtKey(name, category, imageKey);
  const artConfig = GIFT_ART[key] || GIFT_ART["default"];
  
  const { rive, RiveComponent } = useRive({
    src: artConfig.src,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  // Mapeamento de cores de fundo baseado na paleta da arte
  const bgColors: Record<string, string> = {
    "ivory-navy": "bg-ivory/50",
    "ivory-gold": "bg-gold-500/20",
    "navy-ivory": "bg-navy-900/10",
    "ivory-red-accent": "bg-red-500/10",
    "ivory-blush": "bg-blush-500/20",
  };

  return (
    <div className={`relative w-full h-full overflow-hidden transition-colors duration-500 ${className} ${bgColors[palette] || "bg-ivory/50"}`}>
      <RiveComponent 
        className="w-full h-full" 
        onClick={() => {
          if (interactive && rive) {
            // Aqui dispararíamos a State Machine do Rive
            // rive.setTrigger("press");
          }
        }}
      />
    </div>
  );
}
