import Link from "next/link";
import { Monogram, Mosquitinho } from "@/components/Botanical";
import { weddingNames } from "@/lib/settings";

const NAV = [
  { href: "/", label: "Início", icon: HomeIcon },
  { href: "/presentes", label: "Presentes", icon: GiftIcon },
  { href: "/fotos", label: "Fotos", icon: CameraIcon },
];

export async function SiteHeader() {
  const names = await weddingNames();
  return (
    <header className="mx-auto w-full max-w-5xl px-5 pt-6 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <Monogram className="h-10 w-10 text-gold-600 transition-transform duration-500 group-hover:rotate-[8deg]" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg text-navy-900 sm:text-xl">{names}</span>
            <span className="text-[0.62rem] uppercase tracking-[0.32em] text-navy-800/60">
              Deixa aqui
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
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[0.65rem] uppercase tracking-widest text-navy-800/70 transition-colors active:text-gold-700"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 11l8-6 8 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10.5V19h11v-8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GiftIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="9" width="16" height="10" rx="1.2" />
      <path d="M4 13h16M12 9v10" strokeLinecap="round" />
      <path d="M12 9c-2.5 0-4.5-.6-4.5-2.2C7.5 5.6 8.6 5 9.6 5c1.4 0 2.4 1.8 2.4 4zM12 9c2.5 0 4.5-.6 4.5-2.2 0-1.2-1.1-1.8-2.1-1.8-1.4 0-2.4 1.8-2.4 4z" />
    </svg>
  );
}

function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}