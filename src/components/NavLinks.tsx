"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/components/nav-items";

/**
 * Links da navegação de baixo (so celular). Saber a rota
 * atual e marca-la com aria-current: o convidado sempre
 * sabe onde esta, e o fluxo do Pix mantem "Presentes"
 * ativo por ser uma subrota de /presentes.
 */
export function NavLinks() {
  const pathname = usePathname() ?? "";
  return (
    <ul className="mx-auto flex max-w-md items-stretch justify-around">
      {NAV.map((item) => {
        const Icon = item.icon;
        const current =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[0.65rem] uppercase tracking-widest transition-colors ${
                current ? "text-gold-700" : "text-navy-800/70 hover:text-navy-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
