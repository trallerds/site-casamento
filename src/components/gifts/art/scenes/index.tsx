import React from "react";
import { Character } from "../characters";
import { Blanket, Bill, CoffeeMaker, DinnerTable, Suitcase, Heart } from "../objects";
import { illustrationTokens } from "../tokens";

interface SceneProps {
  interactive?: boolean;
  state?: string;
  props?: any;
}

export function BlanketReasonScene({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 110)">
        <Character person="jessica" expression="smug" />
        <g transform="translate(0, 20)" className={interactive && state === "hover" ? "animate-bounce" : ""}>
          <Blanket wrap="full" />
        </g>
      </g>
    </svg>
  );
}

export function FirstCoffeeScene({ interactive, state }: SceneProps) {
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

export function FirstBillScene({ interactive, state }: SceneProps) {
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

export function DinnerScene({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 110)">
        <Character person="jessica" expression="happy" />
        <g transform="translate(40, 0)">
          <Character person="jennifer" expression="happy" />
        </g>
        <g transform="translate(20, 20)">
          <DinnerTable />
        </g>
      </g>
    </svg>
  );
}

export function TravelScene({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 110)">
        <Character person="jessica" expression="happy" />
        <g transform="translate(40, 20)">
          <Suitcase />
        </g>
      </g>
    </svg>
  );
}

export function LoveScene({ interactive, state }: SceneProps) {
  return (
    <svg viewBox="0 0 300 220" className="w-full h-full overflow-visible">
      <g transform="translate(150, 110)">
        <Character person="jennifer" expression="happy" />
        <g transform="translate(0, -40)" className="animate-bounce">
          <Heart />
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
