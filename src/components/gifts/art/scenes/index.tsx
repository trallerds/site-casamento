import React from "react";
import { Character } from "../characters";
import { Blanket, Bill, CoffeeMaker } from "../objects";
import { illustrationTokens } from "../art/tokens";

// --- Scenes Implementation ---

export function BlanketReasonScene({ interactive, state }: { interactive?: boolean; state?: string }) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 110)">
        <Character person="jessica" expression="smug" />
        <g transform="translate(0, 20)" className={interactive && state === "hover" ? "animate-bounce" : ""}>
          <Blanket wrap="full" />
        </g>
        <path d="M-10 -40 L10 -40" stroke={illustrationTokens.colors.gold} strokeWidth="2" />
      </g>
    </svg>
  );
}

export function FirstCoffeeScene({ interactive, state }: { interactive?: boolean; state?: string }) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 110)">
        <Character person="jessica" expression="tired" />
        <g transform="translate(40, 20)">
          <CoffeeMaker />
        </g>
      </g>
    </svg>
  );
}

export function FirstBillScene({ interactive, state }: { interactive?: boolean; state?: string }) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 110)">
        <Character person="jessica" expression="panic" />
        <g transform="translate(0, 20)" className={interactive && state === "hover" ? "animate-pulse" : ""}>
          <Bill />
        </g>
      </g>
    </svg>
  );
}

export function DefaultWeddingScene() {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 110)">
        <Character person="jessica" />
        <circle cx="0" cy="0" r="60" fill="none" stroke={illustrationTokens.colors.gold} strokeWidth="1" strokeDasharray="4 4" />
      </g>
    </svg>
  );
}
