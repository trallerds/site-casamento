import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GiftArt } from "@/components/GiftArt";
import { StartGiftButton } from "@/components/StartGiftButton";
import { formatBRL } from "@/lib/format";
import { findGiftBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gift = await findGiftBySlug(slug);
  if (!gift) return { title: "Presente" };
  return { title: gift.name, description: gift.description };
}

export default async function GiftDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gift = await findGiftBySlug(slug);
  if (!gift || !gift.active) notFound();

  return (
    <article className="mx-auto max-w-2xl pt-6">
      <Link
        href="/presentes"
        className="text-xs uppercase tracking-[0.2em] text-navy-800/60 transition-colors hover:text-gold-700"
      >
        ← Todos os presentes
      </Link>

      <div className="mt-5 overflow-hidden rounded-card border border-navy-900/10 bg-white shadow-soft">
        <GiftArt 
          imageKey={gift.image_key} 
          className="aspect-[16/10] w-full" 
        />
        <div className="px-6 py-8 text-center md:px-10">

          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-gold-700">{gift.category}</p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-navy-900 text-balance md:text-4xl">
            {gift.name}
          </h1>
          <p className="mt-4 text-[0.98rem] leading-relaxed text-navy-800/75">{gift.description}</p>

          <div className="rule-gold my-7" />

          <p className="font-display text-2xl text-navy-900">{formatBRL(gift.amount_cents)}</p>
           <p className="mt-1 text-xs text-navy-800/55">
             Valor sugerido. Contribua com o quanto fizer sentido para você.
           </p>


          <div className="mt-8">
            <StartGiftButton giftId={gift.id} slug={gift.slug} />
          </div>

          <p className="mt-5 text-xs leading-relaxed text-navy-800/55">
            Ao continuar você recebe um Pix Copia e Cola para pagar no aplicativo do seu banco. Nenhum
            dado do seu banco passa por este site.
          </p>
        </div>
      </div>
    </article>
  );
}