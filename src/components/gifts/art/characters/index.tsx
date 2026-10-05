import React from "react";
import { illustrationTokens } from "../tokens";

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
      
      {/* Expressions */}
      <g className="expression">
        {expression === "panic" && (
          <>
            <path d="M-7 -5 Q-5 -8 -3 -5" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
            <path d="M3 -5 Q5 -8 7 -5" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
            <path d="M-3 5 Q0 2 3 5" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
          </>
        )}
        {expression === "smug" && (
          <>
            <path d="M-8 -2 L-4 -2 M4 -2 L8 -2" stroke={illustrationTokens.colors.ink} strokeWidth="2" strokeLinecap="round" />
            <path d="M-5 6 Q0 10 5 6" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
          </>
        )}
        {expression === "tired" && (
          <>
            <path d="M-8 -2 Q-6 -1 -4 -2 M4 -2 Q6 -1 8 -2" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
            <path d="M-4 6 L4 6" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
          </>
        )}
        {expression === "happy" && (
          <>
            <circle cx="-6" cy="-2" r="1.5" fill={illustrationTokens.colors.ink} />
            <circle cx="6" cy="-2" r="1.5" fill={illustrationTokens.colors.ink} />
            <path d="M-5 5 Q0 8 5 5" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
          </>
        )}
      </g>
      {/* Body */}
      <path d="M-15 20 Q0 15 15 20 L10 50 L-10 50 Z" fill="none" stroke={color} strokeWidth={illustrationTokens.strokeWidth} />
    </g>
  );
}
