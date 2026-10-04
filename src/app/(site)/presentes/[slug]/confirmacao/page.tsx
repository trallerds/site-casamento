import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flourish } from "@/components/Botanical";
import { findGiftBySlug, findPaymentByPublicId } from "@/lib/queries";
import { weddingNames } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Presente recebido",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const gift = await findGiftBySlug(slug);
  const payment = query.p ? await findPaymentByPublicId(query.p) : undefined;

  if (!gift || !payment || payment.gift_id !== gift.id) notFound();

  if (payment.status !== "paid") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-2xl text-navy-900">Quase lá</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-800/75">
          Quando o pagamento for confirmado, o presente aparece aqui para as noivas. Pode fechar esta
          tela: nós avisamos.
        </p>
        <Link
          href={`/presentes/${slug}/pix?p=${payment.public_id}`}
          className="mt-7 inline-block rounded-full bg-navy-900 px-8 py-4 text-sm uppercase tracking-[0.2em] text-ivory"
        >
          Ver o Pix
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-gold-700">Presente recebido</p>
      <h1 className="mt-4 font-display text-3xl leading-tight text-navy-900 text-balance">
        {gift.name} acaba de ganhar um patrocinador
      </h1>
      <Flourish className="mx-auto mt-6 h-5 w-40 text-gold-500/80" />
      <p className="mt-6 text-[0.98rem] leading-relaxed text-navy-800/80">
        Obrigada por fazer parte desse momento. Um pedacinho do nosso dia já é seu também.
      </p>
      <p className="mt-6 text-sm text-navy-800/60">{await weddingNames()}</p>

      <div className="mt-10 flex flex-col gap-3 sm:flex_row sm:justify-center">
        <Link
          href="/presentes"
          className="rounded-full bg-navy-900 px-8 py-4 text-sm uppercase tracking-[0.2em] text-ivory"
        >
          Presentear outro item
        </Link>
        <Link
          href="/fotos"
          className="rounded-full border border-navy-900/25 px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy-900"
        >
          Deixar uma foto
        </Link>
      </div>
    </div>
  );
}