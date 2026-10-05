import React from "react";
import Image from "next/image";
import { resolveArtPalette } from "./gifts/art/registry";

interface GiftArtProps {
  imageKey?: string;
  className?: string;
}

export function GiftArt({ imageKey, className = "" }: GiftArtProps) {
  const palette = resolveArtPalette(imageKey);
  
  const bgColors: Record<string, string> = {
    "ivory-navy": "bg-ivory/50",
    "ivory-gold": "bg-gold-500/20",
    "navy-ivory": "bg-navy-900/10",
    "ivory-red-accent": "bg-red-500/10",
    "ivory-blush": "bg-blush-500/20",
  };

  const src = imageKey ? `/gifts/${imageKey}.svg` : "///gifts/default.svg";

  const animationMap: Record<string, string> = {
    "first-bill": "art-animate-shake",
    "blanket-reason": "art-animate-bounce",
    "first-coffee": "art-animate-bounce",
    "first-dinner": "art-animate-float",
    "first-toast": "art-animate-float",
    "first-pizza": "art-animate-float",
    "first-tank": "art-animate-float",
  };

  const animationClass = animationMap[imageKey || "default"] || "";

  return (
    <div className={`relative w-full h-full overflow-hidden transition-colors duration-500 ${className} ${bgColors[palette] || "bg-ivory/50"}`}>
      <Image 
        src={src} 
        alt="Ilustração do presente" 
        fill 
        className={`object-contain p-4 transition-transform duration-700 group-hover:scale-110 ${animationClass ? `group-hover:${animationClass}` : ""}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/gifts/default.svg";
        }}
      />
    </div>
  );
}
