import Link from "next/link";
import { CallLily, Flourish, Trigo } from "@/components/Botanical";
import { GiftCard } from "@/components/GiftCard";
import { getSetting, weddingDateLabel, weddingNames } from "@/lib/settings";
import { listActiveGifts } from "@/lib/queries";
import { WeddingHub } from "@/components/WeddingHub";

export const dynamic = "force-dynamic";

const story = [
  "Tem coisas que a gente não percebe enquanto está vivendo. Um dia é só mais um dia, um plano vira outro, uma conversa vira madrugada, uma ideia vira projeto — e, quando a gente percebe, já existe uma vida inteira sendo construída a dois.",
  "A nossa foi acontecendo assim.",
  "Hoje, a gente divide mais do que uma casa. Divide rotina, planos, decisões, descobertas, restaurantes novos, viagens, filmes, livros, risadas e aquelas conversas que parecem não ter fim.",
  "A gente também divide os sonhos. Os que já existem, os que ainda estão no papel e os que vão aparecendo pelo caminho. Tem lugar que a gente quer conhecer, coisas que ainda quer viver e projetos que mal começaram, mas que já fazem parte dos nossos planos.",
  "No meio disso tudo, existe uma coisa que a gente escolhe todos os dias: continuar construindo uma vida que tenha a nossa cara.",
  "Este casamento é parte disso.",
  "É uma celebração de tudo o que somos hoje, das pessoas que caminharam com a gente até aqui e de tudo aquilo que ainda vem pela frente.",
  "Por isso, mais do que celebrar uma data, a gente quer celebrar a nossa vida juntas — do jeito que ela é: cheia de planos, carinho, histórias, pequenas aventuras e muito amor.",
  "E ter vocês por perto para viver esse momento com a gente deixa tudo ainda mais especial.",
];

