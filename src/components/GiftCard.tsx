import Link from "next/link";
import { GiftArt } from "@/components/GiftArt";
import { formatBRL } from "@/lib/format";
import type { GiftRow } from "@/lib/queries";

export function GiftCard({ gift }: { gift: GiftRow }) {
  return (
    <Link
      href={`/presentes/${gift.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-navy-900/10 bg-white shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-lift active:scale-[0.98]"
    >
      <div className="relative overflow-hidden">
        <GiftArt name={gift.name} category={gift.category} className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-xl leading-snug text-navy-900">{gift.name}</h3>
        <p className="flex-1 text-sm leading-relaxed text-navy-800/70">{gift.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-navy-900/10 pt-4">
          <span className="font-display text-lg text-navy-900">{formatBRL(gift.amount_cents)}</span>
          <span className="text-xs uppercase tracking-[0.2em] text-gold-700 transition-colors group-hover:text-gold-600 font-body">
            Presentear
          </span>
        </div>
        {gift.total_quantity > 1 ? (
          <p className="mt-1 text-[0.7rem] uppercase tracking-wider text-navy-800/40 font-body">
            {gift.total_quantity - gift.sold_quantity} de {gift.total_quantity} cotas disponíveis
          </p>
        ) : null}
      </div>
    </Link>
  );
}