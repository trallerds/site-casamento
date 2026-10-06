"use client";

interface QuickActionProps {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  action: () => void;
  variant?: "default" | "primary";
  disabled?: boolean;
  className?: string;
}

export function QuickAction({
  icon,
  eyebrow,
  title,
  description,
  action,
  variant = "default",
  disabled = false,
  className = "",
}: QuickActionProps) {
  return (
    <button
      type="button"
      className={`group relative flex h-full flex-col items-start gap-2 rounded-card border p-4 text-left transition-[transform,box-shadow,border-color,background-color] duration-200 sm:p-6 ${
        variant === "primary"
          ? "border-navy-900 bg-navy-900 text-ivory shadow-soft hover:shadow-lift"
          : "border-navy-900/10 bg-white text-navy-900 hover:border-gold-500/50 hover:shadow-soft"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"} ${className}`}
      onClick={action}
      disabled={disabled}
      aria-haspopup="dialog"
    >
      <span className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
        variant === "primary"
          ? "bg-gold-500 text-navy-900"
          : "bg-gold-100 text-gold-700 group-hover:bg-gold-200"
      }`}>
        {icon}
      </span>
      <span className={`text-xs uppercase tracking-widest font-body ${variant === "primary" ? "text-gold-300" : "text-gold-700"}`}>
        {eyebrow}
      </span>
      <span className={`max-w-full break-words font-display text-lg leading-snug text-balance sm:text-xl ${variant === "primary" ? "text-ivory" : "text-navy-900"}`}>
        {title}
      </span>
      {description && (
        <span className={`max-w-full text-sm leading-relaxed text-pretty ${variant === "primary" ? "text-ivory/70" : "text-navy-800/60"}`}>
          {description}
        </span>
      )}
    </button>
  );
}

interface QuickActionGridProps {
  actions: QuickActionProps[];
  columns?: 2 | 3;
}

export function QuickActionGrid({ actions, columns = 2 }: QuickActionGridProps) {
  return (
    <div className={`grid gap-4 ${columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
      {actions.map((action, index) => (
        <QuickAction key={index} {...action} />
      ))}
    </div>
  );
}
