import React from "react";
import { illustrationTokens } from "../art/tokens";

export function Character({ 
  person = "jessica", 
  expression = "happy", 
  pose = "standing" 
}: { 
  person?: "jessica" | "jennifer"; 
  expression?: string; 
  pose?: string; 
}) {
  const color = person === "jessica" ? illustrationTokens.colors.navy : illustrationTokens.colors.gold;
  
  return (
    <g className="character-group transition-all duration-300">
      {/* Head */}
      <circle cx="0" cy="0" r="20" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
      {/* Eyes (Simple Expression) */}
      <g className="eyes">
        <circle cx="-6" cy="-2" r="1.5" fill={illustrationTokens.colors.ink} />
        <circle cx="6" cy="-2" r="1.5" fill={illustrationTokens.colors.ink} />
      </g>
      {/* Smile */}
      <path d="M-5 5 Q0 8 5 5" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
      {/* Body */}
      <path d="M-15 20 Q0 15 15 20 L10 50 L-10 50 Z" fill="none" stroke={color} strokeWidth={illustrationTokens.strokeWidth} />
    </g>
  );
}
