import React from "react";
import { illustrationTokens } from "../tokens";

interface SceneProps {
  interactive?: boolean;
  state?: "rest" | "hover" | "pressed";
}

// --- Common Components to ensure same style ---
const CharacterFace = ({ expression = "happy", color = illustrationTokens.colors.ink }: { expression?: string; color?: string }) => (
  <g>
    <circle cx="0" cy="0" r="18" fill="none" stroke={color} strokeWidth={illustrationTokens.strokeWidth} />
    {expression === "panic" && (
      <>
        <path d="M-6 -4 Q-4 -7 -2 -4 M2 -4 Q4 -7 6 -4" fill="none" stroke={color} strokeWidth="1" />
        <path d="M-3 4 Q0 2 3 4" fill="none" stroke={color} strokeWidth="1" />
      </>
    )}
    {expression === "smug" && (
      <>
        <path d="M-8 -2 L-4 -2 M4 -2 L8 -2" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M-5 6 Q0 10 5 6" fill="none" stroke={color} strokeWidth={illustrationTokens.strokeWidth} />
      </>
    )}
    {expression === "tired" && (
      <>
        <path d="M-8 -2 Q-6 -1 -4 -2 M4 -2 Q6 -1 8 -2" stroke={color} strokeWidth="1" />
        <path d="M-4 6 L4 6" stroke={color} strokeWidth="1" />
      </>
    )}
    {expression === "happy" && (
      <>
        <circle cx="-6" cy="-2" r="1.5" fill={color} />
        <circle cx="6" cy="-2" r="1.5" fill={color} />
        <path d="M-5 5 Q0 8 5 5" fill="none" stroke={color} strokeWidth={illustrationTokens.strokeWidth} />
      </>
    )}
  </g>
);

export function BlanketReasonArt({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 120)">
        <g transform={`translate(0, ${interactive && state === "hover" ? "-5" : "0"})`} className="transition-transform duration-300">
          <CharacterFace expression="smug" />
          <path 
            d="M-50 10 Q0 0 50 10 L50 80 Q0 90 -50 80 Z" 
            fill={illustrationTokens.colors.ivory} 
            stroke={illustrationTokens.colors.navy} 
            strokeWidth={illustrationTokens.strokeWidth} 
          />
          <text x="0" y="40" textAnchor="middle" fontSize="10" fontWeight="bold" fill={illustrationTokens.colors.navy} opacity="0.5">
            RAZÃO
          </text>
        </g>
      </g>
    </svg>
  );
}

export function FirstDinnerArt({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 120)">
        <ellipse cx="0" cy="40" rx="60" ry="20" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
        <g transform={`translate(-40, 0) ${interactive && state === "hover" ? "translateY(-2px)" : ""}`} className="transition-transform duration-300">
          <CharacterFace expression="happy" color={illustrationTokens.colors.navy} />
          <path d="M-10 20 L10 20 L0 40 Z" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
        </g>
        <g transform={`translate(40, 0) ${interactive && state === "hover" ? "translateY(-2px)" : ""}`} className="transition-transform duration-300">
          <CharacterFace expression="happy" color={illustrationTokens.colors.gold} />
          <path d="M-10 20 L10 20 L0 40 Z" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
        </g>
        <g transform="translate(0, 20)" className="animate-pulse">
          <circle cx="0" cy="0" r="3" fill={illustrationTokens.colors.gold} />
        </g>
      </g>
    </svg>
  );
}

export function FirstCoffeeArt({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 120)">
        <CharacterFace expression="tired" />
        <g transform="translate(40, 10)">
          <rect x="-15" y="-20" width="30" height="40" rx="4" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
          <path d="M-5 -20 L-5 -30 M5 -20 L5 -30" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
          <g className={interactive && state === "hover" ? "animate-bounce" : ""}>
            <circle cx="0" cy="-35" r="3" fill={illustrationTokens.colors.navy} />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function FirstBillArt({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 120)">
        <CharacterFace expression="panic" />
        <g transform={`translate(0, 20) ${interactive && state === "hover" ? "rotate(5deg)" : ""}`} className="transition-transform duration-300 origin-top">
          <rect x="-30" y="0" width="60" height="80" rx="2" fill="white" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
          <text x="0" y="20" textAnchor="middle" fontSize="12" fontWeight="bold" fill={illustrationTokens.colors.ink}>BOLETO</text>
          <path d="M-20 40 L20 40 M-20 50 L10 50" stroke={illustrationTokens.colors.ink} strokeWidth="1" />
        </g>
      </g>
    </svg>
  );
}

export function FirstTankArt({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 120)">
        <CharacterFace expression="happy" />
        <g transform="translate(40, 20)">
          <rect x="-20" y="0" width="40" height="25" rx="4" fill="none" stroke={illustrationTokens.colors.ink} strokeWidth={illustrationTokens.strokeWidth} />
          <path d="M-20 12 L-30 12" stroke={illustrationTokens.colors.ink} strokeWidth="2" />
          <circle cx="-35" cy="12" r="3" fill={illustrationTokens.colors.gold} />
        </g>
      </g>
    </svg>
  );
}

export function FirstPizzaArt({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 120)">
        <CharacterFace expression="happy" />
        <g transform="translate(0, 20)" className={interactive && state === "hover" ? "animate-bounce" : ""}>
          <path d="M-30 0 A30 30 0 0 1 30 0 L0 40 Z" fill={illustrationTokens.colors.gold} stroke={illustrationTokens.colors.ink} strokeWidth="1" />
          <circle cx="-10" cy="10" r="2" fill={illustrationTokens.colors.ink} />
          <circle cx="10" cy="10" r="2" fill={illustrationTokens.colors.ink} />
        </g>
      </g>
    </svg>
  );
}

export function DefaultGiftArt() {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 110)">
        <CharacterFace expression="happy" />
        <circle cx="0" cy="0" r="60" fill="none" stroke={illustrationTokens.colors.gold} strokeWidth="1" strokeDasharray="4 4" />
      </g>
    </svg>
  );
}
