import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GiftArtRive } from "@/components/GiftArtRive";
import { PixPanel } from "@/components/PixPanel";
import { formatBRL, toIso } from "@/lib/format";
import { findGiftBySlug, findPaymentByPublicId } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Pagamento Pix",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PixPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const gift = await findGiftBySlug(slug);
  const payment = query.p ? await findPaymentByPublicId(query.p) : undefined;

  if (!gift) notFound();
  if (!payment || payment.gift_id !== gift.id) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-2xl text-navy-900">Nenhuma cobrança aberta</h1>
        <p className="mt-3 text-sm text-navy-800/70">
          Volte para o presente e toque em “Quero presentear” para gerar o Pix.
        </p>
        <Link
          href={`/presentes/${gift.slug}`}
          className="mt-7 inline-block rounded-full border border-navy-900/25 px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy-900"
        >
          Ver o presente
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pt-6">
      <Link
        href={`/presentes/${gift.slug}`}
        className="text-xs uppercase tracking-[0.2em] text-navy-800/60 transition-colors hover:text-gold-700"
      >
        ← Voltar para o presente
      </Link>

      <div className="mt-5 overflow-hidden rounded-card border border-navy-900/10 bg-white shadow-soft">
        <div className="border-b border-navy-900/8 bg-ivory px-6 py-6 text-center">
          {/* Ilustracao: sem radius proprio, e o card que recorta.
              Radius dentro de radius e o que ficava estranho. */}
          <GiftArtRive 
            imageKey={gift.image_key} 
            className="mx-auto h-24 w-24" 
          />
          <p className="mt-4 text-[0.65rem] uppercase tracking-[0.24em] text-navy-800/55">
            Seu presente
          </p>
          <h1 className="mt-2 font-display text-xl text-navy-900 text-balance">{gift.name}</h1>
          <p className="mt-1 font-display text-lg text-gold-700">{formatBRL(gift.amount_cents)}</p>
        </div>

        <div className="px-6 py-8">
          <PixPanel
            payment={{
              publicId: payment.public_id,
              status: payment.status,
              pixAvailable: Boolean(payment.pix_code),
              claimed: Boolean(payment.claimed_at),
              confirmHref: `/presentes/${gift.slug}/confirmacao?p=${payment.public_id}`,
              expiresAt:
                payment.provider === "openpix"
                  ? toIso(payment.expires_at)
                  : null,
            }}
          />
        </div>
      </div>
    </div>
  );
}