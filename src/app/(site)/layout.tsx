import { BottomNav, SiteHeader } from "@/components/SiteChrome";
import { weddingDateLabel, weddingNames } from "@/lib/settings";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(120%_80%_at_50%_0%,rgba(200,168,90,0.16),transparent_60%)]" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-6 md:px-8 md:pb-0">{children}</main>
      <SiteFooter />
      <BottomNav />
    </>
  );
}

async function SiteFooter() {
  const names = await weddingNames();
  const date = await weddingDateLabel();
  return (
    <footer className="mx-auto mt-20 w-full max-w-5xl px-5 pb-28 pt-10 text-center md:px-8 md:pb-12">
      <div className="rule-gold mb-8" />
      <p className="font-display text-lg text-navy-900">{names}</p>
      {date ? <p className="mt-1 text-sm text-navy-800/70">{date}</p> : null}
      <p className="mt-4 text-xs text-navy-800/60">
        As fotos enviadas ficam guardadas pelas noivas e não são publicadas automaticamente.{" "}
        <a
          href="/politica-de-privacidade"
          className="underline decoration-gold-500/60 underline-offset-4"
        >
          Política de privacidade
        </a>
      </p>
    </footer>
  );
}