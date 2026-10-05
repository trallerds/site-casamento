import React from "react";
import { illustrationTokens } from "../art/tokens";

export function Blanket({ wrap = "full" }: { wrap?: "full" | "partial" }) {
  return (
    <g className="blanket-group">
      <path 
        d="M-40 0 Q0 -10 40 0 L40 60 Q0 70 -40 60 Z" 
        fill={illustrationTokens.colors.ivory} 
        stroke={illustrationTokens.colors.navy} 
        strokeWidth={illustrationTokens.strokeWidth} 
      />
      <path d="M-40 10 L40 10 M-40 20 L40 20" stroke={illustrationTokens.colors.navy} strokeWidth="1" opacity="0.3" />
    </g>
  );
}

export function CoffeeMaker() {
  return (
    <g className="coffee-group">
      <rect x="-15" y="-20" width="30" height="40" rx={illustrationTokens.cornerRadius} fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
      <path d="M-5 -20 L-5 -30 M5 -20 L5 -30" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
      <circle cx="0" cy="-35" r="3" fill={illustrationTokens.colors.navy} className="animate-bounce" />
    </g>
  );
}

export function Bill() {
  return (
    <g className="bill-group">
      <rect x="-20" y="-30" width="40" height="60" rx="2" fill="white" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
      <path d="M-10 -20 L10 -20 M-10 -10 L10 -10 M-10 0 L5 0" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
      <text x="0" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill={illustrationTokens.colors.ink}>PIX</text>
    </g>
  );
}
