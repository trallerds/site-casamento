const PALETTES: Record<string, { from: string; to: string; ink: string }> = {
  chopp: { from: "#f6ead0", to: "#e6d0a4", ink: "#8a6d1f" },
  brinde: { from: "#eaf1f8", to: "#cddcec", ink: "#1a4c80" },
  sobremesa: { from: "#fbeee9", to: "#f0d8d0", ink: "#a4695a" },
  openbar: { from: "#eef2f7", to: "#d3dde9", ink: "#123a63" },
  terapia: { from: "#eef4ef", to: "#d5e4d6", ink: "#3f6b4f" },
  combustivel: { from: "#f7f0e2", to: "#e4d3ae", ink: "#8a6d1f" },
  aviso: { from: "#f6ecec", to: "#e6cccc", ink: "#8f3d3d" },
  lua: { from: "#eaeff7", to: "#cbd7e8", ink: "#1a4c80" },
  curitiba: { from: "#eaf0f4", to: "#c9d9e2", ink: "#2b639e" },
  default: { from: "#f0f3f8", to: "#d5dfec", ink: "#1a4c80" },
};

type GlyphProps = { className?: string };

function Glass({ className = "" }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M16 8h16l-2 30H18z" strokeLinejoin="round" />
      <path d="M18 20h12M19 28h10" strokeLinecap="round" opacity="0.65" />
      <path d="M20 8c0-3 2-4 4-4s4 1 4 4" strokeLinecap="round" />
    </svg>
  );
}

function Bottle({ className = "" }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M21 6h6v9l4 6v21H17V21l4-6z" strokeLinejoin="round" />
      <path d="M17 30h14" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function Heart({ className = "" }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="1.3">
      <path
        d="M24 40s-15-9.4-15-19.2C9 15.4 12.9 12 17.4 12c2.8 0 5.3 1.5 6.6 3.8C25.3 13.5 27.8 12 30.6 12 35.1 12 39 15.4 39 20.8 39 30.6 24 40 24 40z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Moon({ className = "" }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M31 8a17 17 0 100 32 15 15 0 010-32z" strokeLinejoin="round" />
      <circle cx="36" cy="14" r="1.4" />
      <circle cx="40" cy="22" r="1.1" />
    </svg>
  );
}

const GLYPHS: Record<string, (props: GlyphProps) => React.ReactElement> = {
  chopp: Glass,
  brinde: Glass,
  sobremesa: Heart,
  openbar: Bottle,
  terapia: Heart,
  combustivel: Bottle,
  aviso: Bottle,
  lua: Moon,
  curitiba: Moon,
  default: Heart,
};

export function GiftArt({
  imageKey,
  name,
  className = "",
}: {
  imageKey: string;
  name: string;
  className?: string;
}) {
  const palette = PALETTES[imageKey] ?? PALETTES.default;
  const Glyph = GLYPHS[imageKey] ?? GLYPHS.default;
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundImage: `linear-gradient(150deg, ${palette.from}, ${palette.to})`, color: palette.ink }}
      role="img"
      aria-label={`Ilustração para ${name}`}
    >
      <div className="frame-line absolute inset-3 rounded-[2px]" />
      <Glyph className="relative h-2/5 w-2/5" />
      <svg
        viewBox="0 0 100 20"
        className="absolute bottom-5 left-1/2 h-4 w-24 -translate-x-1/2"
        fill="none"
        aria-hidden="true"
        style={{ color: palette.ink, opacity: 0.5 }}
      >
        <path d="M2 10h34M64 10h34" stroke="currentColor" strokeWidth="0.8" />
        <path d="M50 3c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    </div>
  );
}