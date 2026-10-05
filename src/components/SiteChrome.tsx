import Image from "next/image";
import Link from "next/link";
import { Mosquitinho } from "@/components/Botanical";
import { NavLinks } from "@/components/NavLinks";
import { weddingNames } from "@/lib/settings";

export async function SiteHeader() {
  const names = await weddingNames();
  return (
    <header className="shell pt-8 pb-4">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label={`${names} — início`} className="flex items-center gap-4 group">
          <Image
            src="/logo.jpg"
            alt=""
            width={1008}
            height={1063}
            priority
            className="h-12 w-auto shrink-0 md:h-14 transition-transform duration-500 group-hover:scale-105"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl text-navy-900 sm:text-2xl">{names}</span>
            <span className="text-[0.65rem] uppercase tracking-[0.35em] text-navy-800/60 font-body">
              Nosso dia
            </span>
          </div>
        </Link>
        <nav aria-label="Navegação principal" className="hidden md:block">
          <NavLinks variant="top" />
        </nav>
      </div>
      <div className="mt-6 overflow-hidden">
        <Mosquitinho className="h-10 w-full text-gold-500/40" />
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-900/10 bg-ivory/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <NavLinks />
    </nav>
  );
}
