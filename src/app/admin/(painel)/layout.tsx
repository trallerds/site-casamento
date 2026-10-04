import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/presentes", label: "Presentes" },
  { href: "/admin/pagamentos", label: "Pagamentos" },
  { href: "/admin/fotos", label: "Fotos" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  return (
    <div className="mx-auto min-h-dvh w-full max-w-6xl px-5 pb-20 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-900/10 py-6">
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.3em] text-gold-700">Área das noivas</p>
          <p className="font-display text-xl text-navy-900">Deixa Aqui</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-navy-900/15 px-4 py-2 text-xs uppercase tracking-[0.16em] text-navy-800/70 hover:text-navy-900"
          >
            Ver site
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-navy-900/15 px-4 py-2 text-xs uppercase tracking-[0.16em] text-navy-800/70 hover:text-navy-900"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <nav className="-mx-5 mt-5 overflow-x-auto px-5 md:mx-0 md:px-0">
        <ul className="flex w-max gap-2 pb-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="whitespace-nowrap rounded-full border border-navy-900/15 px-4 py-2 text-xs uppercase tracking-[0.16em] text-navy-800/70 transition hover:border-gold-500 hover:text-gold-700"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}