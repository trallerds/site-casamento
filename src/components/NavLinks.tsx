"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/components/nav-items";

const VARIANTS = {
  top: {
    list: "flex items-center gap-6",
    item: "",
    link: "text-sm transition-colors",
    current: "text-gold-700",
    idle: "text-navy-800/75 hover:text-navy-900",
  },
  bottom: {
    list: "mx-auto flex max-w-md items-stretch justify-around",
    item: "flex-1",
    link: "flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[0.65rem] uppercase tracking-widest transition-colors",
    current: "text-gold-700",
    idle: "text-navy-800/70 hover:text-navy-900",
  },
} as const;

/**
 * Links da navegacao em dois lugares: barra de baixo (celular) e
 * nav do topo (desktop). Uma lista so, um lugar so que sabe a rota
 * atual: o convidado sempre ve onde esta, e o fluxo do Pix mantem
 * "Presentes" ativo por ser uma subrota de /presentes.
 */
export function NavLinks({ variant = "bottom" }: { variant?: "top" | "bottom" }) {
  const pathname = usePathname() ?? "";
  const style = VARIANTS[variant];
  return (
    <ul className={style.list}>
      {NAV.map((item) => {
        const Icon = item.icon;
        const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href} className={style.item}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`${style.link} ${current ? style.current : style.idle}`}
            >
              {variant === "bottom" ? <Icon className="h-5 w-5" /> : null}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
