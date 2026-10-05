import Link from "next/link";
import { CallLily, Flourish, Trigo } from "@/components/Botanical";
import { GiftCard } from "@/components/GiftCard";
import { getSetting, weddingDateLabel, weddingNames } from "@/lib/settings";
import { listActiveGifts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [names, date, gifts, heroTitle, storyTitle, storyText] = await Promise.all([
    weddingNames(),
    weddingDateLabel(),
    listActiveGifts(),
    getSetting("hero_title"),
    getSetting("story_title"),
    getSetting("story_text"),
  ]);
  const featured = gifts.slice(0, 3);

  return (
    <main className="fade-in">
      <section className="relative pt-12 text-center md:pt-20">
        <CallLily className="mx-auto h-20 w-12 text-gold-500/60" />
        <h1 className="mt-8 font-display text-5xl leading-[1.05] text-navy-900 text-balance sm:text-6xl md:text-7xl">
          {names}
        </h1>
        {date ? (
          <p className="mt-5 text-xs uppercase tracking-[0.45em] text-navy-800/60 font-body">{date}</p>
        ) : null}
        <Flourish className="mx-auto mt-8 h-6 w-48 text-gold-500/70" />
        <p className="mx-auto mt-8 max-w-lg text-[1.05rem] leading-relaxed text-navy-800/80 text-balance">
          {heroTitle}
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <Link
            href="/presentes"
            className="w-full sm:w-auto rounded-full bg-navy-900 px-10 py-4 text-sm uppercase tracking-[0.2em] text-ivory shadow-lift transition-all duration-300 hover:bg-navy-800 hover:shadow-soft active:scale-[0.97]"
          >
            Presentear
          </Link>
          <Link
            href="/fotos"
            className="w-full sm:w-auto rounded-full border border-navy-900/20 px-10 py-4 text-sm uppercase tracking-[0.2em] text-navy-900 transition-all duration-300 hover:border-gold-500 hover:text-gold-700 active:scale-[0.97]"
          >
            Deixar uma foto
          </Link>
        </div>
      </section>

      <section className="mt-28 slide-up text-center">
        <Trigo className="mx-auto h-16 w-8 text-gold-500/40" />
        <h2 className="mt-6 font-display text-3xl text-navy-900 text-balance sm:text-4xl">
          {storyTitle}
        </h2>
        <div className="rule-gold mx-auto mt-6 w-32" />
        <p className="mx-auto mt-8 max-w-prose whitespace-pre-line text-[1.05rem] leading-relaxed text-navy-800/80 text-pretty">
          {storyText}
        </p>
      </section>

      <section className="mt-28">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-navy-900">Presentes</h2>
          <Link
            href="/presentes"
            className="text-xs uppercase tracking-[0.2em] text-gold-700 underline-offset-8 hover:underline font-body"
          >
            Ver todos
          </Link>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((gift) => (
            <GiftCard key={gift.id} gift={gift} />
          ))}
        </div>
      </section>

      <section className="mt-28 overflow-hidden rounded-card border border-navy-900/10 bg-navy-900 px-8 py-16 text-center text-ivory shadow-lift md:px-16 slide-up">
        <Trigo className="mx-auto h-16 w-8 text-gold-400/60" />
        <h2 className="mt-6 font-display text-3xl text-balance sm:text-4xl">
          Compartilhe um momento com a gente
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ivory/70">
          Abra a câmera, tire uma foto e envie. Ela vai direto para o nosso Drive, sem passar por rede
          social nenhuma.
        </p>
        <Link
          href="/fotos"
          className="mt-10 inline-block rounded-full bg-gold-500 px-10 py-4 text-sm uppercase tracking-[0.2em] text-navy-950 transition-all duration-300 hover:bg-gold-400 hover:shadow-soft active:scale-[0.97]"
        >
          Enviar uma foto
        </Link>
      </section>
    </main>
  );
}