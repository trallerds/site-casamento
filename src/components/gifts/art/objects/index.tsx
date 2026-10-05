import React from "react";
import { illustrationTokens } from "../tokens";

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

export function DinnerTable() {
  return (
    <g className="table-group">
      <ellipse cx="0" cy="20" rx="40" ry="15" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
      <path d="M-10 20 L-10 40 M10 20 L10 40" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
      <circle cx="-15" cy="15" r="5" fill={illustrationTokens.colors.gold} />
      <circle cx="15" cy="15" r="5" fill={illustrationTokens.colors.gold} />
    </g>
  );
}

export function Suitcase() {
  return (
    <g className="suitcase-group">
      <rect x="-25" y="-15" width="50" height="30" rx="4" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
      <path d="M-10 -15 Q0 -20 10 -15" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
      <circle cx="-15" cy="15" r="4" fill={illustrationTokens.colors.ink} />
      <circle cx="15" cy="15" r="4" fill={illustrationTokens.colors.ink} />
    </g>
  );
}

export function Heart() {
  return (
    <g className="heart-group">
      <path 
        d="M0 10 Q-15 -10 -15 -20 Q-15 -30 0 -20 Q15 -30 15 -20 Q15 -10 0 10" 
        fill={illustrationTokens.colors.blush} 
        stroke={illustrationTokens.colors.ink} 
        strokeWidth="1" 
      />
    </g>
  );
}
