import Link from "next/link";
import { GiftArt } from "@/components/GiftArt";
import { formatBRL } from "@/lib/format";
import type { GiftRow } from "@/lib/queries";

export function GiftCard({ gift }: { gift: GiftRow }) {
  return (
    <Link
      href={`/presentes/${gift.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-navy-900/10 bg-white shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift active:-translate-y-0.5"
    >
      <GiftArt name={gift.name} category={gift.category} className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg leading-snug text-navy-900">{gift.name}</h3>
        <p className="flex-1 text-sm leading-relaxed text-navy-800/70">{gift.description}</p>
        <div className="mt-3 flex items-center justify-between border-t border-navy-900/8 pt-4">
          <span className="font-display text-base text-navy-900">{formatBRL(gift.amount_cents)}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-gold-700 transition-colors group-hover:text-gold-600">
            Presentear
          </span>
        </div>
        {gift.total_quantity > 1 ? (
          <p className="mt-2 text-xs text-navy-800/55">
            {gift.total_quantity - gift.sold_quantity} de {gift.total_quantity} cotas disponíveis
          </p>
        ) : null}
      </div>
    </Link>
  );
}