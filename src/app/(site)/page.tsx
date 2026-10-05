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
    <>
      <section className="relative pt-10 text-center md:pt-16">
        <CallLily className="mx-auto h-16 w-10 text-gold-500/70" />
        <h1 className="mt-6 font-display text-4xl leading-[1.1] text-navy-900 text-balance sm:text-5xl md:text-6xl">
          {names}
        </h1>
        {date ? (
          <p className="mt-3 text-xs uppercase tracking-[0.4em] text-navy-800/60">{date}</p>
        ) : null}
        <Flourish className="mx-auto mt-6 h-5 w-40 text-gold-500/80" />
        <p className="mx-auto mt-6 max-w-md text-[0.98rem] leading-relaxed text-navy-800/80 text-balance">
          {heroTitle}
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/presentes"
            className="rounded-full bg-navy-900 px-8 py-4 text-sm uppercase tracking-[0.2em] text-ivory shadow-soft transition hover:bg-navy-800 active:scale-[0.98]"
          >
            Presentear
          </Link>
          <Link
            href="/fotos"
            className="rounded-full border border-navy-900/25 px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy-900 transition hover:border-gold-500 hover:text-gold-700 active:scale-[0.98]"
          >
            Deixar uma foto
          </Link>
        </div>
      </section>

      {/* Mesma linguagem do hero e da lista: bloco centralizado com
          medida curta. Texto colado na esquerda com a metade
          direita vazia era o que desequilibrava a pagina. */}
      <section className="mt-20 text-center">
        <Trigo className="mx-auto h-12 w-6 text-gold-500/50" />
        <h2 className="mt-5 font-display text-2xl text-navy-900 text-balance sm:text-3xl">
          {storyTitle}
        </h2>
        <div className="rule-gold mx-auto mt-4 w-24" />
        <p className="mx-auto mt-5 max-w-prose whitespace-pre-line text-[0.98rem] leading-relaxed text-navy-800/80 text-pretty">
          {storyText}
        </p>
      </section>

      <section className="mt-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-navy-900">Presentes</h2>
          <Link
            href="/presentes"
            className="text-xs uppercase tracking-[0.2em] text-gold-700 underline-offset-4 hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((gift) => (
            <GiftCard key={gift.id} gift={gift} />
          ))}
        </div>
      </section>

      <section className="mt-20 overflow-hidden rounded-card border border-navy-900/10 bg-navy-900 px-6 py-12 text-center text-ivory shadow-soft md:px-12">
        <Trigo className="mx-auto h-14 w-7 text-gold-400/70" />
        <h2 className="mt-5 font-display text-2xl text-balance sm:text-3xl">
          Compartilhe um momento com a gente
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ivory/75">
          Abra a câmera, tire uma foto e envie. Ela vai direto para o nosso Drive, sem passar por rede
          social nenhuma.
        </p>
        <Link
          href="/fotos"
          className="mt-7 inline-block rounded-full bg-gold-500 px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy-950 transition hover:bg-gold-400 active:scale-[0.98]"
        >
          Enviar uma foto
        </Link>
      </section>
    </>
  );
}