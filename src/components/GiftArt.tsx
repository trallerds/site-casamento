import { CallLily, Flourish, Monogram, Mosquitinho, Trigo } from "@/components/Botanical";

/**
 * Cartao de presente: papel com o tinto suave da categoria e um dos
 * motivos botanicos da identidade. O motivo vem de um hash do nome,
 * entao cada presente tem sempre a mesma ilustracao na lista, no
 * detalhe e no Pix -- sem depender de asset nem de coluna nova.
 */
const CATEGORY_TONES: Record<string, { bg: string; ink: string }> = {
  "Sobrevivência do casamento": { bg: "#edf1e8", ink: "#5c7263" },
  "Boletos do amor": { bg: "#f6efe0", ink: "#8a6d3f" },
  "Lua de mel": { bg: "#e8eef5", ink: "#3d5a7a" },
  Amor: { bg: "#f7edec", ink: "#9a5a5a" },
  "Pix livre": { bg: "#f5f0dc", ink: "#7a6a2f" },
};

const DEFAULT_TONE = { bg: "#f1efe8", ink: "#4a5a6a" };

const MOTIFS = [CallLily, Mosquitinho, Trigo, Monogram];

function motifFor(name: string) {
  // FNV-1a com bits do meio: simulado sobre os 40 nomes
  // reais, distribui 10/11/9/10 entre os motivos.
  let hash = 2166136261;
  for (let index = 0; index < name.length; index++) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return MOTIFS[(hash >>> 16) % MOTIFS.length];
}

export function GiftArt({
  name,
  category,
  className = "",
}: {
  name: string;
  category: string;
  className?: string;
}) {
  const tone = CATEGORY_TONES[category] ?? DEFAULT_TONE;
  const Motif = motifFor(name);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundColor: tone.bg, color: tone.ink }}
      role="img"
      aria-label={`Ilustração para ${name}`}
    >
      <div className="frame-line absolute inset-3 rounded-[2px]" />
      <Motif className="relative h-2/5 w-2/5" />
      <Flourish className="absolute bottom-5 left-1/2 h-4 w-24 -translate-x-1/2 opacity-50" />
    </div>
  );
}
