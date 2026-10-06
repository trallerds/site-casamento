import Link from "next/link";
import { GiftArt } from "@/components/GiftArt";
import { formatBRL } from "@/lib/format";
import type { GiftRow } from "@/lib/queries";

export function GiftCard({ gift }: { gift: GiftRow }) {
  return (
    <Link
      href={`/presentes/${gift.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-navy-900/10 bg-white shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-lift active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <div className="relative overflow-hidden">
        <GiftArt 
          imageKey={gift.slug}
          className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-xl leading-snug text-navy-900">{gift.name}</h3>
        <p className="flex-1 text-sm leading-relaxed text-navy-800/70">{gift.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-navy-900/10 pt-4">
          <span className="font-display text-lg text-navy-900">{formatBRL(gift.amount_cents)}</span>
          <span className="text-xs uppercase tracking-widest text-gold-700 transition-colors group-hover:text-gold-600 font-body">
            Presentear
          </span>
        </div>
      </div>
    </Link>
  );
}
