import React from "react";
import { GIFT_ART } from "./art/registry";

interface GiftArtProps {
  imageKey: string;
  interactive?: boolean;
  state?: "rest" | "hover" | "pressed";
}

export function GiftArt({ imageKey, interactive = true, state = "rest" }: GiftArtProps) {
  const sceneDefinition = GIFT_ART[imageKey] || GIFT_ART["default"];
  const SceneComponent = sceneDefinition.component;

  return (
    <div className={`relative w-full h-full transition-colors duration-500 ${
      sceneDefinition.palette === "ivory-navy" ? "bg-ivory/50" : "bg-gold/20"
    }`}>
      <SceneComponent 
        interactive={interactive} 
        state={state} 
      />
    </div>
  );
}