export default async function HomePage() {
  const [names, date, gifts, heroTitle, rawDate, time, venue, address, mapsUrl, parking, invitationUrl, dressCode] = await Promise.all([
    weddingNames(),
    weddingDateLabel(),
    listActiveGifts(),
    getSetting("hero_title"),
    getSetting("wedding_date"),
    getSetting("wedding_time"),
    getSetting("wedding_venue"),
    getSetting("wedding_address"),
    getSetting("wedding_maps_url"),
    getSetting("wedding_parking"),
    getSetting("wedding_invitation_url"),
    getSetting("wedding_dress_code"),
  ]);
  const featured = gifts.slice(0, 3);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const phase = rawDate ? (today < rawDate ? "before" : today === rawDate ? "today" : "after") : "before";
  const daysUntil = rawDate && phase === "before"
    ? Math.ceil((Date.parse(`${rawDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000)
    : null;

  return (
    <div className="fade-in flex flex-col gap-20 md:gap-24">
      <section className="relative pt-8 text-center md:pt-12">
        <CallLily className="mx-auto h-20 w-12 text-gold-500/60" />
        <h1 className="mx-auto mt-8 max-w-full font-display text-5xl text-navy-900 text-balance sm:text-6xl md:text-7xl">
          {names}
        </h1>
        {date ? (
          <p className="mt-5 text-xs uppercase tracking-widest text-navy-800/60 font-body">{date}</p>
        ) : null}
        <Flourish className="mx-auto mt-8 h-6 w-48 text-gold-500/70" />
        <p className="mx-auto mt-8 max-w-lg text-lg leading-relaxed text-navy-800/80 text-balance">
          {heroTitle}
        </p>

        <div className="mx-auto mt-10 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <Link
            href="/presentes"
            className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-navy-900 px-6 py-4 text-center text-sm font-medium uppercase tracking-widest text-ivory shadow-soft transition-[transform,box-shadow,background-color] duration-200 hover:bg-navy-800 hover:shadow-lift active:scale-[0.98] motion-reduce:active:scale-100"
          >
            <span aria-hidden="true">🎁</span>
            <span>Quero presentear</span>
          </Link>
          <Link
            href="/fotos"
            className="flex min-h-14 items-center justify-center gap-2 rounded-full border border-navy-900/20 px-6 py-4 text-center text-sm font-medium uppercase tracking-widest text-navy-900 transition-[transform,border-color,color] duration-200 hover:border-gold-500 hover:text-gold-700 active:scale-[0.98] motion-reduce:active:scale-100"
          >
            <span aria-hidden="true">📸</span>
            <span>Deixar uma foto</span>
          </Link>
        </div>

      </section>

      <WeddingHub
        names={names}
        dateLabel={date}
        date={rawDate ?? ""}
        time={time || "19:30"}
        venue={venue ?? ""}
        address={address ?? ""}
        mapsUrl={mapsUrl || "https://share.google/D9bzAuECKilvEbU6t"}
        parking={parking ?? ""}
        invitationUrl={invitationUrl || "https://drive.google.com/file/d/1-0Xc7VTBQ14IW-3yRS46n5BB0X3AeaJ9/view?usp=sharing"}
        dressCode={dressCode || "Social"}
      />

      <section id="nossa-historia" className="scroll-mt-8 text-center slide-up">
        <Trigo className="mx-auto h-16 w-8 text-gold-500/40" />
        <h2 className="mt-6 font-display text-3xl text-navy-900 text-balance sm:text-4xl">Nossa história</h2>
        <div className="rule-gold mx-auto mt-6 w-32" />
        <div className="mx-auto mt-8 max-w-prose space-y-5 text-left text-base leading-relaxed text-navy-800/80 text-pretty sm:text-lg">
          {story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p className="pt-2 text-right font-display text-xl font-semibold text-navy-900">Jéssica & Jennifer</p>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-navy-900 text-balance sm:text-4xl">Presentes</h2>
          <Link
            href="/presentes"
            className="shrink-0 text-xs uppercase tracking-widest text-gold-700 underline-offset-8 hover:underline font-body"
          >
            Ver todos
          </Link>
        </div>
        <div className="mt-8 grid items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {featured.map((gift) => (
            <GiftCard key={gift.id} gift={gift} />
          ))}
        </div>
      </section>

      <section className="slide-up">
        <div className="overflow-hidden rounded-card border border-navy-900/10 bg-navy-900 px-6 py-12 text-center text-ivory shadow-soft sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <Trigo className="mx-auto h-16 w-8 text-gold-400/60" />
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl text-balance sm:text-4xl">
            {phase === "today" ? "Está acontecendo! Deixe uma foto com a gente." : phase === "after" ? "As memórias do nosso dia" : "Compartilhe um momento com a gente"}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ivory/70 text-pretty">
            {phase === "today" ? "Faça parte das lembranças deste dia e compartilhe uma foto com a gente." : phase === "after" ? "Ajude a guardar as lembranças do nosso casamento compartilhando uma foto." : "Abra a câmera, tire uma foto ou escolha uma imagem do celular para compartilhar."}
          </p>
          <Link
            href="/fotos"
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-gold-500 px-8 py-4 text-center text-sm font-medium uppercase tracking-widest text-navy-950 transition-[transform,box-shadow,background-color] duration-200 hover:bg-gold-400 hover:shadow-soft active:scale-[0.98] motion-reduce:active:scale-100 sm:px-10"
          >
            Enviar uma foto
          </Link>
        </div>

        {daysUntil !== null ? (
          <p className="mt-6 text-center text-xs uppercase tracking-widest text-navy-800/55">
            {daysUntil === 1 ? "É amanhã" : `Faltam ${daysUntil} dias para o nosso dia`}
          </p>
        ) : phase === "today" || phase === "after" ? (
          <p className="mt-6 text-center font-display text-lg text-gold-700">{phase === "today" ? "É hoje. 💙" : "Nosso dia foi lindo."}</p>
        ) : null}
      </section>
    </div>
  );
}
