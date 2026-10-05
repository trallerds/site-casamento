import React from "react";
import { illustrationTokens } from "../art/tokens";

export function GiftArtFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <svg 
        viewBox="0 0 300 220" 
        className="h-full w-full opacity-20" 
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Desenho geométrico neutro e elegante baseado na identidade */}
        <circle cx="150" cy="110" r="60" fill="none" stroke={illustrationTokens.colors.navy} strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="150" cy="110" r="80" fill="none" stroke={illustrationTokens.colors.gold} strokeWidth="1" strokeDasharray="2 2" />
        <path 
          d="M130 110 L170 110 M150 90 L150 130" 
          stroke={illustrationTokens.colors.navy} 
          strokeWidth="1" 
          opacity="0.5" 
        />
      </svg>
      <span className="absolute text-[10px] uppercase tracking-[0.3em] text-navy-900/30 font-body">
        Arte em breve
      </span>
    </div>
  );
}
