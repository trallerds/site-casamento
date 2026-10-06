import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md py-24 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-700">Página não encontrada</p>
      <h1 className="mt-4 font-display text-3xl text-navy-900">Vamos voltar para o nosso dia?</h1>
      <p className="mt-3 text-sm leading-relaxed text-navy-800/70">
        Este endereço não está disponível. Você pode voltar ao início ou conferir a lista de presentes.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="rounded-full bg-navy-900 px-7 py-4 text-sm uppercase tracking-wider text-ivory">
          Ir para o início
        </Link>
        <Link href="/presentes" className="rounded-full border border-navy-900/20 px-7 py-4 text-sm uppercase tracking-wider text-navy-900">
          Ver presentes
        </Link>
      </div>
    </main>
  );
}
