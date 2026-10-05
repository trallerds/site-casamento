import Image from "next/image";
import Link from "next/link";
import { Mosquitinho } from "@/components/Botanical";
import { NAV } from "@/components/nav-items";
import { NavLinks } from "@/components/NavLinks";
import { weddingNames } from "@/lib/settings";

export async function SiteHeader() {
  const names = await weddingNames();
  return (
    <header className="mx-auto w-full max-w-5xl px-5 pt-6 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt={`${names} — Nosso Dia`}
            width={1008}
            height={1063}
            priority
            className="h-11 w-auto shrink-0 md:h-12"
          />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg text-navy-900 sm:text-xl">{names}</span>
            <span className="text-[0.62rem] uppercase tracking-[0.32em] text-navy-800/60">
              Nosso dia
            </span>
          </span>
        </Link>
        <nav aria-label="Navegação principal" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-navy-800/75 transition-colors hover:text-navy-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <Mosquitinho className="mt-4 h-8 w-full text-gold-500/45" />
    </header>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-900/10 bg-ivory/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <NavLinks />
    </nav>
  );
}
